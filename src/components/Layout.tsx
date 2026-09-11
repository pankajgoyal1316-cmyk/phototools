import { type ReactNode } from 'react';
import Header from './Header';
import Footer from './Footer';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-app transition-colors duration-300">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:btn-primary focus:px-4 focus:py-2">Skip to main content</a>
      <Header />
      <main id="main-content">{children}</main>
      <Footer />
    </div>
  );
}
