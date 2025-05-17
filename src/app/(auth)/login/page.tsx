"use client";

import React from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation'; 

const LoginPage = () => {
  const router = useRouter();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('doublesite1630'); 
  const [error, setError] = React.useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const result = await signIn('credentials', {
      redirect: false,
      email,
      password,
    });

    if (result?.error) {
      setError('Falha na autenticação. Verifique suas credenciais.');
      console.error("Login error:", result.error);
    } else if (result?.ok) {
      router.push('/analysis'); 
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md">
        <h1 className="text-3xl font-bold text-center text-purple-400 mb-8">Login - Blaze Crash Analyzer</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seuemail@exemplo.com"
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
              Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          <div>
            <button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-md text-lg transition duration-150 ease-in-out"
            >
              Entrar
            </button>
          </div>
        </form>
        <p className="text-center text-xs text-gray-500 mt-4">Use qualquer email e a senha &apos;doublesite1630&apos; para acessar.</p>
      </div>
    </div>
  );
};

export default LoginPage;
