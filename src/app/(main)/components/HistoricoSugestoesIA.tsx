"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";

interface AiSuggestion {
  id: string;
  timestamp: string;
  triggeringPattern: string;
  suggestedOutcome: string;
  confidence?: number | null;
  actualOutcome?: string | null;
  aiLearnedPattern?: {
    patternSequence: string;
    nextResultWinRate: number;
    totalOccurrences: number;
  } | null;
}

interface AiApiResponse {
    currentSuggestion: AiSuggestion | null;
    history: AiSuggestion[];
}

interface ApiError {
  error: string;
}

const PatternBall = ({ color }: { color: string }) => {
  const bgColor = color === "G" ? "bg-green-500" : "bg-black";
  const borderColor = color === "G" ? "border-green-300" : "border-gray-500";
  return <span className={`w-4 h-4 rounded-full border-2 ${bgColor} ${borderColor} flex-shrink-0`}></span>;
};

const HistoricoSugestoesIA = () => {
  const { data: session } = useSession();
  const [suggestions, setSuggestions] = useState<AiSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSuggestions = useCallback(async () => {
    if (!session) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/ai");
      if (!response.ok) {
        const errData: ApiError = await response.json();
        throw new Error(errData.error || "Falha ao buscar sugestões da IA");
      }
      const data: AiApiResponse = await response.json();
      setSuggestions(data.history || []);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Ocorreu um erro desconhecido ao buscar sugestões da IA.");
      }
      console.error("Erro ao buscar sugestões IA:", err);
    }
    setIsLoading(false);
  }, [session]);

  useEffect(() => {
    if (session) {
      fetchSuggestions();
    }
  }, [session, fetchSuggestions]);

  const handleClearHistory = async () => {
    if (!session) {
      setError("Você precisa estar logado.");
      return;
    }
    const confirmed = window.confirm("Tem certeza que deseja limpar todo o histórico de sugestões da IA?");
    if (!confirmed) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/ai", {
        method: "DELETE",
      });
      if (!response.ok) {
        const errData: ApiError = await response.json();
        throw new Error(errData.error || "Falha ao limpar histórico de sugestões da IA");
      }
      setSuggestions([]);
      alert("Histórico de sugestões da IA limpo com sucesso!");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Ocorreu um erro desconhecido ao limpar o histórico da IA.");
      }
      console.error("Erro ao limpar histórico IA:", err);
      alert(`Erro: ${err instanceof Error ? err.message : "Erro desconhecido"}`);
    }
    setIsLoading(false);
  };
  
  const handleSuggestionResult = async (suggestionId: string, result: "WIN" | "LOSS") => {
    alert(`Registrar ${result} para sugestão ${suggestionId} - Funcionalidade a ser implementada no backend.`);
    // Ex: await fetch(`/api/ai/suggestions/${suggestionId}`, { method: 'PUT', body: JSON.stringify({ actualOutcome: result }) });
    // fetchSuggestions();
  };


  return (
    <div className="bg-gray-900 p-6 rounded-lg shadow-lg border border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-purple-300">Histórico de Sugestões da IA</h2>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => handleSuggestionResult("latest", "WIN")}
            disabled={isLoading || !session || suggestions.length === 0}
            className="bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white font-semibold py-1 px-3 rounded text-sm transition-colors duration-150"
          >
            V
          </button>
          <button 
            onClick={() => handleSuggestionResult("latest", "LOSS")}
            disabled={isLoading || !session || suggestions.length === 0}
            className="bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white font-semibold py-1 px-3 rounded text-sm transition-colors duration-150"
          >
            D
          </button>
          <button 
            onClick={handleClearHistory}
            disabled={isLoading || !session || suggestions.length === 0}
            className="bg-red-700 hover:bg-red-800 disabled:bg-red-900 text-white font-semibold py-1 px-3 rounded text-sm transition-colors duration-150"
          >
            Limpar Hist. IA
          </button>
        </div>
      </div>
      {error && <p className="text-red-500 text-sm mb-2">Erro: {error}</p>}
      <div className="bg-gray-800 p-4 rounded min-h-[200px] max-h-[400px] overflow-y-auto space-y-1 border border-gray-700">
        {isLoading && <p className="text-gray-400 text-center">Carregando sugestões...</p>}
        {!isLoading && suggestions.length === 0 && (
          <p className="text-gray-400 text-center">Nenhuma sugestão da IA registrada ainda.</p>
        )}
        {!isLoading && suggestions.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-300 border-b border-gray-600">
                <th className="py-2 text-left">Data/Hora</th>
                <th className="py-2 text-left">Padrão</th>
                <th className="py-2 text-center">Sugestão</th>
                <th className="py-2 text-center">Confiança</th>
                <th className="py-2 text-center">Resultado</th>
              </tr>
            </thead>
            <tbody>
              {suggestions.map((sug) => (
                <tr 
                  key={sug.id} 
                  className="border-b border-gray-700 last:border-b-0"
                >
                  <td className="py-2 text-gray-400">{new Date(sug.timestamp).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</td>
                  <td className="py-2">
                    <div className="flex items-center space-x-1">
                      {sug.triggeringPattern.split("").map((char, index) => (
                        <PatternBall key={`${sug.id}-ball-${index}`} color={char} />
                      ))}
                      <span className={`font-bold ml-2 ${sug.suggestedOutcome === "GREEN" ? "text-green-400" : "text-red-400"}`}>
                        ({sug.suggestedOutcome === "GREEN" ? "🟢" : "⚫"})
                      </span>
                    </div>
                  </td>
                  <td className="py-2 text-center">
                    <span className={`font-bold ${sug.suggestedOutcome === "GREEN" ? "text-green-400" : sug.suggestedOutcome === "BLACK_PROBABLE" ? "text-red-400" : "text-yellow-400"}`}>
                      {sug.suggestedOutcome === "GREEN" ? "ENTRAR" : sug.suggestedOutcome === "BLACK_PROBABLE" ? "EVITAR" : "AGUARDAR"}
                    </span>
                  </td>
                  <td className="py-2 text-center text-gray-300">
                    {sug.confidence ? `${(sug.confidence * 100).toFixed(0)}%` : "-"}
                  </td>
                  <td className="py-2 text-center">
                    {sug.actualOutcome ? (
                      <span className={`font-semibold px-2 py-0.5 rounded text-xs ${sug.actualOutcome === "WIN" ? "bg-green-500/70 text-white" : "bg-red-500/70 text-white"}`}>
                        {sug.actualOutcome === "WIN" ? "Vitória" : "Derrota"}
                      </span>
                    ) : (
                      <div className="flex items-center justify-center space-x-1">
                        <button onClick={() => handleSuggestionResult(sug.id, "WIN")} className="bg-green-500 hover:bg-green-600 text-white font-bold py-0.5 px-2 rounded text-xs">V</button>
                        <button onClick={() => handleSuggestionResult(sug.id, "LOSS")} className="bg-red-500 hover:bg-red-600 text-white font-bold py-0.5 px-2 rounded text-xs">D</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default HistoricoSugestoesIA;

