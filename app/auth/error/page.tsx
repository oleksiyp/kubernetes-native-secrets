'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';

export default function AuthError() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100">
      <div className="text-center bg-white p-8 rounded-lg shadow-xl max-w-md">
        <div className="mb-6">
          <AlertCircle className="w-16 h-16 mx-auto text-red-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          Authentication Error
        </h1>
        <p className="text-gray-600 mb-6">
          {error === 'Configuration'
            ? 'There is a problem with the server configuration.'
            : error === 'AccessDenied'
            ? 'Access denied. You do not have permission to sign in.'
            : error === 'Verification'
            ? 'The verification token has expired or has already been used.'
            : 'An error occurred during authentication. Please try again.'}
        </p>
        <Link
          href="/"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
