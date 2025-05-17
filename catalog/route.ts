import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions"; // Corrigido para importar de src/lib/authOptions.ts
import prisma from "@/lib/prisma";

// POST: Adicionar um novo resultado ao catalogador manual
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const { isWin, multiplier } = await request.json();
    if (typeof isWin !== 'boolean' || typeof multiplier !== 'number') {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    const newResult = await prisma.manualCrashResult.create({
      data: {
        userId: session.user.id,
        isWin,
        multiplier,
      },
    });
    return NextResponse.json(newResult, { status: 201 });
  } catch (error) {
    console.error("Erro ao salvar resultado manual:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

// GET: Obter todos os resultados do catalogador manual para o usuário logado
export async function GET(/*request: Request*/) { 
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const results = await prisma.manualCrashResult.findMany({
      where: { userId: session.user.id },
      orderBy: { timestamp: "asc" }, 
    });
    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar resultados manuais:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

// DELETE: Limpar histórico ou desfazer última entrada
export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action"); 

  try {
    if (action === "clearAll") {
      await prisma.manualCrashResult.deleteMany({
        where: { userId: session.user.id },
      });
      return NextResponse.json({ message: "Histórico limpo com sucesso" }, { status: 200 });
    } else if (action === "undoLast") {
      const lastResult = await prisma.manualCrashResult.findFirst({
        where: { userId: session.user.id },
        orderBy: { timestamp: "desc" },
      });

      if (lastResult) {
        await prisma.manualCrashResult.delete({
          where: { id: lastResult.id },
        });
        return NextResponse.json({ message: "Última entrada desfeita" }, { status: 200 });
      } else {
        return NextResponse.json({ message: "Nenhuma entrada para desfazer" }, { status: 404 });
      }
    }
    return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
  } catch (error) {
    console.error("Erro ao deletar resultado manual:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

