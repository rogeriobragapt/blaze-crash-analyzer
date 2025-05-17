'use client';
import React from 'react';
import { IaPatternDetail } from '../page'; // Assuming types are exported

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

interface MelhoresPadroesIaTableProps {
  title: string;
  patterns: IaPatternDetail[];
  emptyMessage: string;
}

const MelhoresPadroesIaTable: React.FC<MelhoresPadroesIaTableProps> = ({ title, patterns, emptyMessage }) => {
  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-2 text-center">{title}</h3>
      <div className="max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-700">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-700">
            <tr>
              <th className="p-2 text-left">Padrão (Próximo é Verde)</th>
              <th className="p-2 text-right">Ocorr.</th>
              <th className="p-2 text-right">Acerto (%)</th>
            </tr>
          </thead>
          <tbody>
            {patterns.length === 0 && <tr><td colSpan={3} className="p-2 text-center text-gray-400">{emptyMessage}</td></tr>}
            {patterns.map((pattern, index) => (
              <tr key={`${pattern.sequence}_${title.replace(/\s+/g, '_')}_${index}`} className="hover:bg-gray-650">
                <td className="p-2 whitespace-nowrap">
                  {typeof pattern.sequence === 'string' && pattern.sequence.length > 0 ? (
                    pattern.sequence.split('-').map((char, charIndex) => (
                        <span key={charIndex} className="inline-block rounded-full w-4 h-4 mr-1 border"
                              style={{ backgroundColor: getPatternDotColor(char), borderColor: getPatternDotColor(char) === 'black' ? 'dimgray' : 'darkgreen' }}></span>
                    ))
                  ) : (
                    <span className="text-xs text-yellow-400">Padrão N/A</span>
                  )}
                  {typeof pattern.sequence === 'string' && pattern.sequence.length > 0 && <span className="inline-block align-middle" style={{ marginLeft: '2px' }}>(🟢)</span>}
                </td>
                <td className="p-2 text-right">
                  {typeof pattern.totalOccurrences === 'number' && pattern.totalOccurrences <= 1000 
                    ? pattern.totalOccurrences 
                    : <span className="text-xs text-red-400">Erro</span>}
                </td>
                <td className="p-2 text-right">
                  {typeof pattern.successRate === 'number' ? `${(pattern.successRate * 100).toFixed(1)}%` : <span className="text-xs text-red-400">Erro</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MelhoresPadroesIaTable;
