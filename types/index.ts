export interface SecretEntry {
  key: string;
  value: string;
  owner: string;
  createdAt: string;
  updatedAt: string;
  valueHash: string;
}

export interface ShareMetadata {
  key: string;
  valueHash: string;
  sharedBy: string;
  sharedTo: string;
  sharedAt: string;
  approved: boolean;
}

export interface AccessRequest {
  key: string;
  requestedBy: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'denied';
}

export interface NamespaceMetadata {
  namespace: string;
  secrets: {
    [key: string]: {
      owner: string;
      createdAt: string;
      updatedAt: string;
      valueHash: string;
      sharedWith: ShareMetadata[];
      accessRequests: AccessRequest[];
    };
  };
}

export interface KubernetesNamespace {
  name: string;
  hasAnnotation: boolean;
}

export interface User {
  email: string;
  name: string;
  sub: string;
}

export interface AuditLogEntry {
  timestamp: string;
  action: 'create' | 'update' | 'delete' | 'share' | 'request' | 'approve' | 'deny';
  user: string;
  namespace: string;
  key: string;
  valueHash?: string;
  targetUser?: string;
}
