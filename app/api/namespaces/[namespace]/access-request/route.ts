import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  requestAccess,
  respondToAccessRequest,
  canApproveAccess,
  getNamespaceMetadata,
} from '@/lib/k8s-client';

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
    const { key } = body;

    if (!key) {
      return NextResponse.json({ error: 'Key is required' }, { status: 400 });
    }

    await requestAccess(namespace, key, session.user.email);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in access request API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
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
    const { key, requestedBy, approved } = body;

    if (!key || !requestedBy || approved === undefined) {
      return NextResponse.json(
        { error: 'Key, requestedBy, and approved are required' },
        { status: 400 }
      );
    }

    // Check if user can approve
    const metadata = await getNamespaceMetadata(namespace);
    if (!canApproveAccess(metadata, key, session.user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await respondToAccessRequest(
      namespace,
      key,
      requestedBy,
      approved,
      session.user.email
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in access request API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
