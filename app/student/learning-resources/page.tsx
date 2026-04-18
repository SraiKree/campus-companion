'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BookOpen, Video, FileText, Library, Search, Download, ExternalLink,
  Bookmark, BookmarkCheck, Clock, Eye, User, Calendar, Filter,
} from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  RESOURCE_TYPES, RESOURCE_TYPE_LABEL, SEMESTERS,
  formatFileSize, isEmbeddableVideo,
  type LearningResource, type ResourceType,
} from '@/lib/learning-resources';

import StudentLayout from '@/components/layout/StudentLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';

const TYPE_META: Record<ResourceType, { icon: any; color: string; soft: string }> = {
  notes:     { icon: FileText, color: '#e05252', soft: 'rgba(224,82,82,0.1)' },
  lecture:   { icon: Video,    color: '#2563eb', soft: 'rgba(37,99,235,0.1)' },
  syllabus:  { icon: BookOpen, color: '#16a34a', soft: 'rgba(22,163,74,0.1)' },
  reference: { icon: Library,  color: '#9333ea', soft: 'rgba(147,51,234,0.1)' },
};

const FILE_ICON: Record<string, string> = {
  pdf: 'PDF', video: 'MP4', ppt: 'PPT', doc: 'DOC', image: 'IMG', archive: 'ZIP', file: 'FILE',
};

export default function StudentLearningResourcesPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  const [tab, setTab] = useState<'all' | ResourceType | 'bookmarks' | 'recent'>('all');
  const [resources, setResources] = useState<LearningResource[]>([]);
  const [bookmarked, setBookmarked] = useState<LearningResource[]>([]);
  const [recent, setRecent] = useState<LearningResource[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [faculties, setFaculties] = useState<{ id: string; name: string }[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('');
  const [facultyFilter, setFacultyFilter] = useState('');

  const [preview, setPreview] = useState<LearningResource | null>(null);

  useEffect(() => {
    if (!loading && (!isAuthenticated || user?.role !== 'student')) {
      router.push('/');
    }
  }, [loading, isAuthenticated, user, router]);

  const fetchAll = async () => {
    setLoadingData(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) return;
      const headers = { Authorization: `Bearer ${token}` };

      const params = new URLSearchParams();
      if (subjectFilter) params.set('subject', subjectFilter);
      if (semesterFilter) params.set('semester', semesterFilter);
      if (facultyFilter) params.set('faculty', facultyFilter);
      if (search.trim()) params.set('search', search.trim());

      const [allRes, bmRes, recentRes] = await Promise.all([
        fetch(`/api/student/learning-resources?${params.toString()}`, { headers }),
        fetch('/api/student/learning-resources/bookmarks', { headers }),
        fetch('/api/student/learning-resources/views', { headers }),
      ]);

      const [allJson, bmJson, recentJson] = await Promise.all([
        allRes.json(), bmRes.json(), recentRes.json(),
      ]);

      setResources(allJson.resources || []);
      setSubjects(allJson.subjects || []);
      setFaculties(allJson.faculties || []);
      setBookmarked(bmJson.resources || []);
      setRecent(recentJson.resources || []);
    } catch (err) {
      console.error('Resources fetch error:', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (!loading && isAuthenticated && user?.role === 'student') fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, isAuthenticated, user?.role]);

  useEffect(() => {
    const h = setTimeout(() => {
      if (isAuthenticated && user?.role === 'student') fetchAll();
    }, 250);
    return () => clearTimeout(h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, subjectFilter, semesterFilter, facultyFilter]);

  const filteredForTab = useMemo(() => {
    if (tab === 'bookmarks') return bookmarked;
    if (tab === 'recent') return recent;
    if (tab === 'all') return resources;
    return resources.filter((r) => r.type === tab);
  }, [tab, resources, bookmarked, recent]);

  const toggleBookmark = async (r: LearningResource) => {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

    const wasBookmarked = !!r.is_bookmarked;
    // Optimistic
    setResources((list) => list.map((x) => x.id === r.id ? { ...x, is_bookmarked: !wasBookmarked } : x));
    setRecent((list) => list.map((x) => x.id === r.id ? { ...x, is_bookmarked: !wasBookmarked } : x));
    setBookmarked((list) =>
      wasBookmarked
        ? list.filter((x) => x.id !== r.id)
        : [{ ...r, is_bookmarked: true }, ...list]
    );

    if (wasBookmarked) {
      await fetch(`/api/student/learning-resources/bookmarks?resource_id=${r.id}`, { method: 'DELETE', headers });
    } else {
      await fetch('/api/student/learning-resources/bookmarks', {
        method: 'POST', headers, body: JSON.stringify({ resource_id: r.id }),
      });
    }
  };

  const logView = async (r: LearningResource) => {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    if (!token) return;
    await fetch('/api/student/learning-resources/views', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ resource_id: r.id }),
    });
  };

  const openResource = (r: LearningResource) => {
    logView(r);
    const canPreview = r.file_type === 'pdf' || r.file_type === 'video' ||
      (r.external_link && isEmbeddableVideo(r.external_link));
    if (canPreview) setPreview(r);
    else {
      const url = r.file_url || r.external_link;
      if (url) window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const downloadResource = (r: LearningResource) => {
    logView(r);
    const url = r.file_url || r.external_link;
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = r.title;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (loading) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#e05252]" />
        </div>
      </StudentLayout>
    );
  }
  if (!isAuthenticated || user?.role !== 'student') return null;

  const totals = {
    all: resources.length,
    notes: resources.filter((r) => r.type === 'notes').length,
    lecture: resources.filter((r) => r.type === 'lecture').length,
    syllabus: resources.filter((r) => r.type === 'syllabus').length,
    reference: resources.filter((r) => r.type === 'reference').length,
    bookmarks: bookmarked.length,
    recent: recent.length,
  };

  return (
    <StudentLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3" style={{ color: 'var(--ch-text)' }}>
              <BookOpen className="w-8 h-8 text-[#e05252]" />
              Learning Resources
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--ch-muted)' }}>
              Notes, lectures, syllabus and reference materials uploaded by your faculty
            </p>
          </div>
        </div>

        {/* Search + filters */}
        <div
          className="rounded-2xl border p-4 space-y-3"
          style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--ch-muted)' }} />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, subject, or description..."
              className="pl-10 border"
              style={{ backgroundColor: 'var(--ch-bg)', borderColor: 'var(--ch-border)', color: 'var(--ch-text)' }}
            />
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--ch-muted)' }}>
              <Filter className="w-3.5 h-3.5" /> Filters:
            </div>
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="h-9 rounded-md border px-3 text-sm"
              style={{ backgroundColor: 'var(--ch-bg)', borderColor: 'var(--ch-border)', color: 'var(--ch-text)' }}
            >
              <option value="">All Subjects</option>
              {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select
              value={semesterFilter}
              onChange={(e) => setSemesterFilter(e.target.value)}
              className="h-9 rounded-md border px-3 text-sm"
              style={{ backgroundColor: 'var(--ch-bg)', borderColor: 'var(--ch-border)', color: 'var(--ch-text)' }}
            >
              <option value="">All Semesters</option>
              {SEMESTERS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select
              value={facultyFilter}
              onChange={(e) => setFacultyFilter(e.target.value)}
              className="h-9 rounded-md border px-3 text-sm"
              style={{ backgroundColor: 'var(--ch-bg)', borderColor: 'var(--ch-border)', color: 'var(--ch-text)' }}
            >
              <option value="">All Faculty</option>
              {faculties.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
            {(subjectFilter || semesterFilter || facultyFilter || search) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setSubjectFilter(''); setSemesterFilter(''); setFacultyFilter(''); setSearch(''); }}
                className="h-9 text-xs"
              >
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList
            className="h-auto p-1 rounded-xl border flex-wrap"
            style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
          >
            <TabTrig value="all" icon={BookOpen} label="All" count={totals.all} />
            {RESOURCE_TYPES.map((t) => {
              const M = TYPE_META[t];
              return <TabTrig key={t} value={t} icon={M.icon} label={RESOURCE_TYPE_LABEL[t]} count={totals[t]} />;
            })}
            <TabTrig value="bookmarks" icon={Bookmark} label="Bookmarks" count={totals.bookmarks} />
            <TabTrig value="recent" icon={Clock} label="Recent" count={totals.recent} />
          </TabsList>

          {(['all', 'notes', 'lecture', 'syllabus', 'reference', 'bookmarks', 'recent'] as const).map((v) => (
            <TabsContent key={v} value={v} className="mt-6">
              {loadingData ? (
                <LoadingBlock />
              ) : filteredForTab.length === 0 ? (
                <EmptyBlock
                  icon={v === 'bookmarks' ? Bookmark : v === 'recent' ? Clock : BookOpen}
                  title={
                    v === 'bookmarks' ? 'No bookmarks yet' :
                    v === 'recent' ? 'No recent views' :
                    'No resources found'
                  }
                  message={
                    v === 'bookmarks' ? 'Save resources for quick access later' :
                    v === 'recent' ? 'Resources you open will appear here' :
                    'Try changing your search or filters'
                  }
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredForTab.map((r) => (
                    <ResourceCard
                      key={r.id}
                      resource={r}
                      onOpen={() => openResource(r)}
                      onDownload={() => downloadResource(r)}
                      onToggleBookmark={() => toggleBookmark(r)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Preview dialog */}
      <PreviewDialog resource={preview} onClose={() => setPreview(null)} />
    </StudentLayout>
  );
}

function TabTrig({ value, icon: Icon, label, count }: { value: string; icon: any; label: string; count: number }) {
  return (
    <TabsTrigger value={value} className="gap-2 data-[state=active]:bg-[#e05252] data-[state=active]:text-white">
      <Icon className="w-4 h-4" /> {label}
      <Badge
        variant="outline"
        className="ml-1 text-[10px] h-5 min-w-5 px-1.5 data-[state=active]:bg-white/20"
      >
        {count}
      </Badge>
    </TabsTrigger>
  );
}

function ResourceCard({
  resource, onOpen, onDownload, onToggleBookmark,
}: {
  resource: LearningResource;
  onOpen: () => void;
  onDownload: () => void;
  onToggleBookmark: () => void;
}) {
  const M = TYPE_META[resource.type];
  const Icon = M.icon;
  const badgeLabel = resource.file_type ? FILE_ICON[resource.file_type] || resource.file_type.toUpperCase() : null;

  return (
    <div
      className="rounded-2xl border overflow-hidden flex flex-col hover:shadow-md transition-shadow"
      style={{
        backgroundColor: 'var(--ch-card)',
        borderColor: 'var(--ch-border)',
        borderLeft: `4px solid ${M.color}`,
      }}
    >
      <div className="p-5 flex-1 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: M.soft, color: M.color }}
            >
              <Icon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <Badge
                className="border text-[10px] mb-1"
                style={{ backgroundColor: M.soft, color: M.color, borderColor: M.color + '40' }}
              >
                {RESOURCE_TYPE_LABEL[resource.type]}
              </Badge>
              <h3 className="font-bold text-base leading-tight truncate" style={{ color: 'var(--ch-text)' }}>
                {resource.title}
              </h3>
            </div>
          </div>
          <button
            onClick={onToggleBookmark}
            className="flex-shrink-0"
            aria-label={resource.is_bookmarked ? 'Remove bookmark' : 'Bookmark'}
          >
            {resource.is_bookmarked
              ? <BookmarkCheck className="w-5 h-5 text-[#e05252]" fill="#e05252" />
              : <Bookmark className="w-5 h-5" style={{ color: 'var(--ch-muted)' }} />
            }
          </button>
        </div>

        <div className="space-y-1.5">
          <p className="text-sm font-medium" style={{ color: 'var(--ch-text)' }}>
            {resource.subject}
            {resource.subject_code && (
              <span className="font-normal ml-1.5" style={{ color: 'var(--ch-muted)' }}>
                · {resource.subject_code}
              </span>
            )}
          </p>
          {resource.description && (
            <p className="text-xs line-clamp-2" style={{ color: 'var(--ch-muted)' }}>
              {resource.description}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {resource.semester && (
            <Badge variant="outline" className="text-[10px]">{resource.semester}</Badge>
          )}
          {resource.department && (
            <Badge variant="outline" className="text-[10px]">{resource.department}</Badge>
          )}
          {badgeLabel && (
            <Badge variant="outline" className="text-[10px]">{badgeLabel}</Badge>
          )}
          {resource.file_size && (
            <Badge variant="outline" className="text-[10px]">{formatFileSize(resource.file_size)}</Badge>
          )}
        </div>

        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs" style={{ color: 'var(--ch-muted)' }}>
          <span className="flex items-center gap-1"><User className="w-3 h-3" /> {resource.uploaded_by_name || '—'}</span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {new Date(resource.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>
      </div>

      <div
        className="flex gap-2 p-3 border-t"
        style={{ borderColor: 'var(--ch-border)', backgroundColor: 'var(--ch-card-2)' }}
      >
        <Button
          onClick={onOpen}
          size="sm"
          className="flex-1 gap-1.5 bg-[#e05252] hover:bg-[#c94545] text-white"
        >
          <Eye className="w-3.5 h-3.5" />
          {resource.type === 'lecture' || (resource.external_link && isEmbeddableVideo(resource.external_link)) ? 'Watch' : 'View'}
        </Button>
        <Button
          onClick={onDownload}
          size="sm"
          variant="outline"
          className="gap-1.5"
        >
          {resource.external_link && !resource.file_url
            ? <><ExternalLink className="w-3.5 h-3.5" /> Open</>
            : <><Download className="w-3.5 h-3.5" /> Download</>
          }
        </Button>
      </div>
    </div>
  );
}

function PreviewDialog({ resource, onClose }: { resource: LearningResource | null; onClose: () => void }) {
  if (!resource) return null;
  const videoEmbed = resource.external_link ? isEmbeddableVideo(resource.external_link) : null;

  return (
    <Dialog open={!!resource} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl w-[95vw] h-[85vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-3">
          <DialogTitle className="text-lg">{resource.title}</DialogTitle>
          <DialogDescription className="flex flex-wrap items-center gap-2 text-xs">
            <span>{resource.subject}</span>
            {resource.uploaded_by_name && <span>· by {resource.uploaded_by_name}</span>}
            {resource.semester && <span>· {resource.semester}</span>}
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0 border-t" style={{ borderColor: 'var(--ch-border)' }}>
          {resource.file_type === 'pdf' && resource.file_url ? (
            <iframe src={resource.file_url} className="w-full h-full" title={resource.title} />
          ) : resource.file_type === 'video' && resource.file_url ? (
            <video src={resource.file_url} controls className="w-full h-full bg-black" />
          ) : videoEmbed ? (
            <iframe
              src={videoEmbed}
              className="w-full h-full"
              title={resource.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="h-full flex items-center justify-center p-8">
              <div className="text-center space-y-3">
                <p style={{ color: 'var(--ch-muted)' }}>Preview not available for this file type.</p>
                <Button
                  onClick={() => {
                    const url = resource.file_url || resource.external_link;
                    if (url) window.open(url, '_blank', 'noopener,noreferrer');
                  }}
                  className="bg-[#e05252] hover:bg-[#c94545] text-white"
                >
                  Open in new tab
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function LoadingBlock() {
  return (
    <div className="flex items-center justify-center h-40">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#e05252]" />
    </div>
  );
}

function EmptyBlock({ icon: Icon, title, message }: { icon: any; title: string; message: string }) {
  return (
    <div
      className="rounded-2xl border p-12 text-center"
      style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
    >
      <Icon className="w-14 h-14 mx-auto mb-4" style={{ color: 'var(--ch-muted)' }} />
      <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--ch-text)' }}>{title}</h3>
      <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>{message}</p>
    </div>
  );
}
