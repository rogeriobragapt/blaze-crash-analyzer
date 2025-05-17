"use client";

import React from 'react';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-950">
      <header className="bg-gray-900 p-4 shadow-md border-b border-gray-800">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-semibold text-purple-300">Blaze Crash Analyzer</h1>
          <button 
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
            onClick={() => {
              // Implementação do logout com NextAuth
              import('next-auth/react').then(({ signOut }) => {
                signOut({ callbackUrl: '/login' });
              });
            }}
          >
            Sair
          </button>
        </div>
      </header>
      <main className="flex-grow container mx-auto p-4">
        {children}
      </main>
      <footer className="bg-gray-900 p-4 text-center text-sm text-gray-400 border-t border-gray-800">
        <a href="https://manus.is" target="_blank" rel="noopener noreferrer" className="hover:text-purple-300">
          Made with Manus &hearts;
        </a>
      </footer>
    </div>
  );
}
