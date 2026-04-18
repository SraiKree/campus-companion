import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider } from '@/contexts/AuthContext';
import { HostelAdminAuthProvider } from '@/contexts/HostelAdminAuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import Providers from './providers';
import { ToasterWrapper } from '@/components/toaster-wrapper';

const plusJakartaSans = Plus_Jakarta_Sans({ 
  subsets: ['latin'],
  variable: '--font-plus-jakarta-sans',
  weight: ['300', '400', '500', '600', '700', '800']
});

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
      <body className={plusJakartaSans.className}>
        <Providers>
          <TooltipProvider>
            <AuthProvider>
              <HostelAdminAuthProvider>
                <ThemeProvider>
                  {children}
                  <ToasterWrapper />
                </ThemeProvider>
              </HostelAdminAuthProvider>
            </AuthProvider>
          </TooltipProvider>
        </Providers>
      </body>
    </html>
  );
}
