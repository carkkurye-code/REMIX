import React from 'react';
import { Link } from 'wouter';

export default function NotFound() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-background px-6 text-center text-foreground">
      <div className="max-w-md">
        <h1 className="font-serif text-6xl font-extrabold text-foreground">404</h1>
        <p className="mt-4 text-base text-muted-foreground">Aradığınız sayfa bulunamadı veya taşınmış olabilir.</p>
        <Link
          href="/"
          className="mt-8 inline-flex items-center justify-center rounded-full bg-primary px-7 py-3 text-sm font-bold text-primary-foreground transition-all hover:bg-primary/90"
        >
          Ana Sayfaya Dön
        </Link>
      </div>
    </div>
  );
}
