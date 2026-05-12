'use client';

import { useState, useMemo } from 'react';
import { useRoleProtection } from '@/hooks/useRoleProtection';
import { useClubRecruitment } from '@/hooks/useClubRecruitment';
import ClubLayout from '@/components/layout/ClubLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Search, Filter, Users, CheckCircle, XCircle, Clock, Bookmark,
  ExternalLink, Github, Linkedin, Globe, Mail, Phone, GraduationCap,
  AlertCircle, Trash2,
} from 'lucide-react';
import type { ClubApplication, ApplicationStatus } from '@/types/club';
import { useToast } from '@/hooks/use-toast';
import { MOCK_APPLICATIONS } from '@/lib/club-mock-data';

const STATUS_CONFIG: Record<ApplicationStatus, { label: string; color: string; bg: string; icon: React.ComponentType<{ className?: string }> }> = {
  Pending: { label: 'Pending', color: '#f59e0b', bg: '#f59e0b20', icon: Clock },
  Shortlisted: { label: 'Shortlisted', color: '#3b82f6', bg: '#3b82f620', icon: Bookmark },
  Selected: { label: 'Selected', color: '#22c55e', bg: '#22c55e20', icon: CheckCircle },
  Rejected: { label: 'Rejected', color: '#ef4444', bg: '#ef444420', icon: XCircle },
};

const ALL_STATUSES: ApplicationStatus[] = ['Pending', 'Shortlisted', 'Selected', 'Rejected'];

export default function ClubRecruitmentPage() {
  const { loading, authorized } = useRoleProtection('club');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { applications, loading: appLoading, error, updateStatus, deleteApplication } = useClubRecruitment(statusFilter);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<ClubApplication | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const { toast } = useToast();

  // Use mock data when API returns nothing (dev/demo fallback)
  const displayApplications = !appLoading && applications.length === 0 ? MOCK_APPLICATIONS : applications;

  const filtered = useMemo(() => {
    const src = statusFilter !== 'all'
      ? displayApplications.filter((a) => a.status === statusFilter)
      : displayApplications;
    if (!search.trim()) return src;
    const q = search.toLowerCase();
    return src.filter(
      (a) =>
        a.full_name.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        (a.department || '').toLowerCase().includes(q) ||
        (a.skills || '').toLowerCase().includes(q)
    );
  }, [displayApplications, statusFilter, search]);

  const handleStatusChange = async (id: string, status: ApplicationStatus) => {
    setUpdating(id);
    try {
      await updateStatus(id, status);
      if (selected?.id === id) setSelected((prev) => prev ? { ...prev, status } : null);
      toast({ title: 'Status updated', description: `Application marked as ${status}` });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setUpdating(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this application? This cannot be undone.')) return;
    try {
      await deleteApplication(id);
      if (selected?.id === id) setSelected(null);
      toast({ title: 'Deleted', description: 'Application removed' });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const counts = useMemo(() => {
    const all = displayApplications;
    return {
      all: all.length,
      Pending: all.filter((a) => a.status === 'Pending').length,
      Shortlisted: all.filter((a) => a.status === 'Shortlisted').length,
      Selected: all.filter((a) => a.status === 'Selected').length,
      Rejected: all.filter((a) => a.status === 'Rejected').length,
    };
  }, [displayApplications]);

  if (loading || !authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <ClubLayout>
      <div className="max-w-5xl space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-black" style={{ color: 'var(--ch-text)' }}>Recruitment</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--ch-muted)' }}>
            Review and manage club membership applications
          </p>
        </div>

        {/* Overview stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {([['all', 'All', '#6366f1'], ...ALL_STATUSES.map((s) => [s, s, STATUS_CONFIG[s].color])] as [string, string, string][]).map(([key, label, color]) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className="rounded-xl p-3 border text-left transition-all duration-150"
              style={{
                backgroundColor: statusFilter === key ? `${color}15` : 'var(--ch-card)',
                borderColor: statusFilter === key ? color : 'var(--ch-border)',
              }}
            >
              <p className="text-xl font-black" style={{ color }}>
                {counts[key as keyof typeof counts] ?? 0}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-wider mt-0.5" style={{ color: 'var(--ch-muted)' }}>
                {label}
              </p>
            </button>
          ))}
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl border p-3 text-sm" style={{ borderColor: 'rgba(220,38,38,0.3)', color: '#dc2626' }}>
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Search */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--ch-muted)' }} />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, department, or skills..."
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--ch-muted)' }}>
            <Filter className="w-3.5 h-3.5" />
            {filtered.length} results
          </div>
        </div>

        {/* Applications list */}
        {appLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div
            className="rounded-xl border p-12 text-center"
            style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
          >
            <Users className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--ch-muted)' }} />
            <p className="text-sm font-semibold" style={{ color: 'var(--ch-text)' }}>No applications found</p>
            <p className="text-xs mt-1" style={{ color: 'var(--ch-muted)' }}>
              {search ? 'Try a different search query' : 'No applications have been submitted yet'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((app) => {
              const cfg = STATUS_CONFIG[app.status];
              const Icon = cfg.icon;
              return (
                <div
                  key={app.id}
                  className="rounded-xl border transition-all duration-150 hover:shadow-sm cursor-pointer"
                  style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
                  onClick={() => setSelected(app)}
                >
                  <div className="flex items-center gap-4 px-5 py-4">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                      style={{ backgroundColor: cfg.color }}
                    >
                      {app.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-bold" style={{ color: 'var(--ch-text)' }}>
                          {app.full_name}
                        </p>
                        <Badge
                          className="text-[10px] font-bold border-0 px-2 py-0.5"
                          style={{ backgroundColor: cfg.bg, color: cfg.color }}
                        >
                          <Icon className="w-2.5 h-2.5 mr-1" />
                          {app.status}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-3 mt-0.5 text-xs" style={{ color: 'var(--ch-muted)' }}>
                        <span className="inline-flex items-center gap-1"><Mail className="w-3 h-3" /> {app.email}</span>
                        {app.department && <span className="inline-flex items-center gap-1"><GraduationCap className="w-3 h-3" /> {app.department}</span>}
                        {app.year && <span>{app.year}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      <Select
                        value={app.status}
                        onValueChange={(v) => handleStatusChange(app.id, v as ApplicationStatus)}
                        disabled={updating === app.id}
                      >
                        <SelectTrigger className="w-32 h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ALL_STATUSES.map((s) => (
                            <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => handleDelete(app.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" style={{ color: '#ef4444' }} />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Application Detail Modal */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        {selected && (
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: STATUS_CONFIG[selected.status].color }}
                >
                  {selected.full_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p style={{ color: 'var(--ch-text)' }}>{selected.full_name}</p>
                  <p className="text-xs font-normal mt-0.5" style={{ color: 'var(--ch-muted)' }}>
                    Applied {new Date(selected.created_at).toLocaleDateString()}
                  </p>
                </div>
              </DialogTitle>
              <DialogDescription>
                <Badge
                  className="mt-2 text-xs font-bold border-0"
                  style={{
                    backgroundColor: STATUS_CONFIG[selected.status].bg,
                    color: STATUS_CONFIG[selected.status].color,
                  }}
                >
                  {selected.status}
                </Badge>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 mt-2">
              {/* Contact & Info */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  { label: 'Email', value: selected.email, icon: Mail },
                  { label: 'Phone', value: selected.phone, icon: Phone },
                  { label: 'Department', value: selected.department, icon: GraduationCap },
                  { label: 'Year', value: selected.year, icon: Users },
                ].map(({ label, value, icon: Icon }) =>
                  value ? (
                    <div key={label} className="flex items-start gap-2">
                      <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--ch-muted)' }} />
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--ch-muted)' }}>
                          {label}
                        </p>
                        <p style={{ color: 'var(--ch-text)' }}>{value}</p>
                      </div>
                    </div>
                  ) : null
                )}
              </div>

              {/* Skills */}
              {selected.skills && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--ch-muted)' }}>Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.skills.split(',').map((s) => (
                      <span
                        key={s}
                        className="px-2.5 py-0.5 rounded-full text-xs font-medium"
                        style={{ backgroundColor: 'var(--ch-nav-active)', color: 'var(--ch-accent)' }}
                      >
                        {s.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Why join */}
              {selected.why_join && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--ch-muted)' }}>
                    Why they want to join
                  </p>
                  <p className="text-sm leading-relaxed p-3 rounded-lg" style={{ backgroundColor: 'var(--ch-bg)', color: 'var(--ch-text)' }}>
                    {selected.why_join}
                  </p>
                </div>
              )}

              {/* Experience */}
              {selected.experience && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--ch-muted)' }}>
                    Previous Experience
                  </p>
                  <p className="text-sm leading-relaxed p-3 rounded-lg" style={{ backgroundColor: 'var(--ch-bg)', color: 'var(--ch-text)' }}>
                    {selected.experience}
                  </p>
                </div>
              )}

              {/* Links */}
              {(selected.github_url || selected.linkedin_url || selected.portfolio_url || selected.resume_url) && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--ch-muted)' }}>Links</p>
                  <div className="flex flex-wrap gap-2">
                    {selected.resume_url && (
                      <a href={selected.resume_url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border"
                        style={{ borderColor: 'var(--ch-border)', color: 'var(--ch-text)' }}>
                        <ExternalLink className="w-3.5 h-3.5" /> Resume
                      </a>
                    )}
                    {selected.github_url && (
                      <a href={selected.github_url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border"
                        style={{ borderColor: 'var(--ch-border)', color: 'var(--ch-text)' }}>
                        <Github className="w-3.5 h-3.5" /> GitHub
                      </a>
                    )}
                    {selected.linkedin_url && (
                      <a href={selected.linkedin_url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border"
                        style={{ borderColor: 'var(--ch-border)', color: 'var(--ch-text)' }}>
                        <Linkedin className="w-3.5 h-3.5" /> LinkedIn
                      </a>
                    )}
                    {selected.portfolio_url && (
                      <a href={selected.portfolio_url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border"
                        style={{ borderColor: 'var(--ch-border)', color: 'var(--ch-text)' }}>
                        <Globe className="w-3.5 h-3.5" /> Portfolio
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Status actions */}
              <div
                className="pt-4 border-t flex flex-wrap items-center gap-2"
                style={{ borderColor: 'var(--ch-border)' }}
              >
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--ch-muted)' }}>
                  Update Status:
                </span>
                {ALL_STATUSES.map((s) => {
                  const cfg = STATUS_CONFIG[s];
                  return (
                    <Button
                      key={s}
                      size="sm"
                      variant={selected.status === s ? 'default' : 'outline'}
                      className="h-7 text-xs font-bold px-3 border"
                      style={
                        selected.status === s
                          ? { backgroundColor: cfg.color, color: '#fff', borderColor: cfg.color }
                          : { borderColor: cfg.color, color: cfg.color }
                      }
                      disabled={updating === selected.id}
                      onClick={() => handleStatusChange(selected.id, s)}
                    >
                      {s}
                    </Button>
                  );
                })}
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </ClubLayout>
  );
}
