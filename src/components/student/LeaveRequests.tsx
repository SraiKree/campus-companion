import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Calendar } from 'lucide-react';
import type { LeaveRequest } from '@/types/erp';

const mockLeaves: LeaveRequest[] = [
  { id: '1', fromDate: '2026-02-20', toDate: '2026-02-21', reason: 'Family function', status: 'approved', appliedOn: '2026-02-15' },
  { id: '2', fromDate: '2026-02-28', toDate: '2026-02-28', reason: 'Medical appointment', status: 'pending', appliedOn: '2026-02-25' },
  { id: '3', fromDate: '2026-01-10', toDate: '2026-01-12', reason: 'Fever and cold', status: 'rejected', appliedOn: '2026-01-08' },
];

const statusColor: Record<string, string> = {
  pending: 'bg-warning/15 text-warning-foreground border-warning/30',
  approved: 'bg-success/15 text-success border-success/30',
  rejected: 'bg-destructive/10 text-destructive border-destructive/20',
};

const LeaveRequests = () => {
  const [leaves, setLeaves] = useState(mockLeaves);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ fromDate: '', toDate: '', reason: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newLeave: LeaveRequest = {
      id: Date.now().toString(),
      ...form,
      status: 'pending',
      appliedOn: new Date().toISOString().split('T')[0],
    };
    setLeaves([newLeave, ...leaves]);
    setForm({ fromDate: '', toDate: '', reason: '' });
    setOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-heading font-semibold text-foreground">Leave Requests</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gradient-primary text-primary-foreground gap-1">
              <Plus className="h-4 w-4" /> New Request
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-heading">Apply for Leave</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>From Date</Label>
                  <Input type="date" value={form.fromDate} onChange={e => setForm(f => ({ ...f, fromDate: e.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <Label>To Date</Label>
                  <Input type="date" value={form.toDate} onChange={e => setForm(f => ({ ...f, toDate: e.target.value }))} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Reason</Label>
                <Textarea value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} placeholder="Enter reason for leave..." required />
              </div>
              <Button type="submit" className="w-full gradient-primary text-primary-foreground">Submit Request</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {leaves.map((leave) => (
          <Card key={leave.id} className="shadow-card">
            <CardContent className="py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground">{leave.reason}</p>
                  <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {leave.fromDate} → {leave.toDate}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Applied: {leave.appliedOn}</p>
                </div>
                <Badge variant="outline" className={statusColor[leave.status]}>
                  {leave.status}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default LeaveRequests;
