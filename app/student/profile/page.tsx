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
  BookOpen, GraduationCap, MapPin, FileText,
  Shield, Phone, ChevronRight,
} from 'lucide-react';
import Link from 'next/link';

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

interface ExtendedDetails {
  full_name: string;
  gender: string;
  department: string;
  nature_of_work: string;
  designation: string;
  date_of_birth: string;
  father_name: string;
  mother_name: string;
  religion: string;
  caste: string;
  category: string;
  category_telangana: string;
  special_category: string;
  permanent_address: string;
  communication_address: string;
  mobile_no: string;
  email_address: string;
  pan_no: string;
  aadhar_no: string;
  apaar_id: string | null;
  abha_no: string;
}

export default function StudentProfilePage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [extendedDetails, setExtendedDetails] = useState<ExtendedDetails | null>(null);
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

      const [profileRes, detailsRes] = await Promise.all([
        fetch('/api/student/profile', {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        }),
        fetch('/api/student/details', {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        }),
      ]);

      if (profileRes.ok) {
        setProfileData(await profileRes.json());
      }
      if (detailsRes.ok) {
        const { details } = await detailsRes.json();
        setExtendedDetails(details);
      }
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

        {/* Extended Details Section */}
        {!extendedDetails ? (
          <Card className="border-[#e5e5e5] bg-white rounded-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-[#e05252]/5 to-[#c44545]/5 px-6 py-8 text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#e05252]/10 flex items-center justify-center mx-auto mb-4">
                <FileText className="w-7 h-7 text-[#e05252]" />
              </div>
              <h3 className="text-lg font-bold text-[#1a1a1a] mb-1">Complete Your Profile</h3>
              <p className="text-sm text-[#666] mb-5 max-w-md mx-auto">
                You haven't filled in your detailed information yet. Complete all required fields to keep your profile up to date.
              </p>
              <Link href="/student/details">
                <button className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#e05252] text-white text-sm font-bold hover:bg-[#c44545] transition-colors shadow-md shadow-[#e05252]/20">
                  Fill Details <ChevronRight className="w-4 h-4" />
                </button>
              </Link>
            </div>
          </Card>
        ) : (
          <>
            {/* Edit button */}
            <div className="flex justify-end">
              <Link href="/student/details">
                <button className="text-xs font-bold text-[#e05252] hover:underline">
                  Edit Details
                </button>
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* Family Details */}
              <Card className="border-[#e5e5e5] bg-white rounded-2xl p-6">
                <h2 className="text-lg font-bold text-[#1a1a1a] mb-6 flex items-center gap-2">
                  <User className="w-5 h-5 text-[#c44545]" />
                  Family Details
                </h2>
                <div className="space-y-4">
                  {[
                    { icon: User, label: "Father's Name", value: extendedDetails.father_name },
                    { icon: User, label: "Mother's Name", value: extendedDetails.mother_name },
                    { icon: BookOpen, label: 'Religion', value: extendedDetails.religion },
                    { icon: Hash, label: 'Caste', value: extendedDetails.caste },
                  ].map((item) => (
                    <div key={item.label} className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#f2f0ed] flex items-center justify-center flex-shrink-0">
                        <item.icon className="w-5 h-5 text-[#666]" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-[#666] uppercase tracking-wider mb-1">{item.label}</p>
                        <p className="text-sm font-medium text-[#1a1a1a]">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Category Details */}
              <Card className="border-[#e5e5e5] bg-white rounded-2xl p-6">
                <h2 className="text-lg font-bold text-[#1a1a1a] mb-6 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-[#c44545]" />
                  Category Details
                </h2>
                <div className="space-y-4">
                  {[
                    { label: 'Category', value: extendedDetails.category },
                    { label: 'Category (Telangana)', value: extendedDetails.category_telangana },
                    { label: 'Special Category', value: extendedDetails.special_category },
                  ].map((item) => (
                    <div key={item.label} className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#f2f0ed] flex items-center justify-center flex-shrink-0">
                        <Shield className="w-5 h-5 text-[#666]" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-[#666] uppercase tracking-wider mb-1">{item.label}</p>
                        <p className="text-sm font-medium text-[#1a1a1a]">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Contact Details */}
            <Card className="border-[#e5e5e5] bg-white rounded-2xl p-6">
              <h2 className="text-lg font-bold text-[#1a1a1a] mb-6 flex items-center gap-2">
                <Phone className="w-5 h-5 text-[#c44545]" />
                Contact Details
              </h2>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-bold text-[#666] uppercase tracking-wider mb-2">Permanent Address</p>
                  <p className="text-sm font-medium text-[#1a1a1a] whitespace-pre-line">{extendedDetails.permanent_address}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-[#666] uppercase tracking-wider mb-2">Communication Address</p>
                  <p className="text-sm font-medium text-[#1a1a1a] whitespace-pre-line">{extendedDetails.communication_address}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-[#666] uppercase tracking-wider mb-2">Mobile No.</p>
                  <p className="text-sm font-medium text-[#1a1a1a]">{extendedDetails.mobile_no}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-[#666] uppercase tracking-wider mb-2">Email Address</p>
                  <p className="text-sm font-medium text-[#1a1a1a] break-all">{extendedDetails.email_address}</p>
                </div>
              </div>
            </Card>

            {/* ID Documents */}
            <Card className="border-[#e5e5e5] bg-white rounded-2xl p-6">
              <h2 className="text-lg font-bold text-[#1a1a1a] mb-6 flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#c44545]" />
                ID Documents
              </h2>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-bold text-[#666] uppercase tracking-wider mb-2">PAN No.</p>
                  <p className="text-sm font-medium text-[#1a1a1a] font-mono">{extendedDetails.pan_no}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-[#666] uppercase tracking-wider mb-2">Aadhar No.</p>
                  <p className="text-sm font-medium text-[#1a1a1a] font-mono">{extendedDetails.aadhar_no}</p>
                </div>
                {extendedDetails.apaar_id && (
                  <div>
                    <p className="text-xs font-bold text-[#666] uppercase tracking-wider mb-2">APAAR ID</p>
                    <p className="text-sm font-medium text-[#1a1a1a] font-mono">{extendedDetails.apaar_id}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs font-bold text-[#666] uppercase tracking-wider mb-2">ABHA No.</p>
                  <p className="text-sm font-medium text-[#1a1a1a] font-mono">{extendedDetails.abha_no}</p>
                </div>
              </div>
            </Card>
          </>
        )}
      </div>
    </StudentLayout>
  );
}
