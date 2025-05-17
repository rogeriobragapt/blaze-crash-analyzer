"use client";

import React, { useState, useEffect } from 'react';

import CatalogadorManual from "@/app/(main)/components/CatalogadorManual";
import PadroesIdentificados from "@/app/(main)/components/PadroesIdentificados";
import GerenciamentoBanca from "@/app/(main)/components/GerenciamentoBanca";
import HistoricoSugestoesIA from "@/app/(main)/components/HistoricoSugestoesIA";
import MelhoresPadroesIA24h from "@/app/(main)/components/MelhoresPadroesIA24h";
import MelhoresPadroesIA30d from "@/app/(main)/components/MelhoresPadroesIA30d";

export default function AnalysisPage() {
  // Estado para controlar notificações de padrões encontrados
  const [notification, setNotification] = useState<{
    visible: boolean;
    message: string;
    patternId: string | null;
  }>({
    visible: false,
    message: '',
    patternId: null
  });

  // Estado para controlar padrões marcados na tabela
  const [markedPatternId, setMarkedPatternId] = useState<string | null>(null);

  // Função para mostrar notificação de padrão encontrado
  const showPatternNotification = (patternId: string, patternNumber: number) => {
    setNotification({
      visible: true,
      message: `Padrão Encontrado! (Padrão ${patternNumber}) (Entrada Confirmada)`,
      patternId: patternId
    });
    setMarkedPatternId(patternId);
    
    // Esconde a notificação após 5 segundos
    setTimeout(() => {
      setNotification({
        visible: false,
        message: '',
        patternId: null
      });
      setMarkedPatternId(null);
    }, 5000);
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-center text-purple-300 mb-8">Analisador de Crash & Gerenciador</h1>
      
      {/* Notificação de padrão encontrado */}
      {notification.visible && (
        <div className="fixed top-20 right-4 bg-green-600 text-white px-4 py-2 rounded-md shadow-lg z-50 animate-pulse">
          {notification.message}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Coluna da Esquerda */}
        <div className="space-y-6">
          <CatalogadorManual onPatternFound={showPatternNotification} />
          <PadroesIdentificados markedPatternId={markedPatternId} />
        </div>

        {/* Coluna da Direita */}
        <div className="space-y-6">
          <GerenciamentoBanca />
        </div>
      </div>

      {/* Seção da IA abaixo das duas colunas */}
      <div className="space-y-6 mt-8">
        <HistoricoSugestoesIA />
        <MelhoresPadroesIA24h />
        <MelhoresPadroesIA30d />
      </div>
    </div>
  );
}
