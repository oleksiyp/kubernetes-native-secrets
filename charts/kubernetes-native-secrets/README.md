# Kubernetes Native Secrets Helm Chart

This Helm chart deploys the Kubernetes Native Secrets application to a Kubernetes cluster.

## Prerequisites

- Kubernetes 1.19+
- Helm 3.0+
- DEX identity provider configured
- Ingress controller (optional, for external access)
- cert-manager (optional, for TLS certificates)

## Installation

### Quick Start with OCI Registry

The chart is available as an OCI artifact in GitHub Container Registry:

```bash
# Install latest version
helm install my-release oci://ghcr.io/oleksiyp/charts/kubernetes-native-secrets

# Install specific version
helm install my-release oci://ghcr.io/oleksiyp/charts/kubernetes-native-secrets --version 0.1.0
```

**Note**: Each Helm chart version is pre-configured to use the matching Docker image version. The `image.tag` is automatically set during the release process.

### Alternative: Install from GitHub Releases

```bash
# Download from releases
wget https://github.com/oleksiyp/kubernetes-native-secrets/releases/download/v0.1.0/kubernetes-native-secrets-0.1.0.tgz

# Install the chart
helm install my-release kubernetes-native-secrets-0.1.0.tgz
```

### Install with Custom Values

Create a `values.yaml` file:

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
  nextAuthSecret: "your-nextauth-secret"

ingress:
  enabled: true
  className: "nginx"
  hosts:
    - host: secrets.example.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: kubernetes-native-secrets-tls
      hosts:
        - secrets.example.com

resources:
  limits:
    cpu: 500m
    memory: 512Mi
  requests:
    cpu: 100m
    memory: 128Mi
```

Install with custom values:

```bash
helm install my-release oci://ghcr.io/oleksiyp/charts/kubernetes-native-secrets -f values.yaml
```

## Configuration

### Key Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| `replicaCount` | Number of replicas | `1` |
| `image.repository` | Image repository | `ghcr.io/oleksiyp/kubernetes-native-secrets` |
| `image.tag` | Image tag | Chart appVersion |
| `image.pullPolicy` | Image pull policy | `IfNotPresent` |
| `config.secretsNamespace` | Namespace for storing secrets | `native-secrets` |
| `config.createSecretsNamespace` | Create the secrets namespace | `true` |
| `config.dex.issuer` | DEX issuer URL | `https://dex.example.com` |
| `config.dex.clientId` | DEX client ID | `kubernetes-native-secrets` |
| `config.nextAuth.url` | Application URL | `https://secrets.example.com` |
| `secrets.create` | Create secret for credentials | `true` |
| `ingress.enabled` | Enable ingress | `true` |
| `rbac.create` | Create RBAC resources | `true` |

See [values.yaml](values.yaml) for all available options.

### Secrets Namespace

By default, the chart creates a namespace for storing secrets and metadata (default: `native-secrets`). If you want to use an existing namespace or manage namespace creation separately, set `config.createSecretsNamespace: false`:

```yaml
config:
  secretsNamespace: my-existing-namespace
  createSecretsNamespace: false
```

## RBAC

The chart creates a ClusterRole with permissions to:
- Read namespaces (cluster-wide)
- Manage secrets in the secrets namespace
- Manage configmaps in the secrets namespace

## Upgrading

```bash
helm upgrade my-release kubernetes-native-secrets/kubernetes-native-secrets
```

## Uninstalling

```bash
helm uninstall my-release
```

This will remove all resources created by the chart, including the secrets namespace.

## Security Considerations

1. **Secrets Management**: In production, use external secrets management (Sealed Secrets, External Secrets Operator) instead of storing secrets in values.yaml
2. **TLS**: Always enable TLS in production
3. **RBAC**: Review and customize RBAC rules based on your security requirements
4. **Network Policies**: Consider implementing network policies to restrict traffic

## Example: Using External Secrets

Instead of storing secrets in the chart, use External Secrets Operator:

```yaml
secrets:
  create: false

# Add environment variables to reference external secret
extraEnvFrom:
  - secretRef:
      name: kubernetes-native-secrets-external
```

Create the external secret:

```yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: kubernetes-native-secrets-external
spec:
  secretStoreRef:
    name: vault-backend
    kind: SecretStore
  target:
    name: kubernetes-native-secrets-external
  data:
    - secretKey: client-secret
      remoteRef:
        key: dex/client-secret
    - secretKey: nextauth-secret
      remoteRef:
        key: nextauth/secret
```

## Support

For issues and questions:
- GitHub Issues: https://github.com/oleksiyp/kubernetes-native-secrets/issues
- Documentation: https://github.com/oleksiyp/kubernetes-native-secrets
