'use client';

import Image from 'next/image';

export default function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="relative w-32 h-32 mb-8">
        <Image
          src="/logo/logo.jpeg"
          alt="Company Logo"
          fill
          className="object-contain rounded-lg"
          priority
        />
      </div>
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary"></div>
        <p className="mt-4 text-lg font-medium text-gray-600">Loading...</p>
      </div>
    </div>
  );
} 