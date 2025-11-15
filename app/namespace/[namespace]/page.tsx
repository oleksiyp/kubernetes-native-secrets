'use client';

import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { Header } from '@/components/header';
import { SecretEditor } from '@/components/secret-editor';
import { AccessRequests } from '@/components/access-requests';
import { AuditLog } from '@/components/audit-log';
import { useSocket } from '@/components/socket-provider';
import { NamespaceMetadata } from '@/types';
import { ArrowLeft, Shield, History } from 'lucide-react';
import Link from 'next/link';

export default function NamespacePage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  const namespace = params.namespace as string;
  const { socket } = useSocket();

  const [secrets, setSecrets] = useState<Record<string, any>>({});
  const [metadata, setMetadata] = useState<NamespaceMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'secrets' | 'requests' | 'audit'>('secrets');

  const fetchSecrets = useCallback(async () => {
    try {
      const response = await fetch(`/api/namespaces/${namespace}/secrets`);
      if (response.ok) {
        const data = await response.json();
        setSecrets(data.secrets);
        setMetadata(data.metadata);
      }
    } catch (error) {
      console.error('Error fetching secrets:', error);
    } finally {
      setLoading(false);
    }
  }, [namespace]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    } else if (status === 'authenticated') {
      fetchSecrets();
    }
  }, [status, namespace, router, fetchSecrets]);

  useEffect(() => {
    if (!socket) return;

    socket.emit('subscribe', namespace);

    socket.on('metadata-update', (data) => {
      if (data.namespace === namespace) {
        setMetadata(data.metadata);
      }
    });

    return () => {
      socket.emit('unsubscribe', namespace);
      socket.off('metadata-update');
    };
  }, [socket, namespace]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const userEmail = session?.user?.email || '';
  const pendingRequests = metadata
    ? Object.entries(metadata.secrets)
        .flatMap(([key, meta]) =>
          meta.accessRequests
            .filter((req) => req.status === 'pending')
            .map((req) => ({
              ...req,
              key,
              canApprove:
                meta.owner === userEmail ||
                meta.sharedWith.some(
                  (share) =>
                    share.sharedTo === userEmail &&
                    share.valueHash === meta.valueHash
                ),
            }))
        )
        .filter((req) => req.canApprove)
    : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={session?.user} />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to namespaces
          </Link>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{namespace}</h1>
          <p className="text-gray-600">Manage secrets for this namespace</p>
        </div>

        <div className="mb-6 border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('secrets')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition ${
                activeTab === 'secrets'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Shield className="w-4 h-4 inline mr-2" />
              Secrets
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition relative ${
                activeTab === 'requests'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Access Requests
              {pendingRequests.length > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                  {pendingRequests.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition ${
                activeTab === 'audit'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <History className="w-4 h-4 inline mr-2" />
              Audit Log
            </button>
          </nav>
        </div>

        {activeTab === 'secrets' && metadata && (
          <SecretEditor
            namespace={namespace}
            secrets={secrets}
            metadata={metadata}
            userEmail={userEmail}
            onUpdate={fetchSecrets}
          />
        )}

        {activeTab === 'requests' && metadata && (
          <AccessRequests
            namespace={namespace}
            metadata={metadata}
            userEmail={userEmail}
            onUpdate={fetchSecrets}
          />
        )}

        {activeTab === 'audit' && metadata && (
          <AuditLog namespace={namespace} metadata={metadata} />
        )}
      </main>
    </div>
  );
}
