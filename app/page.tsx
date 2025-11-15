'use client';

import { useSession, signIn } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { Header } from '@/components/header';
import { NamespaceList } from '@/components/namespace-list';
import { Lock } from 'lucide-react';

export default function Home() {
  const { data: session, status } = useSession();
  const [namespaces, setNamespaces] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchNamespaces();
    }
  }, [status]);

  const fetchNamespaces = async () => {
    try {
      const response = await fetch('/api/namespaces');
      if (response.ok) {
        const data = await response.json();
        setNamespaces(data.namespaces);
      }
    } catch (error) {
      console.error('Error fetching namespaces:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
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
            onClick={() => signIn('dex')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200"
          >
            Sign in with DEX
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={session?.user} />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Namespaces</h1>
          <p className="text-gray-600">
            Select a namespace to manage secrets
          </p>
        </div>
        <NamespaceList namespaces={namespaces} />
      </main>
    </div>
  );
}
