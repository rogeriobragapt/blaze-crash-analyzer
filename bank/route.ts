import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions"; // Corrigido para importar de src/lib/authOptions.ts
import prisma from "@/lib/prisma";
import { BankSetting } from "@prisma/client";

interface BankSettingUpdateData {
  initialBankroll?: number;
  profitTarget?: number;
  initialCycleStake?: number;
  stopLossPercentage?: number;
  defaultMultiplier?: number;
  isActive?: boolean;
  currentBankroll?: number | null;
  currentStake?: number | null;
}

export async function GET(/*request: Request*/) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    let bankSettings = await prisma.bankSetting.findUnique({
      where: { userId: session.user.id },
    });

    if (!bankSettings) {
      bankSettings = await prisma.bankSetting.create({
        data: {
          userId: session.user.id,
          initialBankroll: 500,
          profitTarget: 400,
          initialCycleStake: 25,
          stopLossPercentage: 20,
          defaultMultiplier: 2.0,
          isActive: false,
        },
      });
    }
    return NextResponse.json(bankSettings, { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar configurações de banca:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const data = await request.json();
    const { 
        initialBankroll,
        profitTarget,
        initialCycleStake,
        stopLossPercentage,
        defaultMultiplier,
        isActive,
        currentBankroll,
        currentStake
    } = data;

    if (initialBankroll === undefined && isActive === undefined && currentBankroll === undefined && currentStake === undefined) {
        return NextResponse.json({ error: "Dados inválidos para atualizar banca" }, { status: 400 });
    }

    const updateData: BankSettingUpdateData = {};
    if (initialBankroll !== undefined) updateData.initialBankroll = parseFloat(initialBankroll);
    if (profitTarget !== undefined) updateData.profitTarget = parseFloat(profitTarget);
    if (initialCycleStake !== undefined) updateData.initialCycleStake = parseFloat(initialCycleStake);
    if (stopLossPercentage !== undefined) updateData.stopLossPercentage = parseFloat(stopLossPercentage);
    if (defaultMultiplier !== undefined) updateData.defaultMultiplier = parseFloat(defaultMultiplier);
    
    if (isActive !== undefined) {
        updateData.isActive = Boolean(isActive);
        if(Boolean(isActive)) {
            const existingSettings: BankSetting | null = await prisma.bankSetting.findUnique({ where: { userId: session.user.id } });
            updateData.currentBankroll = existingSettings?.initialBankroll ?? parseFloat(initialBankroll as string) ?? 0;
            updateData.currentStake = existingSettings?.initialCycleStake ?? parseFloat(initialCycleStake as string) ?? 0;
        } else { 
            updateData.currentBankroll = null;
            updateData.currentStake = null;
        }
    }
    
    if (currentBankroll !== undefined) updateData.currentBankroll = parseFloat(currentBankroll);
    if (currentStake !== undefined) updateData.currentStake = parseFloat(currentStake);

    const createDataDefaults = {
        initialBankroll: 0,
        profitTarget: 0,
        initialCycleStake: 0,
        stopLossPercentage: 0,
        defaultMultiplier: 2.0,
        isActive: false,
        currentBankroll: null,
        currentStake: null,
    };

    const updatedSettings = await prisma.bankSetting.upsert({
      where: { userId: session.user.id },
      update: updateData,
      create: {
        userId: session.user.id,
        initialBankroll: parseFloat(initialBankroll as string) || createDataDefaults.initialBankroll,
        profitTarget: parseFloat(profitTarget as string) || createDataDefaults.profitTarget,
        initialCycleStake: parseFloat(initialCycleStake as string) || createDataDefaults.initialCycleStake,
        stopLossPercentage: parseFloat(stopLossPercentage as string) || createDataDefaults.stopLossPercentage,
        defaultMultiplier: parseFloat(defaultMultiplier as string) || createDataDefaults.defaultMultiplier,
        isActive: Boolean(isActive) || createDataDefaults.isActive,
        currentBankroll: Boolean(isActive) ? (parseFloat(initialBankroll as string) || createDataDefaults.initialBankroll) : null,
        currentStake: Boolean(isActive) ? (parseFloat(initialCycleStake as string) || createDataDefaults.initialCycleStake) : null,
      },
    });

    return NextResponse.json(updatedSettings, { status: 200 });
  } catch (error) {
    console.error("Erro ao atualizar configurações de banca:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

