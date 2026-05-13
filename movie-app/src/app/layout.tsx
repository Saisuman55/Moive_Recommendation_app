import { Suspense } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense>
      <Navbar />
      <main className="pt-16">
        {children}
      </main>
      <Footer />
    </Suspense>
  );
}