'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BookOpen, Video, FileText, Library, Search, Plus, Upload, Link as LinkIcon,
  Edit3, Trash2, Eye, ExternalLink, Calendar, User, Filter, X,
} from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  RESOURCE_TYPES, RESOURCE_TYPE_LABEL, SEMESTERS, DEPARTMENTS, STORAGE_BUCKET,
  detectFileType, formatFileSize, isEmbeddableVideo,
  type LearningResource, type ResourceType,
} from '@/lib/learning-resources';

import FacultyLayout from '@/components/layout/FacultyLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';

const TYPE_META: Record<ResourceType, { icon: any; color: string; soft: string }> = {
  notes:     { icon: FileText, color: '#e05252', soft: 'rgba(224,82,82,0.1)' },
  lecture:   { icon: Video,    color: '#2563eb', soft: 'rgba(37,99,235,0.1)' },
  syllabus:  { icon: BookOpen, color: '#16a34a', soft: 'rgba(22,163,74,0.1)' },
  reference: { icon: Library,  color: '#9333ea', soft: 'rgba(147,51,234,0.1)' },
};

export default function FacultyLearningResourcesPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  const [resources, setResources] = useState<LearningResource[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [tab, setTab] = useState<'all' | ResourceType>('all');

  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('');

  const [dialog, setDialog] = useState<{ open: boolean; resource: LearningResource | null }>({
    open: false, resource: null,
  });

  useEffect(() => {
    if (!loading && (!isAuthenticated || user?.role !== 'faculty')) {
      router.push('/');
    }
  }, [loading, isAuthenticated, user, router]);

  const fetchAll = async () => {
    setLoadingData(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) return;
      const res = await fetch('/api/faculty/learning-resources', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setResources(data.resources || []);
    } catch (err) {
      console.error('Resources fetch error:', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (!loading && isAuthenticated && user?.role === 'faculty') fetchAll();
  }, [loading, isAuthenticated, user?.role]);

  const subjects = useMemo(
    () => Array.from(new Set(resources.map((r) => r.subject).filter(Boolean))).sort(),
    [resources]
  );

  const filtered = useMemo(() => {
    return resources.filter((r) => {
      if (tab !== 'all' && r.type !== tab) return false;
      if (subjectFilter && r.subject !== subjectFilter) return false;
      if (semesterFilter && r.semester !== semesterFilter) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        if (
          !r.title.toLowerCase().includes(q) &&
          !r.subject.toLowerCase().includes(q) &&
          !(r.description || '').toLowerCase().includes(q)
        ) return false;
      }
      return true;
    });
  }, [resources, tab, subjectFilter, semesterFilter, search]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this resource? This also removes the uploaded file.')) return;
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    if (!token) return;
    const res = await fetch(`/api/faculty/learning-resources?id=${id}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      alert(d.error || 'Failed to delete');
      return;
    }
    fetchAll();
  };

  if (loading) {
    return (
      <FacultyLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#e05252]" />
        </div>
      </FacultyLayout>
    );
  }
  if (!isAuthenticated || user?.role !== 'faculty') return null;

  const totals = {
    all: resources.length,
    notes: resources.filter((r) => r.type === 'notes').length,
    lecture: resources.filter((r) => r.type === 'lecture').length,
    syllabus: resources.filter((r) => r.type === 'syllabus').length,
    reference: resources.filter((r) => r.type === 'reference').length,
  };

  return (
    <FacultyLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3" style={{ color: 'var(--ch-text)' }}>
              <BookOpen className="w-8 h-8 text-[#e05252]" />
              Learning Resources
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--ch-muted)' }}>
              Upload and manage notes, lectures, syllabus, and reference materials for students
            </p>
          </div>
          <Button
            onClick={() => setDialog({ open: true, resource: null })}
            className="gap-2 bg-[#e05252] hover:bg-[#c94545] text-white"
          >
            <Plus className="w-4 h-4" /> Upload Resource
          </Button>
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
              placeholder="Search your uploads..."
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
            {(subjectFilter || semesterFilter || search) && (
              <Button
                variant="ghost" size="sm"
                onClick={() => { setSubjectFilter(''); setSemesterFilter(''); setSearch(''); }}
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
            className="h-11 p-1 rounded-xl border flex-wrap"
            style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
          >
            <TabsTrigger value="all" className="gap-2 data-[state=active]:bg-[#e05252] data-[state=active]:text-white">
              All <Badge variant="outline" className="text-[10px] h-5 min-w-5 px-1.5">{totals.all}</Badge>
            </TabsTrigger>
            {RESOURCE_TYPES.map((t) => {
              const M = TYPE_META[t];
              const Icon = M.icon;
              return (
                <TabsTrigger key={t} value={t} className="gap-2 data-[state=active]:bg-[#e05252] data-[state=active]:text-white">
                  <Icon className="w-4 h-4" /> {RESOURCE_TYPE_LABEL[t]}
                  <Badge variant="outline" className="text-[10px] h-5 min-w-5 px-1.5">{totals[t]}</Badge>
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value={tab} className="mt-6">
            {loadingData ? (
              <LoadingBlock />
            ) : filtered.length === 0 ? (
              <EmptyBlock
                icon={BookOpen}
                title="No resources yet"
                message="Upload notes, lectures, syllabus, or reference materials to share with students"
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filtered.map((r) => (
                  <FacultyCard
                    key={r.id}
                    resource={r}
                    onEdit={() => setDialog({ open: true, resource: r })}
                    onDelete={() => handleDelete(r.id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <ResourceFormDialog
        open={dialog.open}
        resource={dialog.resource}
        onClose={() => setDialog({ open: false, resource: null })}
        onSaved={() => { setDialog({ open: false, resource: null }); fetchAll(); }}
      />
    </FacultyLayout>
  );
}

function FacultyCard({
  resource, onEdit, onDelete,
}: {
  resource: LearningResource;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const M = TYPE_META[resource.type];
  const Icon = M.icon;
  const openUrl = resource.file_url || resource.external_link;

  return (
    <div
      className="rounded-2xl border overflow-hidden flex flex-col"
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
        </div>

        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--ch-text)' }}>
            {resource.subject}
            {resource.subject_code && (
              <span className="font-normal ml-1.5" style={{ color: 'var(--ch-muted)' }}>
                · {resource.subject_code}
              </span>
            )}
          </p>
          {resource.description && (
            <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--ch-muted)' }}>
              {resource.description}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {resource.semester && <Badge variant="outline" className="text-[10px]">{resource.semester}</Badge>}
          {resource.department && <Badge variant="outline" className="text-[10px]">{resource.department}</Badge>}
          {resource.file_type && <Badge variant="outline" className="text-[10px]">{resource.file_type.toUpperCase()}</Badge>}
          {resource.file_size && <Badge variant="outline" className="text-[10px]">{formatFileSize(resource.file_size)}</Badge>}
          {resource.external_link && !resource.file_url && (
            <Badge variant="outline" className="text-[10px] gap-1"><LinkIcon className="w-2.5 h-2.5" /> Link</Badge>
          )}
        </div>

        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs" style={{ color: 'var(--ch-muted)' }}>
          <span className="flex items-center gap-1"><User className="w-3 h-3" /> {resource.uploaded_by_name || 'You'}</span>
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
        {openUrl && (
          <Button
            onClick={() => window.open(openUrl, '_blank', 'noopener,noreferrer')}
            size="sm" variant="outline" className="flex-1 gap-1.5"
          >
            {resource.external_link && !resource.file_url
              ? <><ExternalLink className="w-3.5 h-3.5" /> Open</>
              : <><Eye className="w-3.5 h-3.5" /> Preview</>
            }
          </Button>
        )}
        <Button onClick={onEdit} size="sm" variant="outline" className="gap-1.5">
          <Edit3 className="w-3.5 h-3.5" /> Edit
        </Button>
        <Button
          onClick={onDelete} size="sm" variant="outline"
          className="border-red-200 text-red-600 hover:bg-red-50"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

function ResourceFormDialog({
  open, resource, onClose, onSaved,
}: {
  open: boolean;
  resource: LearningResource | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<ResourceType>('notes');
  const [subject, setSubject] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [semester, setSemester] = useState('');
  const [department, setDepartment] = useState('');
  const [section, setSection] = useState('');
  const [externalLink, setExternalLink] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [existingFileUrl, setExistingFileUrl] = useState<string | null>(null);
  const [existingStoragePath, setExistingStoragePath] = useState<string | null>(null);
  const [existingFileType, setExistingFileType] = useState<string | null>(null);
  const [existingFileSize, setExistingFileSize] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    if (!open) return;
    if (resource) {
      setTitle(resource.title);
      setDescription(resource.description || '');
      setType(resource.type);
      setSubject(resource.subject);
      setSubjectCode(resource.subject_code || '');
      setSemester(resource.semester || '');
      setDepartment(resource.department || '');
      setSection(resource.section || '');
      setExternalLink(resource.external_link || '');
      setExistingFileUrl(resource.file_url);
      setExistingStoragePath(resource.storage_path);
      setExistingFileType(resource.file_type);
      setExistingFileSize(resource.file_size);
      setFile(null);
    } else {
      setTitle(''); setDescription(''); setType('notes');
      setSubject(''); setSubjectCode(''); setSemester('');
      setDepartment(''); setSection(''); setExternalLink('');
      setFile(null);
      setExistingFileUrl(null); setExistingStoragePath(null);
      setExistingFileType(null); setExistingFileSize(null);
    }
    setUploadProgress(0);
  }, [open, resource]);

  const handleSave = async () => {
    if (!title.trim()) { alert('Title is required'); return; }
    if (!subject.trim()) { alert('Subject is required'); return; }
    if (!file && !externalLink.trim() && !existingFileUrl) {
      alert('Please upload a file or provide an external link');
      return;
    }

    setSaving(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) return;

      let file_url = existingFileUrl;
      let storage_path = existingStoragePath;
      let file_type = existingFileType;
      let file_size = existingFileSize;

      if (file) {
        // Replace: clean up old file first
        if (existingStoragePath) {
          await supabase.storage.from(STORAGE_BUCKET).remove([existingStoragePath]);
        }

        const ext = file.name.includes('.') ? file.name.split('.').pop() : '';
        const safeTitle = title.trim().replace(/[^\w.-]+/g, '_').slice(0, 60);
        const path = `${type}/${Date.now()}-${safeTitle}${ext ? '.' + ext : ''}`;

        setUploadProgress(10);
        const { error: upErr } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(path, file, { contentType: file.type, upsert: false });
        if (upErr) throw new Error(upErr.message);
        setUploadProgress(80);

        const { data: pub } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
        file_url = pub.publicUrl;
        storage_path = path;
        file_type = detectFileType(file.type || file.name);
        file_size = file.size;
        setUploadProgress(100);
      }

      const body = {
        ...(resource ? { id: resource.id } : {}),
        title: title.trim(),
        description: description.trim() || null,
        type,
        subject: subject.trim(),
        subject_code: subjectCode.trim() || null,
        semester: semester || null,
        department: department || null,
        section: section.trim() || null,
        file_url,
        file_type,
        file_size,
        external_link: externalLink.trim() || null,
        storage_path,
      };

      const res = await fetch('/api/faculty/learning-resources', {
        method: resource ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to save');

      onSaved();
    } catch (err: any) {
      alert(err.message || 'Failed to save');
    } finally {
      setSaving(false);
      setUploadProgress(0);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{resource ? 'Edit Resource' : 'Upload Resource'}</DialogTitle>
          <DialogDescription>
            Add metadata and upload a file, or provide an external link (YouTube, Drive, etc.)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Field label="Title" required>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Unit 1 Introduction Notes"
            />
          </Field>

          <Field label="Description">
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Short summary shown on the card (optional)"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Type" required>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as ResourceType)}
                className="w-full h-10 rounded-md border px-3 text-sm"
                style={{ backgroundColor: 'var(--ch-bg)', borderColor: 'var(--ch-border)', color: 'var(--ch-text)' }}
              >
                {RESOURCE_TYPES.map((t) => (
                  <option key={t} value={t}>{RESOURCE_TYPE_LABEL[t]}</option>
                ))}
              </select>
            </Field>
            <Field label="Semester">
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full h-10 rounded-md border px-3 text-sm"
                style={{ backgroundColor: 'var(--ch-bg)', borderColor: 'var(--ch-border)', color: 'var(--ch-text)' }}
              >
                <option value="">—</option>
                {SEMESTERS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Subject" required>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Operating Systems"
              />
            </Field>
            <Field label="Subject Code">
              <Input
                value={subjectCode}
                onChange={(e) => setSubjectCode(e.target.value)}
                placeholder="e.g. CS301"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Department">
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full h-10 rounded-md border px-3 text-sm"
                style={{ backgroundColor: 'var(--ch-bg)', borderColor: 'var(--ch-border)', color: 'var(--ch-text)' }}
              >
                <option value="">—</option>
                {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </Field>
            <Field label="Section">
              <Input
                value={section}
                onChange={(e) => setSection(e.target.value)}
                placeholder="e.g. A"
              />
            </Field>
          </div>

          {/* File upload area */}
          <div>
            <p className="text-sm font-medium mb-1.5" style={{ color: 'var(--ch-text)' }}>
              File Upload
            </p>
            {file ? (
              <div
                className="flex items-center justify-between p-3 rounded-lg border"
                style={{ backgroundColor: 'var(--ch-bg)', borderColor: 'var(--ch-border)' }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--ch-accent)' }} />
                  <div className="min-w-0">
                    <p className="text-sm truncate" style={{ color: 'var(--ch-text)' }}>{file.name}</p>
                    <p className="text-xs" style={{ color: 'var(--ch-muted)' }}>{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <button onClick={() => setFile(null)} className="text-[#e05252] flex-shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : existingFileUrl ? (
              <div
                className="flex items-center justify-between p-3 rounded-lg border"
                style={{ backgroundColor: 'var(--ch-bg)', borderColor: 'var(--ch-border)' }}
              >
                <div className="text-sm" style={{ color: 'var(--ch-text)' }}>
                  Current file attached
                  {existingFileType && <span className="ml-1.5 text-xs" style={{ color: 'var(--ch-muted)' }}>({existingFileType.toUpperCase()}, {formatFileSize(existingFileSize)})</span>}
                </div>
                <label
                  className="text-xs font-medium cursor-pointer"
                  style={{ color: 'var(--ch-accent)' }}
                >
                  Replace
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.mp4,.mov,.webm,.png,.jpg,.jpeg,.gif,.zip"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                </label>
              </div>
            ) : (
              <label
                className="block rounded-lg border-2 border-dashed p-6 cursor-pointer text-center transition-colors hover:border-[#e05252]"
                style={{ borderColor: 'var(--ch-border)' }}
              >
                <Upload className="w-6 h-6 mx-auto mb-2" style={{ color: 'var(--ch-muted)' }} />
                <p className="text-sm font-medium" style={{ color: 'var(--ch-text)' }}>
                  Click to upload a file
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--ch-muted)' }}>
                  PDF, DOC, PPT, video, image, zip
                </p>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.mp4,.mov,.webm,.png,.jpg,.jpeg,.gif,.zip"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </label>
            )}
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" style={{ borderColor: 'var(--ch-border)' }} />
            </div>
            <div className="relative flex justify-center">
              <span className="px-2 text-xs" style={{ backgroundColor: 'var(--ch-card)', color: 'var(--ch-muted)' }}>
                OR
              </span>
            </div>
          </div>

          <Field label="External Link">
            <Input
              value={externalLink}
              onChange={(e) => setExternalLink(e.target.value)}
              placeholder="YouTube, Google Drive, or any URL"
            />
            {externalLink && isEmbeddableVideo(externalLink) && (
              <p className="text-xs mt-1 text-green-600">
                ✓ This link can be embedded as a preview
              </p>
            )}
          </Field>

          {saving && uploadProgress > 0 && uploadProgress < 100 && (
            <div className="space-y-1">
              <p className="text-xs" style={{ color: 'var(--ch-muted)' }}>Uploading file... {uploadProgress}%</p>
              <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--ch-border)' }}>
                <div className="h-full bg-[#e05252] transition-all" style={{ width: `${uploadProgress}%` }} />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#e05252] hover:bg-[#c94545] text-white gap-1"
          >
            {saving ? 'Saving...' : resource ? 'Save Changes' : 'Upload Resource'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-sm font-medium block mb-1.5" style={{ color: 'var(--ch-text)' }}>
        {label} {required && <span className="text-[#e05252]">*</span>}
      </label>
      {children}
    </div>
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
