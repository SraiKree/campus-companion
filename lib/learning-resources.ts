export const RESOURCE_TYPES = [
  'notes',
  'lecture',
  'syllabus',
  'reference',
] as const;

export type ResourceType = (typeof RESOURCE_TYPES)[number];

export const RESOURCE_TYPE_LABEL: Record<ResourceType, string> = {
  notes: 'Notes',
  lecture: 'Lectures',
  syllabus: 'Syllabus',
  reference: 'Reference',
};

export const SEMESTERS = [
  'Sem 1', 'Sem 2', 'Sem 3', 'Sem 4',
  'Sem 5', 'Sem 6', 'Sem 7', 'Sem 8',
] as const;

export type Semester = (typeof SEMESTERS)[number];

export const DEPARTMENTS = [
  'CSE', 'CSM', 'CSD', 'CSO', 'IT',
  'ECE', 'EEE', 'MECH', 'CIVIL', 'MBA',
] as const;

export type Department = (typeof DEPARTMENTS)[number];

export interface LearningResource {
  id: string;
  title: string;
  description: string | null;
  type: ResourceType;
  subject: string;
  subject_code: string | null;
  semester: string | null;
  department: string | null;
  section: string | null;
  file_url: string | null;
  file_type: string | null;
  file_size: number | null;
  external_link: string | null;
  storage_path: string | null;
  uploaded_by: string;
  uploaded_by_name: string | null;
  created_at: string;
  updated_at: string;
  is_bookmarked?: boolean;
}

export const STORAGE_BUCKET = 'learning-resources';

export function detectFileType(mimeOrName: string): string {
  const lower = mimeOrName.toLowerCase();
  if (lower.includes('pdf')) return 'pdf';
  if (lower.includes('video') || /\.(mp4|mov|webm|mkv)$/.test(lower)) return 'video';
  if (lower.includes('powerpoint') || /\.(ppt|pptx)$/.test(lower)) return 'ppt';
  if (lower.includes('word') || /\.(doc|docx)$/.test(lower)) return 'doc';
  if (lower.includes('image') || /\.(png|jpe?g|gif|webp)$/.test(lower)) return 'image';
  if (/\.(zip|rar|7z)$/.test(lower)) return 'archive';
  return 'file';
}

export function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function isEmbeddableVideo(url: string | null | undefined): string | null {
  if (!url) return null;
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{6,})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  const drive = url.match(/drive\.google\.com\/file\/d\/([\w-]+)/);
  if (drive) return `https://drive.google.com/file/d/${drive[1]}/preview`;
  return null;
}
