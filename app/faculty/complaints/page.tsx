'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  MessageSquare, Search, Filter, ChevronDown,
  Clock, CheckCircle2, AlertCircle, Eye, EyeOff, User,
} from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  COMPLAINT_CATEGORIES, DEPARTMENTS, COMPLAINT_STATUSES,
  type ComplaintStatus,
} from '@/lib/complaints';

import FacultyLayout from '@/components/layout/FacultyLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface FacultyComplaint {
  id: string;
  title: string;
  description: string;
  category: string;
  department: string;
  image_urls: string[];
  status: ComplaintStatus;
  created_at: string;
  updated_at: string;
  student_name?: string;
  student_roll_number?: string;
}

const statusConfig: Record<string, { icon: typeof Clock; color: string; bg: string }> = {
  Submitted: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
  'In Review': { icon: AlertCircle, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
  Resolved: { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50 border-green-200' },
};

const categoryColors: Record<string, string> = {
  Academic: 'bg-violet-100 text-violet-700 border-violet-200',
  Infrastructure: 'bg-orange-100 text-orange-700 border-orange-200',
  Hostel: 'bg-teal-100 text-teal-700 border-teal-200',
  Faculty: 'bg-rose-100 text-rose-700 border-rose-200',
  Other: 'bg-gray-100 text-gray-700 border-gray-200',
};

export default function FacultyComplaintsPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  const [complaints, setComplaints] = useState<FacultyComplaint[]>([]);
  const [loadingComplaints, setLoadingComplaints] = useState(true);
  const [isPrivileged, setIsPrivileged] = useState(false);
  const [facultyDepartment, setFacultyDepartment] = useState('');
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (!loading && (!isAuthenticated || user?.role !== 'faculty')) {
      router.push('/');
    }
  }, [loading, isAuthenticated, user, router]);

  useEffect(() => {
    if (!loading && isAuthenticated && user?.role === 'faculty') {
      fetchComplaints(false);
    }
  }, [loading, isAuthenticated, user, filterCategory, filterDepartment, filterStatus]);

  const fetchComplaints = async (withIdentity: boolean) => {
    setLoadingComplaints(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) return;

      const params = new URLSearchParams();
      if (filterCategory) params.set('category', filterCategory);
      if (filterDepartment) params.set('department', filterDepartment);
      if (filterStatus) params.set('status', filterStatus);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      if (withIdentity) params.set('revealIdentity', 'true');

      const url = `/api/faculty/complaints${params.toString() ? `?${params}` : ''}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setComplaints(data.complaints || []);
        setIsPrivileged(data.isPrivileged || false);
        setFacultyDepartment(data.facultyDepartment || '');
      }
    } catch (err) {
      console.error('Error fetching complaints:', err);
    } finally {
      setLoadingComplaints(false);
    }
  };

  const handleRevealIdentity = async (complaintId: string) => {
    if (revealedIds.has(complaintId)) {
      setRevealedIds((prev) => {
        const next = new Set(prev);
        next.delete(complaintId);
        return next;
      });
      return;
    }

    // Re-fetch with identity revealed
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) return;

      const res = await fetch(`/api/faculty/complaints?revealIdentity=true`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.complaints) {
        setComplaints(data.complaints);
        setRevealedIds((prev) => new Set(prev).add(complaintId));
      }
    } catch (err) {
      console.error('Error revealing identity:', err);
    }
  };

  const handleStatusChange = async (complaintId: string, newStatus: ComplaintStatus) => {
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) return;

      const res = await fetch('/api/faculty/complaints', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ complaintId, status: newStatus }),
      });

      if (res.ok) {
        setComplaints((prev) =>
          prev.map((c) =>
            c.id === complaintId ? { ...c, status: newStatus, updated_at: new Date().toISOString() } : c
          )
        );
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  if (loading) {
    return (
      <FacultyLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#e05252] mx-auto mb-4" />
            <p style={{ color: 'var(--ch-muted)' }}>Loading...</p>
          </div>
        </div>
      </FacultyLayout>
    );
  }

  if (!isAuthenticated || user?.role !== 'faculty') return null;

  const stats = {
    total: complaints.length,
    submitted: complaints.filter((c) => c.status === 'Submitted').length,
    inReview: complaints.filter((c) => c.status === 'In Review').length,
    resolved: complaints.filter((c) => c.status === 'Resolved').length,
  };

  return (
    <FacultyLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-1" style={{ color: 'var(--ch-text)' }}>
            Complaint Management
          </h1>
          <p style={{ color: 'var(--ch-muted)' }}>
            {isPrivileged
              ? 'View and manage all complaints across departments'
              : `Viewing complaints for ${facultyDepartment || 'your'} department`}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total', value: stats.total, color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
            { label: 'Submitted', value: stats.submitted, color: '#d97706', bg: 'rgba(217,119,6,0.1)' },
            { label: 'In Review', value: stats.inReview, color: '#2563eb', bg: 'rgba(37,99,235,0.1)' },
            { label: 'Resolved', value: stats.resolved, color: '#16a34a', bg: 'rgba(22,163,74,0.1)' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border p-4"
              style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
            >
              <p className="text-sm font-medium mb-1" style={{ color: 'var(--ch-muted)' }}>
                {stat.label}
              </p>
              <p className="text-2xl font-bold" style={{ color: stat.color }}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Search & Filters */}
        <div className="space-y-3">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                style={{ color: 'var(--ch-muted)' }}
              />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchComplaints(revealedIds.size > 0)}
                placeholder="Search complaints..."
                className="pl-10 border"
                style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)', color: 'var(--ch-text)' }}
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2 border"
              style={{ borderColor: 'var(--ch-border)', color: 'var(--ch-text)' }}
            >
              <Filter className="w-4 h-4" />
              Filters
              <ChevronDown className={`w-3 h-3 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </Button>
          </div>

          {showFilters && (
            <div
              className="flex flex-wrap gap-3 p-4 rounded-xl border animate-fade-in"
              style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
            >
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="h-9 rounded-md border px-3 text-sm"
                style={{ backgroundColor: 'var(--ch-bg)', borderColor: 'var(--ch-border)', color: 'var(--ch-text)' }}
              >
                <option value="">All Categories</option>
                {COMPLAINT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              {isPrivileged && (
                <select
                  value={filterDepartment}
                  onChange={(e) => setFilterDepartment(e.target.value)}
                  className="h-9 rounded-md border px-3 text-sm"
                  style={{ backgroundColor: 'var(--ch-bg)', borderColor: 'var(--ch-border)', color: 'var(--ch-text)' }}
                >
                  <option value="">All Departments</option>
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              )}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="h-9 rounded-md border px-3 text-sm"
                style={{ backgroundColor: 'var(--ch-bg)', borderColor: 'var(--ch-border)', color: 'var(--ch-text)' }}
              >
                <option value="">All Statuses</option>
                {COMPLAINT_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFilterCategory('');
                  setFilterDepartment('');
                  setFilterStatus('');
                  setSearchQuery('');
                }}
                className="text-[#e05252]"
              >
                Clear
              </Button>
            </div>
          )}
        </div>

        {/* Complaints List */}
        {loadingComplaints ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#e05252]" />
          </div>
        ) : complaints.length === 0 ? (
          <div
            className="rounded-2xl border p-12 text-center"
            style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
          >
            <MessageSquare className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--ch-muted)' }} />
            <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--ch-text)' }}>
              No Complaints
            </h3>
            <p style={{ color: 'var(--ch-muted)' }}>
              {isPrivileged ? 'No complaints have been submitted yet' : `No complaints for your department`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {complaints.map((complaint) => {
              const statusInfo = statusConfig[complaint.status] || statusConfig.Submitted;
              const StatusIcon = statusInfo.icon;
              const isRevealed = revealedIds.has(complaint.id);

              return (
                <div
                  key={complaint.id}
                  className="rounded-2xl border overflow-hidden"
                  style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
                >
                  <div className="p-5 space-y-3">
                    {/* Top row: badges + status change */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className={`${categoryColors[complaint.category]} border text-xs`}>
                          {complaint.category}
                        </Badge>
                        <Badge
                          className="border text-xs"
                          style={{ backgroundColor: 'var(--ch-muted-bg)', color: 'var(--ch-muted)', borderColor: 'var(--ch-border)' }}
                        >
                          {complaint.department}
                        </Badge>
                        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${statusInfo.bg}`}>
                          <StatusIcon className={`w-3 h-3 ${statusInfo.color}`} />
                          <span className={statusInfo.color}>{complaint.status}</span>
                        </div>
                      </div>

                      {/* Status dropdown */}
                      <select
                        value={complaint.status}
                        onChange={(e) => handleStatusChange(complaint.id, e.target.value as ComplaintStatus)}
                        className="h-8 rounded-md border px-2 text-xs font-medium"
                        style={{ backgroundColor: 'var(--ch-bg)', borderColor: 'var(--ch-border)', color: 'var(--ch-text)' }}
                      >
                        {COMPLAINT_STATUSES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>

                    {/* Title & Description */}
                    <h3 className="text-base font-bold" style={{ color: 'var(--ch-text)' }}>
                      {complaint.title}
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--ch-muted)' }}>
                      {complaint.description}
                    </p>

                    {/* Images */}
                    {complaint.image_urls?.length > 0 && (
                      <div className="flex overflow-x-auto gap-2 py-2">
                        {complaint.image_urls.map((url, i) => (
                          <img
                            key={i}
                            src={url}
                            alt=""
                            className="h-28 w-auto rounded-lg object-cover flex-shrink-0 border"
                            style={{ borderColor: 'var(--ch-border)' }}
                          />
                        ))}
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: 'var(--ch-border)' }}>
                      <div className="flex items-center gap-3">
                        {/* Identity section */}
                        {isPrivileged ? (
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRevealIdentity(complaint.id)}
                              className="gap-1.5 text-xs h-7 px-2"
                              style={{ color: isRevealed ? 'var(--ch-accent)' : 'var(--ch-muted)' }}
                            >
                              {isRevealed ? (
                                <><EyeOff className="w-3.5 h-3.5" /> Hide Identity</>
                              ) : (
                                <><Eye className="w-3.5 h-3.5" /> Reveal Identity</>
                              )}
                            </Button>
                            {isRevealed && complaint.student_name && (
                              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#e05252]/10 text-xs">
                                <User className="w-3 h-3 text-[#e05252]" />
                                <span className="font-medium text-[#e05252]">
                                  {complaint.student_name}
                                </span>
                                {complaint.student_roll_number && (
                                  <span className="text-[#e05252]/70">
                                    ({complaint.student_roll_number})
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs font-medium" style={{ color: 'var(--ch-muted)' }}>
                            Anonymous
                          </span>
                        )}
                      </div>

                      <span className="text-xs" style={{ color: 'var(--ch-muted)' }}>
                        {new Date(complaint.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </FacultyLayout>
  );
}
