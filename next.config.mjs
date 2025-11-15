/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  env: {
    SECRETS_NAMESPACE: process.env.SECRETS_NAMESPACE || 'native-secrets',
    DEX_ISSUER: process.env.DEX_ISSUER || 'http://dex.example.com',
    DEX_CLIENT_ID: process.env.DEX_CLIENT_ID || 'kubernetes-native-secrets',
  },
};

export default nextConfig;
