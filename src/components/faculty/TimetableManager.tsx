import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIME_SLOTS = [
  '9:20 - 10:10', '10:10 - 11:00', '11:00 - 11:50',
  '12:30 - 1:20', '1:20 - 2:10', '2:10 - 3:00', '3:10 - 4:00',
];

interface TimetableSlot {
  id: string;
  day: string;
  start_time: string;
  end_time: string;
  subject: string;
  class_name: string;
}

const TimetableManager = () => {
  const { user } = useAuth();
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ day: '', timeSlot: '', subject: '', className: '' });

  const fetchSlots = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('timetable')
      .select('*')
      .eq('faculty_id', user.id)
      .order('day');
    setSlots(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchSlots(); }, [user]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const [startTime, endTime] = form.timeSlot.split(' - ');
    const { error } = await supabase.from('timetable').insert({
      faculty_id: user.id,
      day: form.day,
      start_time: startTime,
      end_time: endTime,
      subject: form.subject,
      class_name: form.className,
    });
    if (!error) {
      setForm({ day: '', timeSlot: '', subject: '', className: '' });
      setOpen(false);
      fetchSlots();
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from('timetable').delete().eq('id', id);
    setSlots(slots.filter(s => s.id !== id));
  };

  if (loading) return <div className="text-center py-8 text-muted-foreground">Loading timetable...</div>;

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

      <div className="overflow-x-auto">
        <div className="min-w-[700px]">
          {DAYS.map(day => {
            const daySlots = slots.filter(s => s.day === day).sort((a, b) => a.start_time.localeCompare(b.start_time));
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
                            <p className="text-xs text-muted-foreground">{slot.start_time} - {slot.end_time}</p>
                            <p className="text-sm font-medium text-foreground mt-0.5">{slot.subject}</p>
                            <Badge variant="secondary" className="mt-1 text-xs">{slot.class_name}</Badge>
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
          {slots.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No timetable slots yet. Click "Add Slot" to create one.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TimetableManager;
