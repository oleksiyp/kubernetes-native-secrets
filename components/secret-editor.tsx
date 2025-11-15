'use client';

import { useState } from 'react';
import { NamespaceMetadata } from '@/types';
import {
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Share2,
  UserPlus,
  Key,
  Lock,
  Users,
} from 'lucide-react';

interface SecretEditorProps {
  namespace: string;
  secrets: Record<string, any>;
  metadata: NamespaceMetadata;
  userEmail: string;
  onUpdate: () => void;
}

export function SecretEditor({
  namespace,
  secrets,
  metadata,
  userEmail,
  onUpdate,
}: SecretEditorProps) {
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [showValues, setShowValues] = useState<Record<string, boolean>>({});
  const [shareKey, setShareKey] = useState<string | null>(null);
  const [shareEmail, setShareEmail] = useState('');
  const [reassignKey, setReassignKey] = useState<string | null>(null);
  const [reassignEmail, setReassignEmail] = useState('');

  const handleAddSecret = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey || !newValue) return;

    try {
      const response = await fetch(`/api/namespaces/${namespace}/secrets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: newKey, value: newValue }),
      });

      if (response.ok) {
        setNewKey('');
        setNewValue('');
        onUpdate();
      } else {
        alert('Failed to add secret');
      }
    } catch (error) {
      console.error('Error adding secret:', error);
      alert('Failed to add secret');
    }
  };

  const handleDeleteSecret = async (key: string) => {
    if (!confirm(`Are you sure you want to delete the secret "${key}"?`)) {
      return;
    }

    try {
      const response = await fetch(
        `/api/namespaces/${namespace}/secrets?key=${encodeURIComponent(key)}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        onUpdate();
      } else {
        alert('Failed to delete secret');
      }
    } catch (error) {
      console.error('Error deleting secret:', error);
      alert('Failed to delete secret');
    }
  };

  const handleShareSecret = async (key: string) => {
    if (!shareEmail) return;

    try {
      const response = await fetch(`/api/namespaces/${namespace}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, sharedTo: shareEmail }),
      });

      if (response.ok) {
        setShareKey(null);
        setShareEmail('');
        onUpdate();
      } else {
        alert('Failed to share secret');
      }
    } catch (error) {
      console.error('Error sharing secret:', error);
      alert('Failed to share secret');
    }
  };

  const handleRequestAccess = async (key: string) => {
    try {
      const response = await fetch(
        `/api/namespaces/${namespace}/access-request`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key }),
        }
      );

      if (response.ok) {
        alert('Access request sent');
        onUpdate();
      } else {
        alert('Failed to request access');
      }
    } catch (error) {
      console.error('Error requesting access:', error);
      alert('Failed to request access');
    }
  };

  const handleReassignOwner = async (key: string) => {
    if (!reassignEmail) return;

    try {
      const response = await fetch(`/api/namespaces/${namespace}/reassign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, newOwner: reassignEmail }),
      });

      if (response.ok) {
        setReassignKey(null);
        setReassignEmail('');
        onUpdate();
      } else {
        alert('Failed to reassign owner');
      }
    } catch (error) {
      console.error('Error reassigning owner:', error);
      alert('Failed to reassign owner');
    }
  };

  const toggleShowValue = (key: string) => {
    setShowValues((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const hasAccess = (key: string) => {
    const secretMeta = metadata.secrets[key];
    if (!secretMeta) return false;

    if (secretMeta.owner === userEmail) return true;

    return secretMeta.sharedWith.some(
      (share) =>
        share.sharedTo === userEmail && share.valueHash === secretMeta.valueHash
    );
  };

  const isOwner = (key: string) => {
    return metadata.secrets[key]?.owner === userEmail;
  };

  return (
    <div className="space-y-6">
      {/* Add new secret form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Add New Secret
        </h2>
        <form onSubmit={handleAddSecret} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Key
            </label>
            <input
              type="text"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., DATABASE_PASSWORD"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Value
            </label>
            <input
              type="password"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Secret value"
            />
          </div>
          <button
            type="submit"
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Secret</span>
          </button>
        </form>
      </div>

      {/* Secrets list */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Secrets</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {Object.entries(secrets).map(([key, secret]) => {
            const canAccess = hasAccess(key);
            const owner = isOwner(key);
            const secretMeta = metadata.secrets[key];

            return (
              <div key={key} className="p-6 hover:bg-gray-50 transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Key className="w-5 h-5 text-gray-400" />
                      <h3 className="font-semibold text-gray-800">{key}</h3>
                      {owner && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                          Owner
                        </span>
                      )}
                      {!owner && canAccess && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                          Shared with you
                        </span>
                      )}
                      {!canAccess && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                          No access
                        </span>
                      )}
                    </div>

                    {canAccess ? (
                      <div className="flex items-center space-x-2 mb-2">
                        <input
                          type={showValues[key] ? 'text' : 'password'}
                          value={secret.value}
                          readOnly
                          className="flex-1 px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg font-mono text-sm"
                        />
                        <button
                          onClick={() => toggleShowValue(key)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition"
                        >
                          {showValues[key] ? (
                            <EyeOff className="w-5 h-5 text-gray-600" />
                          ) : (
                            <Eye className="w-5 h-5 text-gray-600" />
                          )}
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2 mb-2 text-gray-500">
                        <Lock className="w-4 h-4" />
                        <span className="text-sm italic">
                          You don't have access to this secret
                        </span>
                      </div>
                    )}

                    {secretMeta && (
                      <div className="text-sm text-gray-500 space-y-1">
                        <p>Owner: {secretMeta.owner}</p>
                        <p>
                          Created: {new Date(secretMeta.createdAt).toLocaleString()}
                        </p>
                        {secretMeta.sharedWith.length > 0 && (
                          <div className="flex items-center space-x-2 mt-2">
                            <Users className="w-4 h-4" />
                            <span>Shared with {secretMeta.sharedWith.length} user(s)</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    {canAccess && (
                      <button
                        onClick={() => setShareKey(shareKey === key ? null : key)}
                        className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition"
                        title="Share secret"
                      >
                        <Share2 className="w-5 h-5" />
                      </button>
                    )}
                    {owner && (
                      <button
                        onClick={() =>
                          setReassignKey(reassignKey === key ? null : key)
                        }
                        className="p-2 hover:bg-purple-50 text-purple-600 rounded-lg transition"
                        title="Reassign owner"
                      >
                        <UserPlus className="w-5 h-5" />
                      </button>
                    )}
                    {owner && (
                      <button
                        onClick={() => handleDeleteSecret(key)}
                        className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition"
                        title="Delete secret"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                    {!canAccess && (
                      <button
                        onClick={() => handleRequestAccess(key)}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition"
                      >
                        Request Access
                      </button>
                    )}
                  </div>
                </div>

                {/* Share form */}
                {shareKey === key && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-gray-800 mb-2">
                      Share with user
                    </h4>
                    <div className="flex space-x-2">
                      <input
                        type="email"
                        value={shareEmail}
                        onChange={(e) => setShareEmail(e.target.value)}
                        placeholder="user@example.com"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        onClick={() => handleShareSecret(key)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                      >
                        Share
                      </button>
                      <button
                        onClick={() => setShareKey(null)}
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Reassign owner form */}
                {reassignKey === key && (
                  <div className="mt-4 p-4 bg-purple-50 rounded-lg">
                    <h4 className="font-medium text-gray-800 mb-2">
                      Reassign ownership
                    </h4>
                    <div className="flex space-x-2">
                      <input
                        type="email"
                        value={reassignEmail}
                        onChange={(e) => setReassignEmail(e.target.value)}
                        placeholder="newowner@example.com"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      <button
                        onClick={() => handleReassignOwner(key)}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition"
                      >
                        Reassign
                      </button>
                      <button
                        onClick={() => setReassignKey(null)}
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {Object.keys(secrets).length === 0 && (
            <div className="p-12 text-center text-gray-500">
              <Key className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No secrets yet. Add your first secret above.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
