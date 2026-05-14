'use client';

import Image from 'next/image';

export default function Header() {
  return (
    <header className="bg-blue-dark shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center">
        <Image
          src="/decent-energy-logo.png"
          alt="Decent Energy"
          width={180}
          height={54}
          className="h-12 w-auto"
          priority
        />
      </div>
    </header>
  );
}
