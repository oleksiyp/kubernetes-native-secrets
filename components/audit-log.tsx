'use client';

import { NamespaceMetadata } from '@/types';
import { History, UserPlus, Share2, Key } from 'lucide-react';

interface AuditLogProps {
  namespace: string;
  metadata: NamespaceMetadata;
}

export function AuditLog({ namespace, metadata }: AuditLogProps) {
  // Generate audit log entries from metadata
  const auditEntries = Object.entries(metadata.secrets).flatMap(
    ([key, meta]) => {
      const entries = [];

      // Secret creation
      entries.push({
        timestamp: meta.createdAt,
        action: 'create' as const,
        user: meta.owner,
        key,
        valueHash: meta.valueHash,
      });

      // Secret updates (if updated)
      if (meta.updatedAt !== meta.createdAt) {
        entries.push({
          timestamp: meta.updatedAt,
          action: 'update' as const,
          user: meta.owner,
          key,
          valueHash: meta.valueHash,
        });
      }

      // Share events
      meta.sharedWith.forEach((share) => {
        entries.push({
          timestamp: share.sharedAt,
          action: 'share' as const,
          user: share.sharedBy,
          key: share.key,
          valueHash: share.valueHash,
          targetUser: share.sharedTo,
        });
      });

      // Access requests
      meta.accessRequests.forEach((request) => {
        entries.push({
          timestamp: request.requestedAt,
          action: 'request' as const,
          user: request.requestedBy,
          key: request.key,
        });

        if (request.status === 'approved') {
          entries.push({
            timestamp: request.requestedAt,
            action: 'approve' as const,
            user: 'system',
            key: request.key,
            targetUser: request.requestedBy,
          });
        } else if (request.status === 'denied') {
          entries.push({
            timestamp: request.requestedAt,
            action: 'deny' as const,
            user: 'system',
            key: request.key,
            targetUser: request.requestedBy,
          });
        }
      });

      return entries;
    }
  );

  // Sort by timestamp (most recent first)
  const sortedEntries = auditEntries.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'create':
        return <Key className="w-5 h-5 text-green-600" />;
      case 'update':
        return <Key className="w-5 h-5 text-blue-600" />;
      case 'share':
        return <Share2 className="w-5 h-5 text-purple-600" />;
      case 'request':
        return <UserPlus className="w-5 h-5 text-yellow-600" />;
      case 'approve':
        return <UserPlus className="w-5 h-5 text-green-600" />;
      case 'deny':
        return <UserPlus className="w-5 h-5 text-red-600" />;
      default:
        return <History className="w-5 h-5 text-gray-600" />;
    }
  };

  const getActionText = (entry: any) => {
    switch (entry.action) {
      case 'create':
        return `created secret "${entry.key}"`;
      case 'update':
        return `updated secret "${entry.key}"`;
      case 'share':
        return `shared "${entry.key}" with ${entry.targetUser}`;
      case 'request':
        return `requested access to "${entry.key}"`;
      case 'approve':
        return `approved access to "${entry.key}" for ${entry.targetUser}`;
      case 'deny':
        return `denied access to "${entry.key}" for ${entry.targetUser}`;
      default:
        return 'unknown action';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'create':
        return 'bg-green-100 text-green-700';
      case 'update':
        return 'bg-blue-100 text-blue-700';
      case 'share':
        return 'bg-purple-100 text-purple-700';
      case 'request':
        return 'bg-yellow-100 text-yellow-700';
      case 'approve':
        return 'bg-green-100 text-green-700';
      case 'deny':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">Audit Log</h2>
        <p className="text-sm text-gray-500 mt-1">
          Complete history of secret operations and sharing
        </p>
      </div>
      <div className="divide-y divide-gray-200">
        {sortedEntries.map((entry, index) => (
          <div key={index} className="p-6 hover:bg-gray-50 transition">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">{getActionIcon(entry.action)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-2">
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${getActionColor(
                      entry.action
                    )}`}
                  >
                    {entry.action.toUpperCase()}
                  </span>
                  <span className="text-sm text-gray-500">
                    {new Date(entry.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-gray-800">
                  <strong>{entry.user}</strong> {getActionText(entry)}
                </p>
                {entry.valueHash && (
                  <p className="text-xs text-gray-500 mt-1 font-mono">
                    Value hash: {entry.valueHash.substring(0, 16)}...
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}

        {sortedEntries.length === 0 && (
          <div className="p-12 text-center text-gray-500">
            <History className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No audit log entries yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
