'use client';

import { signOut } from 'next-auth/react';
import { Lock, LogOut, User } from 'lucide-react';
import Link from 'next/link';

interface HeaderProps {
  user?: {
    name?: string | null;
    email?: string | null;
  };
}

export function Header({ user }: HeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4 py-3 md:py-4">
        <div className="flex items-center justify-between gap-2">
          <Link href="/" className="flex items-center space-x-2 min-w-0">
            <Lock className="w-6 h-6 md:w-8 md:h-8 text-blue-600 flex-shrink-0" />
            <span className="text-base md:text-xl font-bold text-gray-800 truncate">
              <span className="hidden sm:inline">Kubernetes Native Secrets</span>
              <span className="sm:hidden">K8s Secrets</span>
            </span>
          </Link>

          {user && (
            <div className="flex items-center gap-2 md:gap-4">
              <div className="hidden md:flex items-center space-x-2 text-gray-700">
                <User className="w-5 h-5" />
                <span className="text-sm truncate max-w-[150px]">{user.name || user.email}</span>
              </div>
              <button
                onClick={() => signOut()}
                className="flex items-center space-x-1 md:space-x-2 px-2 md:px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition duration-200"
                aria-label="Sign out"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
