import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions"; // Corrigido para importar de src/lib/authOptions.ts
import prisma from "@/lib/prisma";

// GET: Obter os padrões identificados para o usuário logado (Top 17 da IA e outros manuais, se houver)
export async function GET(/*request: Request*/) { 
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const identifiedPatterns = await prisma.userIdentifiedPattern.findMany({
      where: { userId: session.user.id },
      orderBy: [
        { source: "desc" }, 
        { createdAt: "desc" },
      ],
    });
    return NextResponse.json(identifiedPatterns, { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar padrões identificados:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

// Outras rotas (POST, PUT, DELETE) para UserIdentifiedPattern podem ser adicionadas aqui
// Por exemplo, para o usuário marcar/desmarcar um padrão manualmente ou adicionar um padrão customizado.

