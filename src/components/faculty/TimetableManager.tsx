import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Edit } from 'lucide-react';
import type { TimetableSlot } from '@/types/erp';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIME_SLOTS = [
  '9:20 - 10:10', '10:10 - 11:00', '11:00 - 11:50',
  '12:30 - 1:20', '1:20 - 2:10', '2:10 - 3:00', '3:10 - 4:00',
];

const initialSlots: TimetableSlot[] = [
  { id: '1', day: 'Monday', startTime: '9:20', endTime: '10:10', subject: 'Data Structures', className: 'CSE-A' },
  { id: '2', day: 'Monday', startTime: '10:10', endTime: '11:00', subject: 'Operating Systems', className: 'CSE-B' },
  { id: '3', day: 'Tuesday', startTime: '9:20', endTime: '10:10', subject: 'Data Structures', className: 'CSE-A' },
  { id: '4', day: 'Wednesday', startTime: '11:00', endTime: '11:50', subject: 'Database Systems', className: 'CSE-A' },
  { id: '5', day: 'Thursday', startTime: '12:30', endTime: '1:20', subject: 'Data Structures', className: 'CSE-B' },
  { id: '6', day: 'Friday', startTime: '2:10', endTime: '3:00', subject: 'Operating Systems', className: 'CSE-A' },
];

const TimetableManager = () => {
  const [slots, setSlots] = useState(initialSlots);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ day: '', timeSlot: '', subject: '', className: '' });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const [startTime, endTime] = form.timeSlot.split(' - ');
    setSlots([...slots, {
      id: Date.now().toString(),
      day: form.day,
      startTime,
      endTime,
      subject: form.subject,
      className: form.className,
    }]);
    setForm({ day: '', timeSlot: '', subject: '', className: '' });
    setOpen(false);
  };

  const handleDelete = (id: string) => {
    setSlots(slots.filter(s => s.id !== id));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-heading font-semibold text-foreground">Weekly Timetable</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gradient-primary text-primary-foreground gap-1">
              <Plus className="h-4 w-4" /> Add Slot
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-heading">Add Timetable Slot</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-2">
                <Label>Day</Label>
                <Select value={form.day} onValueChange={v => setForm(f => ({ ...f, day: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select day" /></SelectTrigger>
                  <SelectContent>
                    {DAYS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Time Slot</Label>
                <Select value={form.timeSlot} onValueChange={v => setForm(f => ({ ...f, timeSlot: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select time" /></SelectTrigger>
                  <SelectContent>
                    {TIME_SLOTS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Subject</Label>
                <Input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="e.g., Data Structures" required />
              </div>
              <div className="space-y-2">
                <Label>Class</Label>
                <Input value={form.className} onChange={e => setForm(f => ({ ...f, className: e.target.value }))} placeholder="e.g., CSE-A" required />
              </div>
              <Button type="submit" className="w-full gradient-primary text-primary-foreground">Add Slot</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Timetable Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[700px]">
          {DAYS.map(day => {
            const daySlots = slots.filter(s => s.day === day).sort((a, b) => a.startTime.localeCompare(b.startTime));
            if (daySlots.length === 0) return null;
            return (
              <div key={day} className="mb-4">
                <h3 className="text-sm font-semibold text-foreground mb-2">{day}</h3>
                <div className="flex gap-2 flex-wrap">
                  {daySlots.map(slot => (
                    <Card key={slot.id} className="shadow-card flex-1 min-w-[140px] max-w-[200px]">
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-xs text-muted-foreground">{slot.startTime} - {slot.endTime}</p>
                            <p className="text-sm font-medium text-foreground mt-0.5">{slot.subject}</p>
                            <Badge variant="secondary" className="mt-1 text-xs">{slot.className}</Badge>
                          </div>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(slot.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TimetableManager;
