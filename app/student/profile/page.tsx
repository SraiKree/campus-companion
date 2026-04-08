'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import StudentLayout from '@/components/layout/StudentLayout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/lib/supabase';
import { 
  User, Mail, Hash, Building2, Calendar, 
  BookOpen, GraduationCap, MapPin
} from 'lucide-react';

interface ProfileData {
  profile: {
    id: string;
    name: string;
    email: string;
    roll_no: string | null;
    department: string | null;
    class_name: string | null;
    created_at: string;
  };
  studentDetails: {
    roll_number: string;
    name: string;
    department: string;
    section: string;
    semester: string;
    year: string;
    email: string;
  } | null;
  authEmail: string;
}

export default function StudentProfilePage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push('/');
      } else if (user?.role !== 'student') {
        router.push('/');
      }
    }
  }, [authLoading, isAuthenticated, user, router]);

  useEffect(() => {
    if (!authLoading && isAuthenticated && user?.role === 'student') {
      fetchProfile();
    }
  }, [authLoading, isAuthenticated, user]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      const res = await fetch('/api/student/profile', {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      if (!res.ok) {
        throw new Error('Failed to load profile');
      }

      const data = await res.json();
      setProfileData(data);
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#c44545] mx-auto mb-4"></div>
            <p className="text-[#666]">Loading profile...</p>
          </div>
        </div>
      </StudentLayout>
    );
  }

  if (!isAuthenticated || user?.role !== 'student' || !profileData) {
    return null;
  }

  const { profile, studentDetails } = profileData;
  const initials = profile.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'ST';

  return (
    <StudentLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header Card */}
        <Card className="border-[#e5e5e5] bg-white rounded-2xl overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-[#c44545] to-[#e05252]"></div>
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
                <div className="flex items-center gap-3">
                  {studentDetails && (
                    <>
                      <Badge className="bg-[#c44545] text-white border-0 font-bold">
                        {studentDetails.department} - {studentDetails.section}
                      </Badge>
                      <Badge className="bg-[#f2f0ed] text-[#666] border-0 font-bold">
                        Year {studentDetails.year}
                      </Badge>
                      <Badge className="bg-[#f2f0ed] text-[#666] border-0 font-bold">
                        Semester {studentDetails.semester}
                      </Badge>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>

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
                  <p className="text-sm font-medium text-[#1a1a1a]">{studentDetails?.name || profile.name}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#f2f0ed] flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-[#666]" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-[#666] uppercase tracking-wider mb-1">Email Address</p>
                  <p className="text-sm font-medium text-[#1a1a1a] break-all">{studentDetails?.email || profile.email}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#f2f0ed] flex items-center justify-center flex-shrink-0">
                  <Hash className="w-5 h-5 text-[#666]" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-[#666] uppercase tracking-wider mb-1">Roll Number</p>
                  <p className="text-sm font-medium text-[#1a1a1a]">{profile.roll_no || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#f2f0ed] flex items-center justify-center flex-shrink-0">
                  <Hash className="w-5 h-5 text-[#666]" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-[#666] uppercase tracking-wider mb-1">User ID</p>
                  <p className="text-xs font-mono text-[#666] break-all">{profile.id}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Academic Information */}
          <Card className="border-[#e5e5e5] bg-white rounded-2xl p-6">
            <h2 className="text-lg font-bold text-[#1a1a1a] mb-6 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-[#c44545]" />
              Academic Information
            </h2>
            {studentDetails ? (
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#f2f0ed] flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-5 h-5 text-[#666]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-[#666] uppercase tracking-wider mb-1">Department</p>
                    <p className="text-sm font-medium text-[#1a1a1a]">{studentDetails.department}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#f2f0ed] flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-[#666]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-[#666] uppercase tracking-wider mb-1">Section</p>
                    <p className="text-sm font-medium text-[#1a1a1a]">{studentDetails.section}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#f2f0ed] flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-5 h-5 text-[#666]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-[#666] uppercase tracking-wider mb-1">Current Semester</p>
                    <p className="text-sm font-medium text-[#1a1a1a]">Semester {studentDetails.semester}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#f2f0ed] flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 text-[#666]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-[#666] uppercase tracking-wider mb-1">Academic Year</p>
                    <p className="text-sm font-medium text-[#1a1a1a]">Year {studentDetails.year}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-[#666]">No academic details available</p>
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
                  day: 'numeric'
                })}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold text-[#666] uppercase tracking-wider mb-2">Account Status</p>
              <Badge className="bg-emerald-500/10 text-emerald-600 border-0 font-bold">
                Active
              </Badge>
            </div>
            <div>
              <p className="text-xs font-bold text-[#666] uppercase tracking-wider mb-2">Role</p>
              <Badge className="bg-[#c44545]/10 text-[#c44545] border-0 font-bold">
                Student
              </Badge>
            </div>
          </div>
        </Card>
      </div>
    </StudentLayout>
  );
}
