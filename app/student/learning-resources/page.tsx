'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BookOpen, Video, FileText, Library, Search, Download, ExternalLink,
  Bookmark, BookmarkCheck, Clock, Eye, User, Calendar, Filter, X,
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
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';

const TYPE_META: Record<ResourceType, { icon: any; color: string; soft: string; label: string }> = {
  notes:     { icon: FileText, color: '#e05252', soft: 'rgba(224,82,82,0.1)',  label: 'Notes' },
  lecture:   { icon: Video,    color: '#2563eb', soft: 'rgba(37,99,235,0.1)',  label: 'Lectures' },
  syllabus:  { icon: BookOpen, color: '#16a34a', soft: 'rgba(22,163,74,0.1)',  label: 'Syllabus' },
  reference: { icon: Library,  color: '#8b5cf6', soft: 'rgba(139,92,246,0.1)', label: 'Reference' },
};

const FILE_ICON: Record<string, string> = {
  pdf: 'PDF', video: 'MP4', ppt: 'PPT', doc: 'DOC', image: 'IMG', archive: 'ZIP', file: 'FILE',
};

type TabKey = 'all' | ResourceType | 'bookmarks' | 'recent';

export default function StudentLearningResourcesPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  const [tab, setTab] = useState<TabKey>('all');
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

  const hasAnyFilter = !!(subjectFilter || semesterFilter || facultyFilter || search);

  const tabList: { key: TabKey; label: string; icon: any; count: number; color?: string }[] = [
    { key: 'all',       label: 'All',       icon: BookOpen, count: totals.all },
    { key: 'notes',     label: 'Notes',     icon: FileText, count: totals.notes,     color: TYPE_META.notes.color },
    { key: 'lecture',   label: 'Lectures',  icon: Video,    count: totals.lecture,   color: TYPE_META.lecture.color },
    { key: 'syllabus',  label: 'Syllabus',  icon: BookOpen, count: totals.syllabus,  color: TYPE_META.syllabus.color },
    { key: 'reference', label: 'Reference', icon: Library,  count: totals.reference, color: TYPE_META.reference.color },
    { key: 'bookmarks', label: 'Bookmarks', icon: Bookmark, count: totals.bookmarks },
    { key: 'recent',    label: 'Recent',    icon: Clock,    count: totals.recent },
  ];

  return (
    <StudentLayout>
      <div className="space-y-6">
        {/* Hero Bento */}
        <div className="bg-white rounded-2xl p-8 border border-[#e5e5e5] relative overflow-hidden">
          <div className="flex items-start gap-5 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-[#e05252]/10 flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-7 h-7 text-[#e05252]" />
            </div>
            <div className="flex-1 min-w-0">
              <Badge className="bg-[#e05252]/10 text-[#e05252] border-[#e05252]/20 hover:bg-[#e05252]/10 text-[10px] font-bold tracking-wider mb-3">
                LIBRARY · {totals.all} ITEMS
              </Badge>
              <h1 className="text-4xl font-extrabold text-[#1a1a1a] tracking-tight mb-1">
                Learning Resources
              </h1>
              <p className="text-sm text-[#666]">
                Notes, lectures, syllabus and reference materials uploaded by your faculty.
              </p>
            </div>
          </div>

          {/* Stat pills */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-6 border-t border-[#e5e5e5]">
            {RESOURCE_TYPES.map((t) => {
              const M = TYPE_META[t];
              const Icon = M.icon;
              return (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className="bg-[#f2f0ed] border border-[#e5e5e5] rounded-xl p-4 flex items-center gap-3 hover:border-[#e05252] transition-colors text-left"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: M.soft, color: M.color }}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-2xl font-extrabold text-[#1a1a1a] leading-none">{totals[t]}</p>
                    <p className="text-[10px] font-bold text-[#666] uppercase tracking-wider mt-1">
                      {M.label}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="absolute -right-20 -top-20 w-48 h-48 bg-[#e05252]/5 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Search + filters */}
        <div className="bg-white rounded-2xl p-5 border border-[#e5e5e5] space-y-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666]" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, subject, or description..."
              className="pl-10 h-11 bg-[#f2f0ed] border-[#e5e5e5] text-[#1a1a1a] placeholder:text-[#666] focus-visible:ring-[#e05252]"
            />
          </div>
          <div className="flex flex-wrap gap-2.5 items-center">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#666] uppercase tracking-wider mr-1">
              <Filter className="w-3.5 h-3.5" /> Filters
            </div>
            <FilterSelect value={subjectFilter} onChange={setSubjectFilter} placeholder="All Subjects">
              {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
            </FilterSelect>
            <FilterSelect value={semesterFilter} onChange={setSemesterFilter} placeholder="All Semesters">
              {SEMESTERS.map((s) => <option key={s} value={s}>{s}</option>)}
            </FilterSelect>
            <FilterSelect value={facultyFilter} onChange={setFacultyFilter} placeholder="All Faculty">
              {faculties.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </FilterSelect>
            {hasAnyFilter && (
              <button
                onClick={() => { setSubjectFilter(''); setSemesterFilter(''); setFacultyFilter(''); setSearch(''); }}
                className="h-9 px-3 text-[11px] font-bold text-[#e05252] hover:text-[#c94545] uppercase tracking-wider flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Clear
              </button>
            )}
          </div>
        </div>

        {/* Tabs — dashboard-style pill row */}
        <div className="bg-white rounded-2xl p-2 border border-[#e5e5e5] flex flex-wrap gap-1">
          {tabList.map((t) => {
            const Icon = t.icon;
            const isActive = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 px-4 h-10 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                  isActive
                    ? 'bg-[#e05252] text-white shadow-[0_0_12px_rgba(224,82,82,0.3)]'
                    : 'text-[#666] hover:bg-[#f2f0ed] hover:text-[#1a1a1a]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{t.label}</span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                    isActive ? 'bg-white/20 text-white' : 'bg-[#f2f0ed] text-[#666]'
                  }`}
                >
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Grid */}
        {loadingData ? (
          <LoadingBlock />
        ) : filteredForTab.length === 0 ? (
          <EmptyBlock
            icon={tab === 'bookmarks' ? Bookmark : tab === 'recent' ? Clock : BookOpen}
            title={
              tab === 'bookmarks' ? 'No bookmarks yet' :
              tab === 'recent' ? 'No recent views' :
              'No resources found'
            }
            message={
              tab === 'bookmarks' ? 'Save resources for quick access later.' :
              tab === 'recent' ? 'Resources you open will appear here.' :
              'Try changing your search or filters.'
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
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
      </div>

      <PreviewDialog resource={preview} onClose={() => setPreview(null)} />
    </StudentLayout>
  );
}

function FilterSelect({
  value, onChange, placeholder, children,
}: { value: string; onChange: (v: string) => void; placeholder: string; children: React.ReactNode }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 rounded-lg border border-[#e5e5e5] bg-[#f2f0ed] text-[#1a1a1a] text-xs font-medium px-3 pr-8 hover:border-[#e05252] focus:outline-none focus:border-[#e05252] transition-colors cursor-pointer"
    >
      <option value="">{placeholder}</option>
      {children}
    </select>
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
  const isVideo = resource.type === 'lecture' || (resource.external_link && isEmbeddableVideo(resource.external_link));

  return (
    <div className="bg-white rounded-2xl border border-[#e5e5e5] overflow-hidden flex flex-col group hover:border-[#e05252] transition-colors">
      <div className="p-5 flex-1 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: M.soft, color: M.color }}
          >
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p
              className="text-[10px] font-bold uppercase tracking-wider mb-1"
              style={{ color: M.color }}
            >
              {RESOURCE_TYPE_LABEL[resource.type]}
            </p>
            <h3 className="font-bold text-[15px] leading-snug text-[#1a1a1a] line-clamp-2">
              {resource.title}
            </h3>
          </div>
          <button
            onClick={onToggleBookmark}
            className="flex-shrink-0 p-1.5 hover:bg-[#f2f0ed] rounded-lg transition-colors"
            aria-label={resource.is_bookmarked ? 'Remove bookmark' : 'Bookmark'}
          >
            {resource.is_bookmarked
              ? <BookmarkCheck className="w-5 h-5 text-[#e05252]" fill="#e05252" />
              : <Bookmark className="w-5 h-5 text-[#666]" />
            }
          </button>
        </div>

        {/* Subject line */}
        <div>
          <p className="text-sm font-semibold text-[#1a1a1a]">
            {resource.subject}
            {resource.subject_code && (
              <span className="font-normal ml-1.5 text-[#666]">
                · {resource.subject_code}
              </span>
            )}
          </p>
          {resource.description && (
            <p className="text-xs text-[#666] leading-relaxed line-clamp-2 mt-1">
              {resource.description}
            </p>
          )}
        </div>

        {/* Chip row */}
        <div className="flex flex-wrap gap-1.5">
          {resource.semester && <MetaChip>{resource.semester}</MetaChip>}
          {resource.department && <MetaChip>{resource.department}</MetaChip>}
          {badgeLabel && <MetaChip>{badgeLabel}</MetaChip>}
          {resource.file_size && <MetaChip>{formatFileSize(resource.file_size)}</MetaChip>}
        </div>

        {/* Meta */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[#666] pt-1">
          <span className="flex items-center gap-1.5">
            <User className="w-3 h-3" /> {resource.uploaded_by_name || '—'}
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3 h-3" />
            {new Date(resource.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Footer actions */}
      <div className="flex gap-2 px-4 py-3 bg-[#f2f0ed] border-t border-[#e5e5e5]">
        <Button
          onClick={onOpen}
          size="sm"
          className="flex-1 gap-1.5 h-9 bg-[#e05252] hover:bg-[#c94545] text-white text-xs font-bold uppercase tracking-wider rounded-lg"
        >
          <Eye className="w-3.5 h-3.5" />
          {isVideo ? 'Watch' : 'View'}
        </Button>
        <Button
          onClick={onDownload}
          size="sm"
          variant="outline"
          className="gap-1.5 h-9 bg-white border-[#e5e5e5] text-[#1a1a1a] hover:bg-[#e5e5e5] hover:text-[#1a1a1a] text-xs font-bold uppercase tracking-wider rounded-lg"
        >
          {resource.external_link && !resource.file_url
            ? <><ExternalLink className="w-3.5 h-3.5" /> Open</>
            : <><Download className="w-3.5 h-3.5" /> Save</>
          }
        </Button>
      </div>
    </div>
  );
}

function MetaChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] font-bold text-[#666] uppercase tracking-wider bg-[#f2f0ed] border border-[#e5e5e5] rounded-md px-2 py-0.5">
      {children}
    </span>
  );
}

function PreviewDialog({ resource, onClose }: { resource: LearningResource | null; onClose: () => void }) {
  if (!resource) return null;
  const videoEmbed = resource.external_link ? isEmbeddableVideo(resource.external_link) : null;

  return (
    <Dialog open={!!resource} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl w-[95vw] h-[85vh] flex flex-col p-0 overflow-hidden rounded-2xl">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="text-lg font-bold text-[#1a1a1a]">{resource.title}</DialogTitle>
          <DialogDescription className="flex flex-wrap items-center gap-2 text-xs text-[#666]">
            <span className="font-semibold">{resource.subject}</span>
            {resource.uploaded_by_name && <span>· by {resource.uploaded_by_name}</span>}
            {resource.semester && <span>· {resource.semester}</span>}
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0 border-t border-[#e5e5e5]">
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
            <div className="h-full flex items-center justify-center p-8 bg-[#f2f0ed]">
              <div className="text-center space-y-3">
                <p className="text-[#666]">Preview not available for this file type.</p>
                <Button
                  onClick={() => {
                    const url = resource.file_url || resource.external_link;
                    if (url) window.open(url, '_blank', 'noopener,noreferrer');
                  }}
                  className="bg-[#e05252] hover:bg-[#c94545] text-white font-bold uppercase tracking-wider"
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
    <div className="bg-white rounded-2xl border border-[#e5e5e5] p-16 flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#e05252]" />
    </div>
  );
}

function EmptyBlock({ icon: Icon, title, message }: { icon: any; title: string; message: string }) {
  return (
    <div className="bg-white rounded-2xl border border-[#e5e5e5] p-16 text-center">
      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#f2f0ed] flex items-center justify-center">
        <Icon className="w-8 h-8 text-[#666]" />
      </div>
      <h3 className="text-lg font-bold text-[#1a1a1a] mb-1">{title}</h3>
      <p className="text-sm text-[#666]">{message}</p>
    </div>
  );
}
