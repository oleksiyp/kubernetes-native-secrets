# Kubernetes Native Secrets

A Next.js-based secret editor for Kubernetes with DEX authentication, granular sharing controls, and real-time collaboration features.

## Features

- **DEX Authentication**: Secure login using DEX identity provider
- **Namespace-based Organization**: Manage secrets for Kubernetes namespaces annotated with `secrets.oleksiyp.dev/native-secrets: true`
- **Granular Secret Sharing**: Share specific secrets with other users
- **Version-aware Sharing**: Sharing is tied to specific secret values (via hash), preventing automatic propagation of changes
- **Access Requests**: Users can request access to secrets, with real-time notifications to owners/members
- **Ownership Management**: Transfer ownership of secrets to other users
- **Audit Logging**: Complete history of secret operations and sharing activities
- **Real-time Updates**: WebSocket-based real-time updates for access requests and approvals
- **External Secrets Operator Compatible**: Secrets stored in Kubernetes can be consumed by External Secrets Operator

## Architecture

### Secret Storage

- **Secrets**: Stored as Kubernetes Secrets (one per namespace) in a configurable secrets namespace
- **Metadata**: Stored as ConfigMaps in the same secrets namespace
- **Naming**: Both Secrets and ConfigMaps are named after the source namespace

### Sharing Model

Secrets are shared on a per-key basis with hash-based version tracking:

1. When you share a secret, it's recorded as `key: hash-of-value`
2. If the secret value changes, the hash changes
3. Previously shared versions are not automatically updated
4. Users must explicitly re-share to grant access to new values

### Access Control

- **Owner**: User who created the secret
  - Can view, edit, delete, share, and reassign ownership
- **Members**: Users with whom the secret has been shared
  - Can view the secret (specific version)
  - Can re-share to others
  - Can approve access requests
- **Others**: Users without access
  - Can see that the secret exists
  - Can request access

## Installation

### Prerequisites

- Kubernetes cluster
- Helm 3.x
- DEX identity provider configured
- cert-manager (optional, for TLS)

### Helm Installation

#### Option 1: Install from OCI Registry (Recommended)

The Helm chart is published to GitHub Container Registry as an OCI artifact.

1. Create a values file (`my-values.yaml`):

```yaml
config:
  secretsNamespace: native-secrets
  dex:
    issuer: "https://dex.example.com"
    clientId: "kubernetes-native-secrets"
  nextAuth:
    url: "https://secrets.example.com"

secrets:
  create: true
  dexClientSecret: "your-dex-client-secret"
  nextAuthSecret: "generate-random-secret-here"

ingress:
  enabled: true
  className: "nginx"
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
  hosts:
    - host: secrets.example.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: kubernetes-native-secrets-tls
      hosts:
        - secrets.example.com
```

2. Install the chart from OCI registry:

```bash
# Install latest release
helm install kubernetes-native-secrets \
  oci://ghcr.io/oleksiyp/charts/kubernetes-native-secrets \
  -f my-values.yaml \
  --namespace kubernetes-native-secrets \
  --create-namespace

# Or install a specific version
helm install kubernetes-native-secrets \
  oci://ghcr.io/oleksiyp/charts/kubernetes-native-secrets \
  --version 0.1.0 \
  -f my-values.yaml \
  --namespace kubernetes-native-secrets \
  --create-namespace
```

#### Option 2: Install from GitHub Releases

Download the chart from [GitHub Releases](https://github.com/oleksiyp/kubernetes-native-secrets/releases):

```bash
# Download the chart
wget https://github.com/oleksiyp/kubernetes-native-secrets/releases/download/v0.1.0/kubernetes-native-secrets-0.1.0.tgz

# Install the chart
helm install kubernetes-native-secrets kubernetes-native-secrets-0.1.0.tgz \
  -f my-values.yaml \
  --namespace kubernetes-native-secrets \
  --create-namespace
```

### Annotate Namespaces

To enable secret management for a namespace, add the annotation:

```bash
kubectl annotate namespace my-namespace secrets.oleksiyp.dev/native-secrets=true
```

## Development

### Local Development

1. Clone the repository:

```bash
git clone https://github.com/oleksiyp/kubernetes-native-secrets.git
cd kubernetes-native-secrets
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables (`.env.local`):

```env
SECRETS_NAMESPACE=native-secrets
DEX_ISSUER=http://dex.example.com
DEX_CLIENT_ID=kubernetes-native-secrets
DEX_CLIENT_SECRET=your-client-secret
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret
```

4. Run the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

### Building Docker Image

```bash
docker build -t ghcr.io/oleksiyp/kubernetes-native-secrets:latest .
```

### Running with Docker

```bash
docker run -p 3000:3000 \
  -e SECRETS_NAMESPACE=native-secrets \
  -e DEX_ISSUER=http://dex.example.com \
  -e DEX_CLIENT_ID=kubernetes-native-secrets \
  -e DEX_CLIENT_SECRET=your-client-secret \
  -e NEXTAUTH_URL=http://localhost:3000 \
  -e NEXTAUTH_SECRET=your-nextauth-secret \
  ghcr.io/oleksiyp/kubernetes-native-secrets:latest
```

## Usage

### Creating Secrets

1. Navigate to the namespace you want to manage
2. Click "Add New Secret"
3. Enter a key (e.g., `DATABASE_PASSWORD`) and value
4. Click "Add Secret"

You become the owner of the secret automatically.

### Sharing Secrets

1. Find the secret you want to share
2. Click the "Share" icon
3. Enter the email address of the user
4. Click "Share"

The secret is now shared with that user (for the current value).

### Requesting Access

1. Navigate to a secret you don't have access to
2. Click "Request Access"
3. The owner and existing members will see your request in real-time
4. They can approve or deny your request

### Reassigning Ownership

1. As the owner, click the "Reassign" icon on a secret
2. Enter the email of the new owner
3. Click "Reassign"

### Viewing Audit Log

Click the "Audit Log" tab to see the complete history of:
- Secret creation and updates
- Sharing events
- Access requests and approvals
- Hash values for each secret version

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SECRETS_NAMESPACE` | Namespace where secrets are stored | `native-secrets` |
| `DEX_ISSUER` | DEX issuer URL | - |
| `DEX_CLIENT_ID` | DEX client ID | - |
| `DEX_CLIENT_SECRET` | DEX client secret | - |
| `NEXTAUTH_URL` | Public URL of the application | - |
| `NEXTAUTH_SECRET` | Secret for NextAuth.js JWT signing | - |
| `PORT` | Port to run the server on | `3000` |
| `NODE_ENV` | Node environment | `production` |

### Helm Chart Values

See [charts/kubernetes-native-secrets/values.yaml](charts/kubernetes-native-secrets/values.yaml) for all configurable values.

## Integration with External Secrets Operator

Secrets stored by this application can be consumed by External Secrets Operator:

```yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: my-app-secrets
  namespace: my-app
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: kubernetes-secret-store
    kind: ClusterSecretStore
  target:
    name: my-app-secrets
  data:
  - secretKey: database-password
    remoteRef:
      key: my-app  # namespace name in native-secrets
      property: DATABASE_PASSWORD
```

## Security Considerations

1. **HTTPS Required**: Always use HTTPS in production
2. **Secret Storage**: Consider using external secret management (Sealed Secrets, External Secrets Operator) for DEX and NextAuth secrets
3. **RBAC**: The application requires cluster-wide read access to namespaces and read/write access to secrets and configmaps in the secrets namespace
4. **Audit Logging**: All operations are logged in the audit log for compliance

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details

## Author

oleksiyp

## Support

- GitHub Issues: https://github.com/oleksiyp/kubernetes-native-secrets/issues
- Documentation: https://github.com/oleksiyp/kubernetes-native-secrets/wiki
