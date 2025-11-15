'use client';

import Link from 'next/link';
import { Folder, ChevronRight } from 'lucide-react';

interface NamespaceListProps {
  namespaces: string[];
}

export function NamespaceList({ namespaces }: NamespaceListProps) {
  if (namespaces.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <Folder className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          No Namespaces Found
        </h3>
        <p className="text-gray-500">
          No namespaces with the annotation{' '}
          <code className="bg-gray-100 px-2 py-1 rounded text-sm">
            secrets.oleksiyp.dev/native-secrets: true
          </code>
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {namespaces.map((namespace) => (
        <Link
          key={namespace}
          href={`/namespace/${namespace}`}
          className="block bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-blue-300 transition duration-200 group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Folder className="w-8 h-8 text-blue-600" />
              <div>
                <h3 className="font-semibold text-gray-800 group-hover:text-blue-600 transition">
                  {namespace}
                </h3>
                <p className="text-sm text-gray-500">Click to manage secrets</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition" />
          </div>
        </Link>
      ))}
    </div>
  );
}
