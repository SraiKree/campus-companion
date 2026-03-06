'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bell, GraduationCap } from 'lucide-react';

interface DashboardHeaderProps {
  tabs?: React.ReactNode;
}

const DashboardHeader = ({ tabs }: DashboardHeaderProps) => {
  const { user } = useAuth();

  return (
    <header className="bg-white border-b border-border">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center">
                <GraduationCap className="h-6 w-6 text-foreground" />
              </div>
              <span className="text-lg font-bold text-foreground">CampusHub</span>
            </div>
            {tabs && <div className="hidden md:block">{tabs}</div>}
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="rounded-full h-10 w-10">
              <Bell className="h-5 w-5 text-muted-foreground" />
            </Button>
            <Avatar className="h-10 w-10 cursor-pointer">
              <AvatarFallback className="bg-[#141414] text-white font-medium">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
        {tabs && <div className="md:hidden mt-4">{tabs}</div>}
      </div>
    </header>
  );
};

export default DashboardHeader;
