'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  User, Mail, Hash, Building2, Calendar, 
  BookOpen, GraduationCap, MapPin, Home
} from 'lucide-react';

interface PublicProfileData {
  profile: {
    id: string;
    name: string;
    roll_no: string | null;
    department: string | null;
    class_name: string | null;
  };
  studentDetails: {
    roll_number: string;
    name: string;
    department: string;
    section: string;
    semester: string;
    year: string;
  } | null;
}

export default function PublicProfilePage() {
  const params = useParams();
  const userId = params?.userId as string;
  const [profileData, setProfileData] = useState<PublicProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchPublicProfile();
    }
  }, [userId]);

  const fetchPublicProfile = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/student/profile/public/${userId}`);

      if (!res.ok) {
        throw new Error('Failed to load profile');
      }

      const data = await res.json();
      setProfileData(data);
    } catch (err) {
      console.error('Error fetching public profile:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f9f8f6] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#c44545] mx-auto mb-4"></div>
          <p className="text-[#666]">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="min-h-screen bg-[#f9f8f6] flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-[#f2f0ed] rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-[#666]" />
          </div>
          <h1 className="text-2xl font-bold text-[#1a1a1a] mb-2">Profile Not Found</h1>
          <p className="text-[#666]">The student profile you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  const { profile, studentDetails } = profileData;
  const initials = profile.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'ST';

  return (
    <div className="min-h-screen bg-[#f9f8f6]">
      {/* Header */}
      <header className="bg-white border-b border-[#e5e5e5] py-4 px-6">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <div className="w-10 h-10 bg-[#e05252] rounded-lg flex items-center justify-center">
            <Home className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#1a1a1a] tracking-tight">Campus Hub</h1>
            <p className="text-[10px] font-bold text-[#666] uppercase tracking-wider">Public Profile</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-5xl mx-auto py-12 px-6 space-y-6">
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
          {/* Basic Information */}
          <Card className="border-[#e5e5e5] bg-white rounded-2xl p-6">
            <h2 className="text-lg font-bold text-[#1a1a1a] mb-6 flex items-center gap-2">
              <User className="w-5 h-5 text-[#c44545]" />
              Basic Information
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
                  <Hash className="w-5 h-5 text-[#666]" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-[#666] uppercase tracking-wider mb-1">Roll Number</p>
                  <p className="text-sm font-medium text-[#1a1a1a]">{profile.roll_no || 'N/A'}</p>
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
      </div>
    </div>
  );
}
