"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";

interface AiPattern {
  id: string;
  patternSequence: string; 
  expectedResult: string; 
  source: string;
}

interface ApiError {
  error: string;
}

const PatternBall = ({ color }: { color: string }) => {
  const bgColor = color === "G" ? "bg-green-500" : "bg-black";
  const borderColor = color === "G" ? "border-green-300" : "border-gray-500";
  return <span className={`w-5 h-5 rounded-full border-2 ${bgColor} ${borderColor} flex-shrink-0`}></span>;
};

const MelhoresPadroesIA30d = () => {
  const { data: session } = useSession();
  const [patterns, setPatterns] = useState<AiPattern[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAiPatterns30d = useCallback(async () => {
    if (!session) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/patterns"); 
      if (!response.ok) {
        const errData: ApiError = await response.json();
        throw new Error(errData.error || "Falha ao buscar melhores padrões da IA (30d)");
      }
      let data: AiPattern[] = await response.json();
      data = data.filter(p => p.source === "IA_Top17"); 
      setPatterns(data);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Ocorreu um erro desconhecido ao buscar os melhores padrões da IA (30d).");
      }
      console.error(err);
    }
    setIsLoading(false);
  }, [session]);

  useEffect(() => {
    if (session) {
      fetchAiPatterns30d();
    }
  }, [session, fetchAiPatterns30d]);

   return (
    <div className="bg-gray-900 p-6 rounded-lg shadow-lg border border-gray-700">
      <h2 className="text-xl font-semibold mb-4 text-purple-300">Melhores Padrões da IA (Últimos 30 dias)</h2>
      {error && <p className="text-red-500 text-sm mb-2">Erro: {error}</p>}
      <div className="bg-gray-800 p-4 rounded min-h-[100px] max-h-[300px] overflow-y-auto border border-gray-700">
        {isLoading && <p className="text-gray-400 text-center">Carregando padrões...</p>}
        {!isLoading && patterns.length === 0 && (
          <p className="text-gray-400 text-center">Nenhum padrão da IA relevante nos últimos 30 dias. Adicione ao catalogador para a IA aprender.</p>
        )}
        {!isLoading && patterns.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-300 border-b border-gray-600">
                <th className="py-2 text-left">Sequência</th>
                <th className="py-2 text-center">Acertos</th>
                <th className="py-2 text-center">Total</th>
                <th className="py-2 text-center">Taxa</th>
              </tr>
            </thead>
            <tbody>
              {patterns.map((p) => (
                <tr 
                  key={p.id} 
                  className="border-b border-gray-700 last:border-b-0"
                >
                  <td className="py-2">
                    <div className="flex items-center space-x-1">
                      {p.patternSequence.split("").map((char, index) => (
                        <PatternBall key={`${p.id}-ball-${index}`} color={char} />
                      ))}
                      <span className={`font-bold ml-2 ${p.expectedResult === "G" ? "text-green-400" : "text-red-400"}`}>
                        ({p.expectedResult === "G" ? "🟢" : "⚫"})
                      </span>
                    </div>
                  </td>
                  <td className="py-2 text-center text-green-400">18</td>
                  <td className="py-2 text-center text-gray-300">20</td>
                  <td className="py-2 text-center text-yellow-400">90%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default MelhoresPadroesIA30d;

