'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import FacultyLayout from '@/components/layout/FacultyLayout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/lib/supabase';
import {
  User, Mail, Hash, Building2, Calendar,
  BookOpen, GraduationCap, Users, Megaphone, Clock,
} from 'lucide-react';

interface SubjectTaught {
  name: string;
  code: string;
  departments: string[];
  sections: string[];
}

interface ProfileData {
  profile: {
    id: string;
    name: string;
    email: string;
    role: string;
    department: string | null;
    created_at: string;
  };
  teachingInfo: {
    subjectsTaught: SubjectTaught[];
    totalSections: number;
    totalClassesPerWeek: number;
    totalStudents: number;
    announcementsPosted: number;
  };
  authEmail: string;
}

export default function FacultyProfilePage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push('/');
      } else if (user?.role !== 'faculty') {
        router.push('/');
      }
    }
  }, [authLoading, isAuthenticated, user, router]);

  useEffect(() => {
    if (!authLoading && isAuthenticated && user?.role === 'faculty') {
      fetchProfile();
    }
  }, [authLoading, isAuthenticated, user]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      const res = await fetch('/api/faculty/profile', {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      if (!res.ok) throw new Error('Failed to load profile');
      setProfileData(await res.json());
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <FacultyLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#c44545] mx-auto mb-4" />
            <p className="text-[#666]">Loading profile...</p>
          </div>
        </div>
      </FacultyLayout>
    );
  }

  if (!isAuthenticated || user?.role !== 'faculty' || !profileData) {
    return null;
  }

  const { profile, teachingInfo } = profileData;
  const initials = profile.name?.split(' ').map((n) => n[0]).join('').toUpperCase() || 'FC';

  return (
    <FacultyLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header Card */}
        <Card className="border-[#e5e5e5] bg-white rounded-2xl overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-[#c44545] to-[#e05252]" />
          <div className="px-8 pb-8">
            <div className="flex items-end gap-6 -mt-16">
              <Avatar className="w-32 h-32 border-4 border-white shadow-lg">
                <AvatarImage src="/placeholder-avatar.png" />
                <AvatarFallback className="bg-[#e05252] text-white text-3xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 pb-2">
                <h1 className="text-3xl font-bold text-[#1a1a1a] mb-1">{profile.name}</h1>
                <div className="flex items-center gap-3 flex-wrap">
                  {profile.department && (
                    <Badge className="bg-[#c44545] text-white border-0 font-bold">
                      {profile.department}
                    </Badge>
                  )}
                  <Badge className="bg-[#f2f0ed] text-[#666] border-0 font-bold">
                    {teachingInfo.subjectsTaught.length} Subject{teachingInfo.subjectsTaught.length !== 1 ? 's' : ''}
                  </Badge>
                  <Badge className="bg-[#f2f0ed] text-[#666] border-0 font-bold">
                    {teachingInfo.totalSections} Section{teachingInfo.totalSections !== 1 ? 's' : ''}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Students Taught', value: teachingInfo.totalStudents, icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
            { label: 'Classes / Week', value: teachingInfo.totalClassesPerWeek, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-500/10' },
            { label: 'Sections', value: teachingInfo.totalSections, icon: Building2, color: 'text-purple-600', bg: 'bg-purple-500/10' },
            { label: 'Announcements', value: teachingInfo.announcementsPosted, icon: Megaphone, color: 'text-[#e05252]', bg: 'bg-[#e05252]/10' },
          ].map((stat) => (
            <Card key={stat.label} className="border-[#e5e5e5] bg-white rounded-2xl p-5">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center shrink-0`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#1a1a1a]">{stat.value}</p>
                  <p className="text-[10px] font-bold text-[#666] uppercase tracking-wider">{stat.label}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Personal Information */}
          <Card className="border-[#e5e5e5] bg-white rounded-2xl p-6">
            <h2 className="text-lg font-bold text-[#1a1a1a] mb-6 flex items-center gap-2">
              <User className="w-5 h-5 text-[#c44545]" />
              Personal Information
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#f2f0ed] flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-[#666]" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-[#666] uppercase tracking-wider mb-1">Full Name</p>
                  <p className="text-sm font-medium text-[#1a1a1a]">{profile.name}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#f2f0ed] flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-[#666]" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-[#666] uppercase tracking-wider mb-1">Email Address</p>
                  <p className="text-sm font-medium text-[#1a1a1a] break-all">{profile.email}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#f2f0ed] flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-5 h-5 text-[#666]" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-[#666] uppercase tracking-wider mb-1">Department</p>
                  <p className="text-sm font-medium text-[#1a1a1a]">{profile.department || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#f2f0ed] flex items-center justify-center flex-shrink-0">
                  <Hash className="w-5 h-5 text-[#666]" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-[#666] uppercase tracking-wider mb-1">Faculty ID</p>
                  <p className="text-xs font-mono text-[#666] break-all">{profile.id}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Teaching Information */}
          <Card className="border-[#e5e5e5] bg-white rounded-2xl p-6">
            <h2 className="text-lg font-bold text-[#1a1a1a] mb-6 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-[#c44545]" />
              Teaching Information
            </h2>
            {teachingInfo.subjectsTaught.length > 0 ? (
              <div className="space-y-4">
                {teachingInfo.subjectsTaught.map((subject) => (
                  <div key={subject.code} className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#f2f0ed] flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-5 h-5 text-[#666]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-[#666] uppercase tracking-wider mb-1">{subject.code}</p>
                      <p className="text-sm font-medium text-[#1a1a1a] truncate">{subject.name}</p>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {subject.sections.map((sec) => (
                          <span
                            key={sec}
                            className="text-[10px] font-bold bg-[#f2f0ed] text-[#666] px-2 py-0.5 rounded-full"
                          >
                            {sec}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <GraduationCap className="w-8 h-8 text-[#e5e5e5] mx-auto mb-2" />
                <p className="text-sm text-[#666]">No classes assigned yet</p>
              </div>
            )}
          </Card>
        </div>

        {/* Account Information */}
        <Card className="border-[#e5e5e5] bg-white rounded-2xl p-6">
          <h2 className="text-lg font-bold text-[#1a1a1a] mb-6">Account Information</h2>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-xs font-bold text-[#666] uppercase tracking-wider mb-2">Account Created</p>
              <p className="text-sm font-medium text-[#1a1a1a]">
                {new Date(profile.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold text-[#666] uppercase tracking-wider mb-2">Account Status</p>
              <Badge className="bg-emerald-500/10 text-emerald-600 border-0 font-bold">Active</Badge>
            </div>
            <div>
              <p className="text-xs font-bold text-[#666] uppercase tracking-wider mb-2">Role</p>
              <Badge className="bg-[#c44545]/10 text-[#c44545] border-0 font-bold">Faculty</Badge>
            </div>
          </div>
        </Card>
      </div>
    </FacultyLayout>
  );
}
