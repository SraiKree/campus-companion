import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider } from '@/contexts/AuthContext';
import Providers from './providers';
import { ToasterWrapper } from '@/components/toaster-wrapper';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'CampusHub - College ERP System',
  description: 'Modern college management system',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <TooltipProvider>
            <AuthProvider>
              {children}
              <ToasterWrapper />
            </AuthProvider>
          </TooltipProvider>
        </Providers>
      </body>
    </html>
  );
}
