import * as k8s from '@kubernetes/client-node';
import { NamespaceMetadata, SecretEntry, ShareMetadata, AccessRequest } from '@/types';

const kc = new k8s.KubeConfig();

// Load config - in-cluster when running in K8s, otherwise from kubeconfig
if (process.env.KUBERNETES_SERVICE_HOST) {
  kc.loadFromCluster();
} else {
  kc.loadFromDefault();
}

const k8sApi = kc.makeApiClient(k8s.CoreV1Api);

const ANNOTATION_KEY = 'secrets.oleksiyp.dev/native-secrets';
const SECRETS_NAMESPACE = process.env.SECRETS_NAMESPACE || 'native-secrets';

/**
 * Get all namespaces with the native-secrets annotation
 */
export async function getAnnotatedNamespaces(): Promise<string[]> {
  try {
    const response = await k8sApi.listNamespace();
    const namespaces = response.body.items
      .filter(ns => ns.metadata?.annotations?.[ANNOTATION_KEY] === 'true')
      .map(ns => ns.metadata!.name!)
      .filter(Boolean);

    return namespaces;
  } catch (error) {
    console.error('Error fetching namespaces:', error);
    throw new Error('Failed to fetch namespaces');
  }
}

/**
 * Get secrets for a specific namespace
 */
export async function getNamespaceSecrets(namespace: string): Promise<Record<string, string>> {
  try {
    const secretName = namespace;
    const secret = await k8sApi.readNamespacedSecret(secretName, SECRETS_NAMESPACE);

    if (!secret.body.data) {
      return {};
    }

    const decoded: Record<string, string> = {};
    for (const [key, value] of Object.entries(secret.body.data)) {
      decoded[key] = Buffer.from(value, 'base64').toString('utf-8');
    }

    return decoded;
  } catch (error: any) {
    if (error.statusCode === 404) {
      return {};
    }
    console.error('Error fetching secrets:', error);
    throw new Error('Failed to fetch secrets');
  }
}

/**
 * Get metadata for a namespace
 */
export async function getNamespaceMetadata(namespace: string): Promise<NamespaceMetadata> {
  try {
    const configMapName = namespace;
    const configMap = await k8sApi.readNamespacedConfigMap(configMapName, SECRETS_NAMESPACE);

    if (!configMap.body.data?.metadata) {
      return { namespace, secrets: {} };
    }

    return JSON.parse(configMap.body.data.metadata);
  } catch (error: any) {
    if (error.statusCode === 404) {
      return { namespace, secrets: {} };
    }
    console.error('Error fetching metadata:', error);
    throw new Error('Failed to fetch metadata');
  }
}

/**
 * Update or create a secret
 */
export async function upsertSecret(
  namespace: string,
  key: string,
  value: string,
  owner: string
): Promise<void> {
  try {
    const secretName = namespace;

    // Get current secrets
    const currentSecrets = await getNamespaceSecrets(namespace);
    currentSecrets[key] = value;

    // Encode secrets
    const encodedSecrets: Record<string, string> = {};
    for (const [k, v] of Object.entries(currentSecrets)) {
      encodedSecrets[k] = Buffer.from(v).toString('base64');
    }

    // Create or update secret
    try {
      await k8sApi.replaceNamespacedSecret(
        secretName,
        SECRETS_NAMESPACE,
        {
          metadata: { name: secretName },
          data: encodedSecrets,
        }
      );
    } catch (error: any) {
      if (error.statusCode === 404) {
        await k8sApi.createNamespacedSecret(SECRETS_NAMESPACE, {
          metadata: { name: secretName },
          data: encodedSecrets,
        });
      } else {
        throw error;
      }
    }

    // Update metadata
    await updateMetadata(namespace, key, owner, value);
  } catch (error) {
    console.error('Error upserting secret:', error);
    throw new Error('Failed to upsert secret');
  }
}

/**
 * Delete a secret
 */
export async function deleteSecret(namespace: string, key: string): Promise<void> {
  try {
    const secretName = namespace;
    const currentSecrets = await getNamespaceSecrets(namespace);
    delete currentSecrets[key];

    if (Object.keys(currentSecrets).length === 0) {
      // Delete the entire secret if no keys left
      await k8sApi.deleteNamespacedSecret(secretName, SECRETS_NAMESPACE);
    } else {
      // Update with remaining secrets
      const encodedSecrets: Record<string, string> = {};
      for (const [k, v] of Object.entries(currentSecrets)) {
        encodedSecrets[k] = Buffer.from(v).toString('base64');
      }

      await k8sApi.replaceNamespacedSecret(
        secretName,
        SECRETS_NAMESPACE,
        {
          metadata: { name: secretName },
          data: encodedSecrets,
        }
      );
    }

    // Update metadata
    const metadata = await getNamespaceMetadata(namespace);
    delete metadata.secrets[key];
    await saveMetadata(namespace, metadata);
  } catch (error) {
    console.error('Error deleting secret:', error);
    throw new Error('Failed to delete secret');
  }
}

/**
 * Update metadata for a secret
 */
async function updateMetadata(
  namespace: string,
  key: string,
  owner: string,
  value: string
): Promise<void> {
  const metadata = await getNamespaceMetadata(namespace);
  const valueHash = await hashValue(value);

  if (!metadata.secrets[key]) {
    metadata.secrets[key] = {
      owner,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      valueHash,
      sharedWith: [],
      accessRequests: [],
    };
  } else {
    metadata.secrets[key].updatedAt = new Date().toISOString();
    metadata.secrets[key].valueHash = valueHash;
  }

  await saveMetadata(namespace, metadata);
}

/**
 * Save metadata to ConfigMap
 */
async function saveMetadata(namespace: string, metadata: NamespaceMetadata): Promise<void> {
  try {
    const configMapName = namespace;
    const configMapData = {
      metadata: JSON.stringify(metadata, null, 2),
    };

    try {
      await k8sApi.replaceNamespacedConfigMap(
        configMapName,
        SECRETS_NAMESPACE,
        {
          metadata: { name: configMapName },
          data: configMapData,
        }
      );
    } catch (error: any) {
      if (error.statusCode === 404) {
        await k8sApi.createNamespacedConfigMap(SECRETS_NAMESPACE, {
          metadata: { name: configMapName },
          data: configMapData,
        });
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('Error saving metadata:', error);
    throw new Error('Failed to save metadata');
  }
}

/**
 * Share a secret with another user
 */
export async function shareSecret(
  namespace: string,
  key: string,
  sharedBy: string,
  sharedTo: string
): Promise<void> {
  const metadata = await getNamespaceMetadata(namespace);

  if (!metadata.secrets[key]) {
    throw new Error('Secret not found');
  }

  const share: ShareMetadata = {
    key,
    valueHash: metadata.secrets[key].valueHash,
    sharedBy,
    sharedTo,
    sharedAt: new Date().toISOString(),
    approved: true,
  };

  metadata.secrets[key].sharedWith.push(share);
  await saveMetadata(namespace, metadata);
}

/**
 * Request access to a secret
 */
export async function requestAccess(
  namespace: string,
  key: string,
  requestedBy: string
): Promise<void> {
  const metadata = await getNamespaceMetadata(namespace);

  if (!metadata.secrets[key]) {
    throw new Error('Secret not found');
  }

  // Check if request already exists
  const existingRequest = metadata.secrets[key].accessRequests.find(
    r => r.requestedBy === requestedBy && r.status === 'pending'
  );

  if (existingRequest) {
    return; // Request already exists
  }

  const request: AccessRequest = {
    key,
    requestedBy,
    requestedAt: new Date().toISOString(),
    status: 'pending',
  };

  metadata.secrets[key].accessRequests.push(request);
  await saveMetadata(namespace, metadata);
}

/**
 * Approve or deny an access request
 */
export async function respondToAccessRequest(
  namespace: string,
  key: string,
  requestedBy: string,
  approved: boolean,
  approver: string
): Promise<void> {
  const metadata = await getNamespaceMetadata(namespace);

  if (!metadata.secrets[key]) {
    throw new Error('Secret not found');
  }

  const request = metadata.secrets[key].accessRequests.find(
    r => r.requestedBy === requestedBy && r.status === 'pending'
  );

  if (!request) {
    throw new Error('Access request not found');
  }

  request.status = approved ? 'approved' : 'denied';

  if (approved) {
    // Add to shared list
    const share: ShareMetadata = {
      key,
      valueHash: metadata.secrets[key].valueHash,
      sharedBy: approver,
      sharedTo: requestedBy,
      sharedAt: new Date().toISOString(),
      approved: true,
    };
    metadata.secrets[key].sharedWith.push(share);
  }

  await saveMetadata(namespace, metadata);
}

/**
 * Hash a value for tracking
 */
async function hashValue(value: string): Promise<string> {
  const bcrypt = await import('bcryptjs');
  return bcrypt.hashSync(value, 10);
}

/**
 * Check if user has access to a secret
 */
export function hasAccess(
  metadata: NamespaceMetadata,
  key: string,
  user: string
): boolean {
  const secretMeta = metadata.secrets[key];
  if (!secretMeta) return false;

  // Owner always has access
  if (secretMeta.owner === user) return true;

  // Check if shared with user
  return secretMeta.sharedWith.some(
    share => share.sharedTo === user && share.valueHash === secretMeta.valueHash
  );
}

/**
 * Check if user can approve access requests
 */
export function canApproveAccess(
  metadata: NamespaceMetadata,
  key: string,
  user: string
): boolean {
  return hasAccess(metadata, key, user);
}

/**
 * Reassign ownership
 */
export async function reassignOwner(
  namespace: string,
  key: string,
  newOwner: string
): Promise<void> {
  const metadata = await getNamespaceMetadata(namespace);

  if (!metadata.secrets[key]) {
    throw new Error('Secret not found');
  }

  metadata.secrets[key].owner = newOwner;
  await saveMetadata(namespace, metadata);
}
