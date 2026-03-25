'use client';

import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Search, Bell, Home, BookOpen, Calendar, 
  DollarSign, Users, FileText
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface StudentLayoutProps {
  children: ReactNode;
}

const StudentLayout = ({ children }: StudentLayoutProps) => {
  const { user } = useAuth();
  const pathname = usePathname();

  const navItems = [
    { href: '/student', label: 'Dashboard', icon: Home },
    { href: '/student/courses', label: 'Courses', icon: BookOpen },
    { href: '/student/attendance', label: 'Attendance', icon: Calendar },
    { href: '/student/announcements', label: 'Announcements', icon: Users },
  ];

  const isActive = (href: string) => {
    if (href === '/student') {
      return pathname === href;
    }
    return pathname?.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-[#f9f8f6] flex">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-[288px] bg-[#f2f0ed] border-r border-[#e5e5e5] flex flex-col p-6 z-20">
        {/* Logo */}
        <div className="mb-8 px-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#e05252] rounded-lg flex items-center justify-center">
              <Home className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#1a1a1a] tracking-tight">Campus Hub</h1>
              <p className="text-[10px] font-bold text-[#666] uppercase tracking-wider">Student Portal</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link key={item.href} href={item.href}>
                <div className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-colors ${
                  active 
                    ? 'bg-white border border-[#e5e5e5] shadow-sm' 
                    : 'hover:bg-white/50'
                }`}>
                  <Icon className={`w-[18px] h-[18px] ${active ? 'text-[#e05252]' : 'text-[#666]'}`} />
                  <span className={`text-base font-medium ${active ? 'text-[#e05252]' : 'text-[#666]'}`}>
                    {item.label}
                  </span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="mt-auto bg-white border border-[#e5e5e5] rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src="/placeholder-avatar.png" />
              <AvatarFallback className="bg-[#e05252] text-white">
                {user?.full_name?.charAt(0) || 'A'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold text-[#1a1a1a] truncate">{user?.full_name || 'Student'}</p>
              <p className="text-xs text-[#666]">ID: #{user?.id || '000000'}</p>
            </div>
          </div>
          <Link href="/api/auth/logout">
            <Button 
              variant="ghost" 
              className="w-full bg-[#f2f0ed] hover:bg-[#e5e5e5] text-[#1a1a1a] text-xs font-bold h-8"
            >
              LOGOUT
            </Button>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 ml-[288px]">
        {/* Header */}
        <header className="fixed top-0 right-0 left-[288px] h-20 bg-[#f9f8f6]/80 backdrop-blur-md border-b border-[#e5e5e5] z-10">
          <div className="h-full px-10 flex items-center justify-between">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-[#666]/50" />
                <Input 
                  placeholder="Search courses, faculty, or events..."
                  className="pl-11 pr-4 h-11 bg-white border-[#e5e5e5] rounded-full text-sm"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full">
                <Bell className="w-4 h-5 text-[#666]" />
              </Button>
              <div className="w-px h-8 bg-[#e5e5e5]" />
              <Button variant="ghost" className="h-10 px-3 rounded-full bg-white border border-[#e5e5e5] gap-2">
                <Avatar className="w-7 h-7">
                  <AvatarImage src="/placeholder-avatar.png" />
                  <AvatarFallback className="bg-[#e05252] text-white text-xs">
                    {user?.full_name?.charAt(0) || 'A'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs font-bold text-[#1a1a1a]">
                  {user?.full_name?.split(' ')[0]?.toUpperCase() || 'STUDENT'}
                </span>
              </Button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="pt-28 pb-12 px-10">
          {children}
        </main>
      </div>
    </div>
  );
};

export default StudentLayout;
