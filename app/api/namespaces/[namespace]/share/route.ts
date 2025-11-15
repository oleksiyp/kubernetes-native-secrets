import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  getNamespaceMetadata,
  shareSecret,
  hasAccess,
} from '@/lib/k8s-client';

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
    const { key, sharedTo } = body;

    if (!key || !sharedTo) {
      return NextResponse.json(
        { error: 'Key and sharedTo are required' },
        { status: 400 }
      );
    }

    // Check if user has access to share (owner or already shared with)
    const metadata = await getNamespaceMetadata(namespace);
    if (!hasAccess(metadata, key, session.user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await shareSecret(namespace, key, session.user.email, sharedTo);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in share API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
