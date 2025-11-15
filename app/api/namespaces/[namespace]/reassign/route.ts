import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { reassignOwner, getNamespaceMetadata } from '@/lib/k8s-client';

export const dynamic = 'force-dynamic';

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
    const { key, newOwner } = body;

    if (!key || !newOwner) {
      return NextResponse.json(
        { error: 'Key and newOwner are required' },
        { status: 400 }
      );
    }

    // Check if user is current owner
    const metadata = await getNamespaceMetadata(namespace);
    if (!metadata.secrets[key]) {
      return NextResponse.json({ error: 'Secret not found' }, { status: 404 });
    }

    if (metadata.secrets[key].owner !== session.user.email) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await reassignOwner(namespace, key, newOwner);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in reassign API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
