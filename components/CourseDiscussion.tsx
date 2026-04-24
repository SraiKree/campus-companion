'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Flag, MessageSquare, Send, ShieldAlert } from 'lucide-react';

interface DiscussionMessage {
  id: string;
  subject_code: string;
  user_id: string;
  user_name: string;
  user_role: string;
  user_department?: string | null;
  user_section?: string | null;
  content: string;
  created_at: string;
  reported_by_me?: boolean;
}

interface Props {
  subjectCode: string;
  subjectName: string;
}

export default function CourseDiscussion({ subjectCode, subjectName }: Props) {
  const [messages, setMessages] = useState<DiscussionMessage[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [onboardingBlocked, setOnboardingBlocked] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  const [reportTarget, setReportTarget] = useState<DiscussionMessage | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  const endRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch(`/api/student/discussions?subject_code=${encodeURIComponent(subjectCode)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || 'Failed to load messages');
      setMessages(body.messages || []);
      setCurrentUserId(body.currentUserId || null);
    } catch (e: any) {
      toast({ title: 'Could not load discussion', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    setOnboardingBlocked(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectCode]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length]);

  const sendMessage = async () => {
    const content = draft.trim();
    if (!content) return;
    setSending(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch('/api/student/discussions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ subject_code: subjectCode, subject_name: subjectName, content }),
      });
      const body = await res.json();
      if (!res.ok) {
        if (body?.code === 'ONBOARDING_REQUIRED') {
          setOnboardingBlocked(true);
        }
        throw new Error(body?.error || 'Failed to send');
      }
      setDraft('');
      setMessages((prev) => [...prev, { ...body.message, reported_by_me: false }]);
    } catch (e: any) {
      toast({ title: 'Could not send', description: e.message, variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  const submitReport = async () => {
    if (!reportTarget) return;
    const reason = reportReason.trim();
    if (!reason) {
      toast({ title: 'Reason required', description: 'Please describe why you are reporting.', variant: 'destructive' });
      return;
    }
    setSubmittingReport(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch('/api/student/discussions/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message_id: reportTarget.id, reason }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || 'Failed to report');
      toast({ title: 'Report submitted', description: 'Admins will review this message shortly.' });
      setMessages((prev) => prev.map(m => m.id === reportTarget.id ? { ...m, reported_by_me: true } : m));
      setReportTarget(null);
      setReportReason('');
    } catch (e: any) {
      toast({ title: 'Could not report', description: e.message, variant: 'destructive' });
    } finally {
      setSubmittingReport(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {loading ? (
          <div className="text-center py-12 text-[#666] text-sm">Loading discussion…</div>
        ) : messages.length === 0 ? (
          <div className="text-center py-16">
            <MessageSquare className="w-12 h-12 text-[#666] mx-auto mb-3" />
            <p className="text-sm text-[#666]">No messages yet. Start the conversation.</p>
          </div>
        ) : (
          messages.map((m) => {
            const mine = m.user_id === currentUserId;
            return (
              <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 border ${
                  mine
                    ? 'bg-[#c44545] text-white border-[#c44545]'
                    : 'bg-[#f2f0ed] text-[#1a1a1a] border-[#e5e5e5]'
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-bold ${mine ? 'text-white' : 'text-[#1a1a1a]'}`}>
                      {mine ? 'You' : m.user_name}
                    </span>
                    {!mine && (m.user_department || m.user_section) && (
                      <span className="text-[10px] opacity-70">
                        {[m.user_department, m.user_section].filter(Boolean).join(' • ')}
                      </span>
                    )}
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{m.content}</p>
                  <div className={`flex items-center justify-between mt-1 gap-3 ${mine ? 'text-white/70' : 'text-[#666]'}`}>
                    <span className="text-[10px]">
                      {new Date(m.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {!mine && (
                      <button
                        onClick={() => { setReportTarget(m); setReportReason(''); }}
                        disabled={m.reported_by_me}
                        className="text-[10px] font-medium flex items-center gap-1 hover:underline disabled:opacity-50 disabled:no-underline"
                        title={m.reported_by_me ? 'You reported this' : 'Report this message'}
                      >
                        <Flag className="w-3 h-3" />
                        {m.reported_by_me ? 'Reported' : 'Report'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      {onboardingBlocked && (
        <div className="mt-3 mb-2 flex items-start gap-2 rounded-xl border border-[#f59e0b]/40 bg-[#f59e0b]/10 p-3 text-xs text-[#92400e]">
          <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>
            Complete your profile onboarding to participate in discussions. Head to your Profile page to finish.
          </span>
        </div>
      )}

      <div className="mt-3 border-t border-[#e5e5e5] pt-3 flex items-end gap-2">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
          rows={1}
          maxLength={2000}
          placeholder="Write a message… (text only)"
          className="flex-1 resize-none px-4 py-2.5 border border-[#e5e5e5] rounded-xl text-sm focus:outline-none focus:border-[#c44545] bg-white"
        />
        <Button
          onClick={sendMessage}
          disabled={sending || !draft.trim()}
          className="bg-[#c44545] hover:bg-[#c44545]/90 text-white rounded-xl h-10 px-4"
        >
          <Send className="w-4 h-4 mr-1" />
          Send
        </Button>
      </div>
      <p className="text-[10px] text-[#666] mt-1.5">
        Text only. Be respectful — reported messages go to admins for review.
      </p>

      <Dialog open={!!reportTarget} onOpenChange={(o) => { if (!o) { setReportTarget(null); setReportReason(''); } }}>
        <DialogContent className="border-[#e5e5e5]">
          <DialogHeader>
            <DialogTitle className="text-[#1a1a1a]">Report message</DialogTitle>
          </DialogHeader>
          {reportTarget && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-[#f2f0ed] border border-[#e5e5e5]">
                <p className="text-xs font-bold text-[#1a1a1a]">{reportTarget.user_name}</p>
                <p className="text-sm text-[#1a1a1a] mt-1 whitespace-pre-wrap break-words">{reportTarget.content}</p>
              </div>
              <div>
                <label className="text-sm font-bold text-[#1a1a1a]">Why are you reporting this?</label>
                <textarea
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  rows={3}
                  maxLength={500}
                  placeholder="e.g. harassment, spam, off-topic, inappropriate content…"
                  className="mt-2 w-full px-3 py-2 border border-[#e5e5e5] rounded-lg text-sm focus:outline-none focus:border-[#c44545]"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setReportTarget(null); setReportReason(''); }} className="hover:bg-[#f2f0ed]">
              Cancel
            </Button>
            <Button
              onClick={submitReport}
              disabled={submittingReport || !reportReason.trim()}
              className="bg-[#c44545] hover:bg-[#c44545]/90 text-white"
            >
              {submittingReport ? 'Submitting…' : 'Submit report'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
