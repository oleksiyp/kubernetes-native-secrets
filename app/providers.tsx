'use client';

import { SessionProvider } from 'next-auth/react';
import { SocketProvider } from '@/components/socket-provider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SocketProvider>{children}</SocketProvider>
    </SessionProvider>
  );
}
