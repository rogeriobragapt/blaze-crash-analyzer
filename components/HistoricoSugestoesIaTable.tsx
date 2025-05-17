'use client';
import React from 'react';
import { IaSuggestionHistoryEntry } from '../page'; // Assuming types are exported

// Helper function for dot colors (can be moved to a shared utils file)
const getPatternDotColor = (char: string): string => {
  if (!char) return 'grey';
  const upperChar = char.toUpperCase();
  if (upperChar === 'G' || upperChar === 'V' || upperChar === 'GREEN') {
    return 'limegreen';
  }
  if (upperChar === 'B' || upperChar === 'P' || upperChar === 'BLACK') {
    return 'black';
  }
  return 'grey';
};

interface HistoricoSugestoesIaTableProps {
  iaSuggestionHistory: IaSuggestionHistoryEntry[];
  iaWins: number;
  iaLosses: number;
  onClearIaSuggestionHistory: () => void;
}

const HistoricoSugestoesIaTable: React.FC<HistoricoSugestoesIaTableProps> = ({
  iaSuggestionHistory,
  iaWins,
  iaLosses,
  onClearIaSuggestionHistory
}) => {
  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold text-center">Histórico de Sugestões da IA</h3>
        <div className="flex items-center">
          <span className="mr-2 text-sm">V - {iaWins} D - {iaLosses}</span>
          <button onClick={onClearIaSuggestionHistory} className="bg-gray-600 hover:bg-gray-500 text-xs px-2 py-1 rounded">Limpar Hist. IA</button>
        </div>
      </div>
      <div className="max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-700">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-700">
            <tr>
              <th className="p-2 text-left">Padrão Gatilho</th>
              <th className="p-2 text-left">Resultado</th>
              <th className="p-2 text-right">Data/Hora</th>
            </tr>
          </thead>
          <tbody>
            {iaSuggestionHistory.length === 0 && <tr><td colSpan={3} className="p-2 text-center text-gray-400">Nenhuma sugestão da IA ainda.</td></tr>}
            {iaSuggestionHistory.map((entry) => (
              <tr key={entry.id} className={`hover:bg-gray-650 ${entry.actualOutcome === 'green' ? 'text-green-400' : entry.actualOutcome === 'black' ? 'text-red-400' : ''}`}>
                <td className="p-2 whitespace-nowrap">
                  {typeof entry.suggestionTriggerPattern === 'string' && entry.suggestionTriggerPattern.length > 0 ? (
                    entry.suggestionTriggerPattern.split('-').map((char, charIndex) => (
                        <span key={charIndex} className="inline-block rounded-full w-4 h-4 mr-1 border"
                              style={{ backgroundColor: getPatternDotColor(char), borderColor: getPatternDotColor(char) === 'black' ? 'dimgray' : 'darkgreen' }}></span>
                    ))
                  ) : (
                    <span className="text-xs text-yellow-400">Padrão N/A</span>
                  )}
                  {typeof entry.suggestionTriggerPattern === 'string' && entry.suggestionTriggerPattern.length > 0 && <span className="inline-block align-middle" style={{ marginLeft: '2px' }}>(🟢)</span>}
                </td>
                <td className="p-2">
                  {entry.actualOutcome ? 
                      (<span className="inline-block rounded-full w-4 h-4 border"
                             style={{ backgroundColor: getPatternDotColor(entry.actualOutcome.charAt(0)), borderColor: getPatternDotColor(entry.actualOutcome.charAt(0)) === 'black' ? 'dimgray' : 'darkgreen' }}></span>)
                      : <span className="text-xs italic">Pendente</span>}
                </td>
                <td className="p-2 text-right text-xs">{new Date(entry.timestamp).toLocaleTimeString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HistoricoSugestoesIaTable;
