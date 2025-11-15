'use client';

import { NamespaceMetadata } from '@/types';
import { UserPlus, Check, X, Clock } from 'lucide-react';

interface AccessRequestsProps {
  namespace: string;
  metadata: NamespaceMetadata;
  userEmail: string;
  onUpdate: () => void;
}

export function AccessRequests({
  namespace,
  metadata,
  userEmail,
  onUpdate,
}: AccessRequestsProps) {
  const handleRespond = async (
    key: string,
    requestedBy: string,
    approved: boolean
  ) => {
    try {
      const response = await fetch(
        `/api/namespaces/${namespace}/access-request`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key, requestedBy, approved }),
        }
      );

      if (response.ok) {
        onUpdate();
      } else {
        alert('Failed to respond to request');
      }
    } catch (error) {
      console.error('Error responding to request:', error);
      alert('Failed to respond to request');
    }
  };

  const requests = Object.entries(metadata.secrets)
    .flatMap(([key, meta]) =>
      meta.accessRequests.map((req) => ({
        ...req,
        key,
        canApprove:
          meta.owner === userEmail ||
          meta.sharedWith.some(
            (share) =>
              share.sharedTo === userEmail && share.valueHash === meta.valueHash
          ),
      }))
    )
    .filter((req) => req.canApprove);

  const pendingRequests = requests.filter((req) => req.status === 'pending');
  const processedRequests = requests.filter((req) => req.status !== 'pending');

  return (
    <div className="space-y-6">
      {/* Pending requests */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            Pending Access Requests
          </h2>
        </div>
        <div className="divide-y divide-gray-200">
          {pendingRequests.map((request, index) => (
            <div key={`${request.key}-${index}`} className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <UserPlus className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-gray-800">
                      {request.requestedBy}
                    </h3>
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                      Pending
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">
                    Requesting access to: <strong>{request.key}</strong>
                  </p>
                  <p className="text-xs text-gray-500">
                    Requested: {new Date(request.requestedAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() =>
                      handleRespond(request.key, request.requestedBy, true)
                    }
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
                  >
                    <Check className="w-4 h-4" />
                    <span>Approve</span>
                  </button>
                  <button
                    onClick={() =>
                      handleRespond(request.key, request.requestedBy, false)
                    }
                    className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                  >
                    <X className="w-4 h-4" />
                    <span>Deny</span>
                  </button>
                </div>
              </div>
            </div>
          ))}

          {pendingRequests.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No pending access requests</p>
            </div>
          )}
        </div>
      </div>

      {/* Processed requests */}
      {processedRequests.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">
              Processed Requests
            </h2>
          </div>
          <div className="divide-y divide-gray-200">
            {processedRequests.map((request, index) => (
              <div key={`${request.key}-${index}`} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <UserPlus className="w-5 h-5 text-gray-400" />
                      <h3 className="font-semibold text-gray-800">
                        {request.requestedBy}
                      </h3>
                      {request.status === 'approved' ? (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                          Approved
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                          Denied
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      Requested access to: <strong>{request.key}</strong>
                    </p>
                    <p className="text-xs text-gray-500">
                      Requested: {new Date(request.requestedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
