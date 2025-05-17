import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions"; // Corrigido para importar de src/lib/authOptions.ts
import prisma from "@/lib/prisma";
import { ManualCrashResult, AiLearnedPattern as PrismaAiLearnedPattern, AiSuggestion as PrismaAiSuggestion } from '@prisma/client';

interface PatternStats {
  pattern: string;
  occurrences: number;
  wins: number;
  winRate: number;
}

const MIN_OCCURRENCES_FOR_RELIABLE_PATTERN = 5;
const PATTERN_LENGTH = 6;

async function analyzePatternsFromHistory(history: ManualCrashResult[]): Promise<PatternStats[]> {
  const patternMap = new Map<string, { occurrences: number; wins: number }>();

  if (history.length < PATTERN_LENGTH + 1) {
    return [];
  }

  for (let i = 0; i <= history.length - (PATTERN_LENGTH + 1); i++) {
    const patternSequenceArray = history.slice(i, i + PATTERN_LENGTH);
    const patternString = patternSequenceArray.map(r => r.isWin ? "G" : "B").join("");
    const nextResult = history[i + PATTERN_LENGTH];

    const currentStats = patternMap.get(patternString) || { occurrences: 0, wins: 0 };
    currentStats.occurrences++;
    if (nextResult.isWin) {
      currentStats.wins++;
    }
    patternMap.set(patternString, currentStats);
  }

  const allPatternStats: PatternStats[] = [];
  for (const [pattern, stats] of patternMap.entries()) {
    if (stats.occurrences >= MIN_OCCURRENCES_FOR_RELIABLE_PATTERN) {
      allPatternStats.push({
        pattern,
        occurrences: stats.occurrences,
        wins: stats.wins,
        winRate: parseFloat((stats.wins / stats.occurrences).toFixed(2)),
      });
    }
  }
  
  for (const stat of allPatternStats) {
    await prisma.aiLearnedPattern.upsert({
      where: { patternSequence: stat.pattern },
      update: {
        nextResultWinRate: stat.winRate,
        totalOccurrences: stat.occurrences,
        winOccurrences: stat.wins,
        lastSeen: new Date(),
      },
      create: {
        patternSequence: stat.pattern,
        nextResultWinRate: stat.winRate,
        totalOccurrences: stat.occurrences,
        winOccurrences: stat.wins,
      },
    });
  }

  return allPatternStats.sort((a, b) => b.winRate - a.winRate || b.occurrences - a.occurrences);
}

export async function POST(/*request: Request*/) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const userHistory = await prisma.manualCrashResult.findMany({
      where: { userId: session.user.id },
      orderBy: { timestamp: "asc" },
    });

    const analyzedPatterns = await analyzePatternsFromHistory(userHistory);
    
    const topPatterns = analyzedPatterns
      .filter(p => p.winRate >= 0.80)
      .sort((a, b) => b.winRate - a.winRate || b.occurrences - a.occurrences)
      .slice(0, 17);

    await prisma.userIdentifiedPattern.deleteMany({
        where: {
            userId: session.user.id,
            source: "IA_Top17"
        }
    });

    for (const tp of topPatterns) {
        await prisma.userIdentifiedPattern.upsert({
            where: {
                userId_patternSequence_source: {
                    userId: session.user.id,
                    patternSequence: tp.pattern,
                    source: "IA_Top17"
                }
            },
            update: { expectedResult: "G" },
            create: {
                userId: session.user.id,
                patternSequence: tp.pattern,
                expectedResult: "G",
                source: "IA_Top17"
            }
        });
    }

    return NextResponse.json({ message: "Análise de padrões concluída", topPatternsFromAnalysis: topPatterns }, { status: 200 });
  } catch (error) {
    console.error("Erro na análise de padrões da IA:", error);
    return NextResponse.json({ error: "Erro interno do servidor ao analisar padrões" }, { status: 500 });
  }
}

export async function GET(/*request: Request*/) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
  
    try {
      const userHistory = await prisma.manualCrashResult.findMany({
        where: { userId: session.user.id },
        orderBy: { timestamp: "desc" },
        take: PATTERN_LENGTH,
      });

      let newAiSuggestion: PrismaAiSuggestion | null = null;

      if (userHistory.length === PATTERN_LENGTH) {
        const currentPatternString = userHistory.reverse().map(r => r.isWin ? "G" : "B").join("");
        const learnedPattern: PrismaAiLearnedPattern | null = await prisma.aiLearnedPattern.findUnique({
            where: { patternSequence: currentPatternString }
        });

        if (learnedPattern && learnedPattern.totalOccurrences >= MIN_OCCURRENCES_FOR_RELIABLE_PATTERN) {
            if (learnedPattern.nextResultWinRate >= 0.75) { 
                newAiSuggestion = await prisma.aiSuggestion.create({
                    data: {
                        userId: session.user.id,
                        triggeringPattern: currentPatternString,
                        suggestedOutcome: "GREEN",
                        confidence: learnedPattern.nextResultWinRate,
                        aiLearnedPatternId: learnedPattern.id
                    }
                });
            } else if (learnedPattern.nextResultWinRate <= 0.35) {
                 newAiSuggestion = await prisma.aiSuggestion.create({
                    data: {
                        userId: session.user.id,
                        triggeringPattern: currentPatternString,
                        suggestedOutcome: "BLACK_PROBABLE",
                        confidence: (1 - learnedPattern.nextResultWinRate),
                        aiLearnedPatternId: learnedPattern.id
                    }
                });
            } else {
                 newAiSuggestion = await prisma.aiSuggestion.create({
                    data: {
                        userId: session.user.id,
                        triggeringPattern: currentPatternString,
                        suggestedOutcome: "WAIT",
                        confidence: Math.abs(0.5 - learnedPattern.nextResultWinRate),
                        aiLearnedPatternId: learnedPattern.id
                    }
                });
            }
        }
      }
      
      const allSuggestions = await prisma.aiSuggestion.findMany({
        where: { userId: session.user.id },
        orderBy: { timestamp: "desc" },
        take: 50, 
        include: { aiLearnedPattern: true }
      });

      return NextResponse.json({ currentSuggestion: newAiSuggestion, history: allSuggestions }, { status: 200 });
    } catch (error) {
      console.error("Erro ao buscar sugestões da IA:", error);
      return NextResponse.json({ error: "Erro interno do servidor ao buscar sugestões" }, { status: 500 });
    }
  }

export async function DELETE(/*request: Request*/) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    try {
        await prisma.aiSuggestion.deleteMany({
            where: { userId: session.user.id }
        });
        return NextResponse.json({ message: "Histórico de sugestões da IA limpo com sucesso" }, { status: 200 });
    } catch (error) {
        console.error("Erro ao limpar histórico de sugestões da IA:", error);
        return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
    }
}

