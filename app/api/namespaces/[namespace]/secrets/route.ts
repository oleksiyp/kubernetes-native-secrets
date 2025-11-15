import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  getNamespaceSecrets,
  getNamespaceMetadata,
  upsertSecret,
  deleteSecret,
  hasAccess,
} from '@/lib/k8s-client';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { namespace: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { namespace } = params;
    const secrets = await getNamespaceSecrets(namespace);
    const metadata = await getNamespaceMetadata(namespace);

    // Filter secrets based on access
    const filteredSecrets: Record<string, any> = {};
    for (const [key, value] of Object.entries(secrets)) {
      if (hasAccess(metadata, key, session.user.email)) {
        filteredSecrets[key] = {
          value,
          metadata: metadata.secrets[key],
        };
      } else {
        // User can see that secret exists but not the value
        filteredSecrets[key] = {
          value: null,
          metadata: {
            owner: metadata.secrets[key]?.owner,
            hasAccess: false,
          },
        };
      }
    }

    return NextResponse.json({
      secrets: filteredSecrets,
      metadata,
    });
  } catch (error) {
    console.error('Error in secrets API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { namespace: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { namespace } = params;
    const body = await request.json();
    const { key, value } = body;

    if (!key || !value) {
      return NextResponse.json(
        { error: 'Key and value are required' },
        { status: 400 }
      );
    }

    // Check if secret exists and user has permission
    const metadata = await getNamespaceMetadata(namespace);
    if (metadata.secrets[key]) {
      // Updating existing secret - must be owner
      if (metadata.secrets[key].owner !== session.user.email) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    await upsertSecret(namespace, key, value, session.user.email);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in secrets API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { namespace: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { namespace } = params;
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json({ error: 'Key is required' }, { status: 400 });
    }

    // Check if user is owner
    const metadata = await getNamespaceMetadata(namespace);
    if (!metadata.secrets[key]) {
      return NextResponse.json({ error: 'Secret not found' }, { status: 404 });
    }

    if (metadata.secrets[key].owner !== session.user.email) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await deleteSecret(namespace, key);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in secrets API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
