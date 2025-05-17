'use client';
import React from 'react';
import { PatternStats, Signal } from '../page'; // Assuming types are exported from page.tsx or a types file

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

interface PadroesIdentificadosTableProps {
  topPatterns: PatternStats[];
  activeSignal: Signal | null;
}

const PadroesIdentificadosTable: React.FC<PadroesIdentificadosTableProps> = ({ topPatterns, activeSignal }) => {
  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-2 text-center">Padrões Identificados (Top 17 - 6 Velas)</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-700">
            <tr>
              <th className="p-2 text-left">#</th>
              <th className="p-2 text-left">Padrão (Próximo é Verde)</th>
              <th className="p-2 text-right">Ocorr.</th>
              <th className="p-2 text-right">Acerto (%)</th>
            </tr>
          </thead>
          <tbody>
            {topPatterns.length === 0 && <tr><td colSpan={4} className="p-2 text-center text-gray-400">Nenhum padrão de 6 velas com {">="} 80% de acerto encontrado.</td></tr>}
            {topPatterns.map((pattern, index) => (
              <tr key={index} className={`hover:bg-gray-650 transition-colors ${activeSignal && activeSignal.pattern === pattern.sequence ? 'bg-blue-700 ring-2 ring-blue-400' : ''}`}>
                <td className="p-2">{index + 1}</td>
                <td className="p-2 whitespace-nowrap">
                  {typeof pattern.sequence === 'string' && pattern.sequence.split('-').map((char, charIndex) => (
                    <span key={charIndex} className="inline-block rounded-full w-4 h-4 mr-1 border"
                          style={{ backgroundColor: getPatternDotColor(char), borderColor: getPatternDotColor(char) === 'black' ? 'dimgray' : 'darkgreen' }}></span>
                  ))}
                  <span className="inline-block align-middle" style={{ marginLeft: '2px' }}>(🟢)</span>
                </td>
                <td className="p-2 text-right">{pattern.totalOccurrences}</td>
                <td className="p-2 text-right">{pattern.probGreen.toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PadroesIdentificadosTable;
