'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Search, Eye } from 'lucide-react';
import { facultyRecords, DEPARTMENTS } from './data';
import type { FacultyRecord } from './data';
import { DetailField } from './ui-helpers';

export default function FacultyTab() {
  const [search, setSearch] = useState('');
  const [deptFilt, setDeptFilt] = useState('All');
  const [view, setView] = useState<FacultyRecord | null>(null);

  const filtered = useMemo(() => {
    return facultyRecords.filter((f) => {
      const ms = !search || f.name.toLowerCase().includes(search.toLowerCase()) || f.facultyId.toLowerCase().includes(search.toLowerCase());
      const md = deptFilt === 'All' || f.dept === deptFilt;
      return ms && md;
    });
  }, [search, deptFilt]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--ch-muted)' }} />
          <Input placeholder="Search name or ID..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="pl-10 rounded-lg border" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)', color: 'var(--ch-text)' }} />
        </div>
        <Select value={deptFilt} onValueChange={setDeptFilt}>
          <SelectTrigger className="w-[150px] rounded-lg border" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)', color: 'var(--ch-text)' }}><SelectValue /></SelectTrigger>
          <SelectContent>{DEPARTMENTS.filter((d) => d !== 'Admin').map((d) => <SelectItem key={d} value={d}>{d === 'All' ? 'All Depts' : d}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <Card className="rounded-2xl border" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow style={{ borderColor: 'var(--ch-border)' }}>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Name</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Faculty ID</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Dept</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Subject</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Qualification</TableHead>
                <TableHead className="text-right" style={{ color: 'var(--ch-muted)' }}>View</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8" style={{ color: 'var(--ch-muted)' }}>No faculty found.</TableCell></TableRow>
              ) : filtered.map((f) => (
                <TableRow key={f.id} style={{ borderColor: 'var(--ch-border)' }}>
                  <TableCell className="font-medium" style={{ color: 'var(--ch-text)' }}>{f.name}</TableCell>
                  <TableCell><code className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--ch-muted-bg)', color: 'var(--ch-text)' }}>{f.facultyId}</code></TableCell>
                  <TableCell><Badge variant="outline">{f.dept}</Badge></TableCell>
                  <TableCell style={{ color: 'var(--ch-text)' }}>{f.subject}</TableCell>
                  <TableCell style={{ color: 'var(--ch-text)' }}>{f.qualification}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setView(f)}><Eye className="h-4 w-4" style={{ color: 'var(--ch-accent)' }} /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!view} onOpenChange={() => setView(null)}>
        <DialogContent style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
          <DialogHeader><DialogTitle style={{ color: 'var(--ch-text)' }}>Faculty Details</DialogTitle><DialogDescription style={{ color: 'var(--ch-muted)' }}>{view?.name}</DialogDescription></DialogHeader>
          {view && (
            <div className="grid grid-cols-2 gap-4 pt-2">
              <DetailField label="Name" value={view.name} />
              <DetailField label="ID" value={view.facultyId} />
              <DetailField label="Department" value={view.dept} />
              <DetailField label="Subject" value={view.subject} />
              <DetailField label="Email" value={view.email} />
              <DetailField label="Phone" value={view.phone} />
              <DetailField label="Qualification" value={view.qualification} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
