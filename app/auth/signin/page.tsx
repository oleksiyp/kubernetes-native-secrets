'use client';

import { signIn } from 'next-auth/react';
import { Lock } from 'lucide-react';

export default function SignIn() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center bg-white p-8 rounded-lg shadow-xl max-w-md">
        <div className="mb-6">
          <Lock className="w-16 h-16 mx-auto text-blue-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          Kubernetes Native Secrets
        </h1>
        <p className="text-gray-600 mb-6">
          Secure secret management for Kubernetes namespaces with granular sharing controls
        </p>
        <button
          onClick={() => signIn('dex', { callbackUrl: '/' })}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200"
        >
          Sign in with DEX
        </button>
      </div>
    </div>
  );
}
