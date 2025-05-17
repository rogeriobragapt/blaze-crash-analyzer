"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

interface CrashResult {
  id: string;
  isWin: boolean;
  multiplier: number;
  timestamp: string;
}

interface ApiError {
  error: string;
}

interface CatalogadorManualProps {
  onPatternFound?: (patternId: string, patternNumber: number) => void;
}

const CatalogadorManual = ({ onPatternFound }: CatalogadorManualProps) => {
  const { data: session } = useSession();
  const [results, setResults] = useState<CrashResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchResults = useCallback(async () => {
    if (!session) return;
    setIsLoading(true);
    try {
      const response = await fetch('/api/catalog');
      if (!response.ok) {
        throw new Error('Falha ao buscar resultados');
      }
      const data: CrashResult[] = await response.json();
      setResults(data);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Ocorreu um erro desconhecido ao buscar resultados.");
      }
      console.error(err);
    }
    setIsLoading(false);
  }, [session]);

  useEffect(() => {
    if (session) { // Adicionado para evitar chamada se não houver sessão
        fetchResults();
    }
  }, [fetchResults, session]);

  const addResult = async (isWin: boolean, multiplier: number) => {
    if (!session) {
      setError("Você precisa estar logado para adicionar resultados.");
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch('/api/catalog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isWin, multiplier }),
      });
      if (!response.ok) {
        const errData: ApiError = await response.json();
        throw new Error(errData.error || 'Falha ao adicionar resultado');
      }
      
      // Verificar se algum padrão foi encontrado após adicionar o resultado
      const patternsResponse = await fetch('/api/patterns?check=true');
      if (patternsResponse.ok) {
        const patternData = await patternsResponse.json();
        if (patternData.patternFound && onPatternFound) {
          onPatternFound(patternData.patternId, patternData.patternNumber);
        }
      }
      
      await fetchResults(); 
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Ocorreu um erro desconhecido ao adicionar resultado.");
      }
      console.error(err);
    }
    setIsLoading(false);
  };

  const handleAction = async (action: 'undoLast' | 'clearAll') => {
    if (!session) {
      setError("Você precisa estar logado.");
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(`/api/catalog?action=${action}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errData: ApiError = await response.json();
        throw new Error(errData.error || `Falha ao ${action === 'undoLast' ? 'desfazer último' : 'limpar histórico'}`);
      }
      await fetchResults();
    } catch (err) {
        if (err instanceof Error) {
            setError(err.message);
        } else {
            setError("Ocorreu um erro desconhecido ao executar a ação.");
        }
      console.error(err);
    }
    setIsLoading(false);
  };

  return (
    <div className="bg-gray-900 p-6 rounded-lg shadow-lg border border-gray-700">
      <h2 className="text-xl font-semibold mb-4 text-purple-300">Catalogador Manual</h2>
      {error && <p className="text-red-500 text-sm mb-2">Erro: {error}</p>}
      <div className="bg-gray-800 p-4 rounded mb-4 min-h-[60px] flex items-center overflow-x-auto border border-gray-700">
        {isLoading && results.length === 0 && <p className="text-gray-400">Carregando resultados...</p>}
        {!isLoading && results.length === 0 && <p className="text-gray-400">Nenhum resultado catalogado.</p>}
        {results.map((result, index) => (
          <React.Fragment key={result.id || index}>
            {index > 0 && <span className="text-gray-400 mx-1">,</span>}
            <span 
              className={`w-6 h-6 rounded-full border-2 ${result.isWin ? 'bg-green-500 border-green-300' : 'bg-black border-gray-500'} flex-shrink-0`}
              title={`Multiplicador: ${result.multiplier}x - ${new Date(result.timestamp).toLocaleString()}`}
            ></span>
          </React.Fragment>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <button 
          onClick={() => addResult(true, 2.00)} 
          disabled={isLoading || !session}
          className="bg-green-500 hover:bg-green-600 disabled:bg-green-700 text-white font-bold py-3 px-4 rounded text-lg transition-colors duration-150"
        >
          2.00 x
        </button>
        <button 
          onClick={() => addResult(false, 1.99)} 
          disabled={isLoading || !session}
          className="bg-red-500 hover:bg-red-600 disabled:bg-red-700 text-white font-bold py-3 px-4 rounded text-lg transition-colors duration-150"
        >
          1.99 x
        </button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <button 
          onClick={() => handleAction('undoLast')} 
          disabled={isLoading || !session || results.length === 0}
          className="bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-700 text-black font-bold py-2 px-4 rounded transition-colors duration-150"
        >
          Desfazer Última
        </button>
        <button 
          onClick={() => handleAction('clearAll')} 
          disabled={isLoading || !session || results.length === 0}
          className="bg-red-700 hover:bg-red-800 disabled:bg-red-900 text-white font-bold py-2 px-4 rounded transition-colors duration-150"
        >
          Limpar Histórico
        </button>
      </div>
    </div>
  );
};

export default CatalogadorManual;

