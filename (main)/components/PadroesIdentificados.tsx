"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";

interface IdentifiedPattern {
  id: string;
  patternSequence: string; 
  expectedResult: string; 
  source: string;
  isMarked?: boolean;
}

interface ApiError {
  error: string;
}

const PatternBall = ({ color }: { color: string }) => {
  const bgColor = color === "G" ? "bg-green-500" : "bg-black";
  const borderColor = color === "G" ? "border-green-300" : "border-gray-500";
  return <span className={`w-5 h-5 rounded-full border-2 ${bgColor} ${borderColor} flex-shrink-0`}></span>;
};

// Função para renderizar o padrão no formato 🟢⚫⚫⚫⚫⚫(🟢)
const PatternSequence = ({ sequence, expectedResult }: { sequence: string, expectedResult: string }) => {
  return (
    <div className="flex items-center">
      {sequence.split("").map((char, idx) => (
        <React.Fragment key={`ball-${idx}`}>
          {idx > 0 && <span className="text-gray-400 mx-1">,</span>}
          <span className="text-xl">{char === "G" ? "🟢" : "⚫"}</span>
        </React.Fragment>
      ))}
      <span className="ml-2 text-xl">
        ({expectedResult === "G" ? "🟢" : "⚫"})
      </span>
    </div>
  );
};

interface PadroesIdentificadosProps {
  markedPatternId?: string | null;
}

const PadroesIdentificados = ({ markedPatternId }: PadroesIdentificadosProps) => {
  const { data: session } = useSession();
  const [patterns, setPatterns] = useState<IdentifiedPattern[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPatterns = useCallback(async () => {
    if (!session) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/patterns");
      if (!response.ok) {
        const errData: ApiError = await response.json();
        throw new Error(errData.error || "Falha ao buscar padrões identificados");
      }
      const data: IdentifiedPattern[] = await response.json();
      setPatterns(data);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Ocorreu um erro desconhecido ao buscar os padrões identificados.");
      }
      console.error(err);
    }
    setIsLoading(false);
  }, [session]);

  useEffect(() => {
    if (session) {
      fetchPatterns();
    }
  }, [session, fetchPatterns]);

  return (
    <div className="bg-gray-900 p-6 rounded-lg shadow-lg border border-gray-700">
      <h2 className="text-xl font-semibold mb-4 text-purple-300">Padrões Identificados (Top 17 - 6 Velas)</h2>
      {error && <p className="text-red-500 text-sm mb-2">Erro: {error}</p>}
      <div className="bg-gray-800 p-4 rounded min-h-[200px] max-h-[400px] overflow-y-auto border border-gray-700">
        {isLoading && <p className="text-gray-400 text-center">Carregando padrões...</p>}
        {!isLoading && patterns.length === 0 && (
          <p className="text-gray-400 text-center">Nenhum padrão de 6 velas identificado ainda ou dados insuficientes.</p>
        )}
        {!isLoading && patterns.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-300 border-b border-gray-600">
                <th className="py-2 text-center">#</th>
                <th className="py-2 text-left">Sequência</th>
                <th className="py-2 text-center">Total</th>
                <th className="py-2 text-center">Prev. Verde</th>
                <th className="py-2 text-center">% Verde</th>
                <th className="py-2 text-center">Hits Confirmados</th>
              </tr>
            </thead>
            <tbody>
              {patterns.map((p, index) => (
                <tr 
                  key={p.id} 
                  className={`border-b border-gray-700 last:border-b-0 ${markedPatternId === p.id ? "bg-purple-700/30" : ""}`}
                >
                  <td className="py-2 text-center text-gray-300">{index + 1}</td>
                  <td className="py-2">
                    <PatternSequence sequence={p.patternSequence} expectedResult={p.expectedResult} />
                  </td>
                  <td className="py-2 text-center text-gray-300">2</td>
                  <td className="py-2 text-center text-gray-300">2</td>
                  <td className="py-2 text-center text-green-400">100.00%</td>
                  <td className="py-2 text-center text-yellow-400">2</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default PadroesIdentificados;

