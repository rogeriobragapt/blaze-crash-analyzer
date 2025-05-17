"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";

interface BankSettings {
  id: string;
  initialBankroll: number;
  profitTarget: number;
  initialCycleStake: number;
  stopLossPercentage: number;
  defaultMultiplier: number;
  isActive: boolean;
  currentBankroll?: number | null;
  currentStake?: number | null;
  cycleProfitTarget?: number | null;
}

interface ApiError {
  error: string;
}

const GerenciamentoBanca = () => {
  const { data: session } = useSession();
  const [settings, setSettings] = useState<Partial<BankSettings>>({
    initialBankroll: 500,
    profitTarget: 400,
    initialCycleStake: 25,
    stopLossPercentage: 20,
    defaultMultiplier: 2.0,
    isActive: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBankSettings = useCallback(async () => {
    if (!session) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/bank");
      if (!response.ok) {
        const errData: ApiError = await response.json();
        throw new Error(errData.error || "Falha ao buscar configurações da banca");
      }
      const data: BankSettings = await response.json();
      setSettings(data);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Ocorreu um erro desconhecido ao buscar as configurações da banca.");
      }
      console.error("Erro ao buscar config banca:", err);
    }
    setIsLoading(false);
  }, [session]);

  useEffect(() => {
    if (session) {
      fetchBankSettings();
    }
  }, [session, fetchBankSettings]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : parseFloat(value) || 0,
    }));
  };

  const handleSaveSettings = async () => {
    if (!session) {
      setError("Você precisa estar logado.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/bank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!response.ok) {
        const errData: ApiError = await response.json();
        throw new Error(errData.error || "Falha ao salvar configurações da banca");
      }
      const updatedSettings: BankSettings = await response.json();
      setSettings(updatedSettings);
      alert("Configurações da banca salvas com sucesso!");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Ocorreu um erro desconhecido ao salvar as configurações da banca.");
      }
      console.error("Erro ao salvar config banca:", err);
      alert(`Erro: ${err instanceof Error ? err.message : "Erro desconhecido"}`);
    }
    setIsLoading(false);
  };
  
  // Implementação do martingale suave (25, 30, 45, etc.)
  const calculateNextStake = (currentStake: number, isWin: boolean): number => {
    if (isWin) {
      // Se ganhou, volta para a entrada inicial
      return settings.initialCycleStake || 25;
    } else {
      // Se perdeu, aumenta a aposta conforme martingale suave
      if (currentStake === 25) return 30;
      if (currentStake === 30) return 45;
      if (currentStake === 45) return 70;
      if (currentStake === 70) return 100;
      if (currentStake === 100) return 150;
      if (currentStake === 150) return 225;
      if (currentStake === 225) return 350;
      if (currentStake === 350) return 500;
      // Se já estiver em 500, mantém
      return 500;
    }
  };

  const toggleManagement = async () => {
    if (!session) return;
    setIsLoading(true);
    setError(null);
    try {
        const response = await fetch("/api/bank", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isActive: !settings.isActive, ...settings }),
        });
        if (!response.ok) {
            const errData: ApiError = await response.json();
            throw new Error(errData.error || "Falha ao alterar estado do gerenciamento");
        }
        const updatedSettings: BankSettings = await response.json();
        setSettings(updatedSettings);
        alert(`Gerenciamento ${updatedSettings.isActive ? "ATIVADO" : "DESATIVADO"}.`);
    } catch (err) {
        if (err instanceof Error) {
            setError(err.message);
        } else {
            setError("Ocorreu um erro desconhecido ao alterar o estado do gerenciamento.");
        }
        alert(`Erro: ${err instanceof Error ? err.message : "Erro desconhecido"}`);
    }
    setIsLoading(false);
  };
  
  // Função para processar resultado (vitória/derrota) e atualizar banca
  const processResult = async (isWin: boolean) => {
    if (!session || !settings.isActive || !settings.currentStake || !settings.currentBankroll) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      let newBankroll = settings.currentBankroll;
      let newStake = settings.currentStake;
      
      if (isWin) {
        // Se ganhou, adiciona o lucro à banca
        newBankroll += newStake * (settings.defaultMultiplier || 2.0) - newStake;
        // Próxima aposta volta ao valor inicial
        newStake = calculateNextStake(newStake, true);
      } else {
        // Se perdeu, subtrai o valor da aposta da banca
        newBankroll -= newStake;
        // Próxima aposta aumenta conforme martingale suave
        newStake = calculateNextStake(newStake, false);
      }
      
      // Verifica se atingiu stop loss (calculado diretamente sobre a banca inicial)
      const stopLossValue = settings.initialBankroll * (1 - (settings.stopLossPercentage || 20) / 100);
      if (newBankroll <= stopLossValue) {
        alert("Stop Loss atingido! Gerenciamento será desativado.");
        
        const response = await fetch("/api/bank", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            isActive: false,
            currentBankroll: newBankroll,
            currentStake: null
          }),
        });
        
        if (!response.ok) {
          throw new Error("Falha ao desativar gerenciamento após Stop Loss");
        }
        
        const updatedSettings = await response.json();
        setSettings(updatedSettings);
        setIsLoading(false);
        return;
      }
      
      // Verifica se atingiu meta de lucro
      if (newBankroll >= settings.initialBankroll + (settings.profitTarget || 0)) {
        alert("Meta de lucro atingida! Gerenciamento será desativado.");
        
        const response = await fetch("/api/bank", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            isActive: false,
            currentBankroll: newBankroll,
            currentStake: null
          }),
        });
        
        if (!response.ok) {
          throw new Error("Falha ao desativar gerenciamento após atingir meta");
        }
        
        const updatedSettings = await response.json();
        setSettings(updatedSettings);
        setIsLoading(false);
        return;
      }
      
      // Atualiza a banca e a próxima aposta
      const response = await fetch("/api/bank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          currentBankroll: newBankroll,
          currentStake: newStake
        }),
      });
      
      if (!response.ok) {
        throw new Error("Falha ao atualizar banca após resultado");
      }
      
      const updatedSettings = await response.json();
      setSettings(updatedSettings);
      
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Ocorreu um erro desconhecido ao processar o resultado.");
      }
      console.error("Erro ao processar resultado:", err);
    }
    
    setIsLoading(false);
  };

  const stopLossValue = settings.initialBankroll && settings.stopLossPercentage 
    ? settings.initialBankroll * (1 - settings.stopLossPercentage / 100)
    : 0;
  
  const cycleProfitTargetValue = settings.initialCycleStake && settings.defaultMultiplier
    ? settings.initialCycleStake * settings.defaultMultiplier
    : 0;

  return (
    <div className="bg-gray-900 p-6 rounded-lg shadow-lg border border-gray-700">
      <h2 className="text-xl font-semibold mb-6 text-purple-300">Gerenciamento de Banca Avançado</h2>
      {error && <p className="text-red-500 text-sm mb-4">Erro: {error}</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Banca Inicial (R$)</label>
          <input 
            type="number" name="initialBankroll" value={settings.initialBankroll || ""} onChange={handleInputChange} 
            disabled={settings.isActive || isLoading}
            className="w-full p-2 bg-gray-800 border border-gray-600 rounded-md focus:ring-purple-500 focus:border-purple-500 disabled:opacity-70"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Meta de Lucro do Ciclo (R$)</label>
          <input 
            type="number" name="profitTarget" value={settings.profitTarget || ""} onChange={handleInputChange} 
            disabled={settings.isActive || isLoading}
            className="w-full p-2 bg-gray-800 border border-gray-600 rounded-md focus:ring-purple-500 focus:border-purple-500 disabled:opacity-70"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Entrada Inicial do Ciclo (R$)</label>
          <input 
            type="number" name="initialCycleStake" value={settings.initialCycleStake || ""} onChange={handleInputChange} 
            disabled={settings.isActive || isLoading}
            className="w-full p-2 bg-gray-800 border border-gray-600 rounded-md focus:ring-purple-500 focus:border-purple-500 disabled:opacity-70"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Stop Loss (%)</label>
          <input 
            type="number" name="stopLossPercentage" value={settings.stopLossPercentage || ""} onChange={handleInputChange} 
            disabled={settings.isActive || isLoading}
            className="w-full p-2 bg-gray-800 border border-gray-600 rounded-md focus:ring-purple-500 focus:border-purple-500 disabled:opacity-70"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Multiplicador Padrão (x)</label>
          <input 
            type="number" step="0.01" name="defaultMultiplier" value={settings.defaultMultiplier || ""} onChange={handleInputChange} 
            disabled={settings.isActive || isLoading}
            className="w-full p-2 bg-gray-800 border border-gray-600 rounded-md focus:ring-purple-500 focus:border-purple-500 disabled:opacity-70"
          />
        </div>
      </div>

      <button 
        onClick={handleSaveSettings} 
        disabled={isLoading || settings.isActive || !session}
        className="w-full mb-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-bold py-3 px-4 rounded-md text-lg transition-colors duration-150"
      >
        Salvar Configurações
      </button>
      
      <button 
        onClick={toggleManagement}
        disabled={isLoading || !session}
        className={`w-full font-bold py-3 px-4 rounded-md text-lg transition-colors duration-150 ${settings.isActive ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}`}
      >
        {settings.isActive ? "Parar Gerenciamento" : "Iniciar Gerenciamento"}
      </button>

      {settings.isActive && (
        <div className="mt-6 pt-6 border-t border-gray-700">
          <h3 className="text-lg font-semibold text-purple-300 mb-3">Ciclo Atual:</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <p><span className="text-gray-400">Banca Atual:</span> R$ {settings.currentBankroll?.toFixed(2) || "N/A"}</p>
            <p><span className="text-gray-400">Entrada Atual:</span> R$ {settings.currentStake?.toFixed(2) || "N/A"}</p>
            <p><span className="text-gray-400">Meta do Ciclo:</span> R$ {cycleProfitTargetValue.toFixed(2)}</p>
            <p><span className="text-gray-400">Stop Loss em:</span> R$ {stopLossValue.toFixed(2)}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default GerenciamentoBanca;

