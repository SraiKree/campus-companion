'use client';

import { useEffect, useState } from 'react';
import { Building2, BedDouble, Users, Utensils, Info } from 'lucide-react';

import StudentLayout from '@/components/layout/StudentLayout';
import { useAuth } from '@/contexts/AuthContext';
import type { HostelStudentDetails, MessMenuRow } from '@/lib/hostel';
import { DAYS_OF_WEEK } from '@/lib/hostel';

export default function StudentHostelPage() {
  const { user, loading: authLoading } = useAuth();

  const [details, setDetails] = useState<HostelStudentDetails | null>(null);
  const [menu, setMenu] = useState<MessMenuRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [noAllocation, setNoAllocation] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    const load = async () => {
      setLoading(true);
      setNoAllocation(false);

      // Mess menu is public info — always fetch
      try {
        const menuRes = await fetch('/api/hostel/mess-menu');
        if (menuRes.ok) {
          const menuData = await menuRes.json();
          setMenu(menuData.menu || []);
        }
      } catch {
        /* non-fatal */
      }

      // Room details — only if the user has a roll number
      if (user?.roll_no) {
        try {
          const res = await fetch(`/api/hostel/student/${encodeURIComponent(user.roll_no)}`);
          if (res.ok) {
            const data = await res.json();
            setDetails(data.student);
          } else {
            setNoAllocation(true);
          }
        } catch {
          setNoAllocation(true);
        }
      } else {
        setNoAllocation(true);
      }

      setLoading(false);
    };

    load();
  }, [authLoading, user?.roll_no]);

  const todayName = DAYS_OF_WEEK[(new Date().getDay() + 6) % 7];

  return (
    <StudentLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#e05252]/10 flex items-center justify-center">
            <Building2 className="w-6 h-6 text-[#e05252]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--ch-text)' }}>
              My Hostel
            </h1>
            <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>
              Your room, roommates, and weekly mess menu
            </p>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#e05252]" />
          </div>
        )}

        {!loading && details && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                className="rounded-2xl border p-6"
                style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <BedDouble className="w-5 h-5 text-[#e05252]" />
                  <h3 className="font-semibold" style={{ color: 'var(--ch-text)' }}>
                    Room Number
                  </h3>
                </div>
                <p className="text-3xl font-bold" style={{ color: 'var(--ch-text)' }}>
                  {details.room_no}
                </p>
              </div>

              <div
                className="rounded-2xl border p-6"
                style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <Building2 className="w-5 h-5 text-[#e05252]" />
                  <h3 className="font-semibold" style={{ color: 'var(--ch-text)' }}>
                    Block
                  </h3>
                </div>
                <p className="text-3xl font-bold" style={{ color: 'var(--ch-text)' }}>
                  {details.block}
                </p>
              </div>
            </div>

            <div
              className="rounded-2xl border p-6"
              style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
            >
              <div className="flex items-center gap-3 mb-4">
                <Users className="w-5 h-5 text-[#e05252]" />
                <h3 className="font-semibold" style={{ color: 'var(--ch-text)' }}>
                  Roommates ({details.roommates.length})
                </h3>
              </div>
              {details.roommates.length === 0 ? (
                <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>
                  No roommates yet — you're the only one in this room.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {details.roommates.map(rm => (
                    <div
                      key={rm.roll_number}
                      className="flex items-center gap-3 rounded-xl border p-3"
                      style={{ backgroundColor: 'var(--ch-bg)', borderColor: 'var(--ch-border)' }}
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                        style={{ backgroundColor: 'var(--ch-accent)' }}
                      >
                        {rm.name.charAt(0)}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--ch-text)' }}>
                          {rm.name}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--ch-muted)' }}>
                          {rm.roll_number}
                          {rm.department ? ` • ${rm.department}` : ''}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Empty state — shown if no allocation, but page still renders normally */}
        {!loading && noAllocation && !details && (
          <div
            className="flex items-start gap-3 rounded-2xl border p-6"
            style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
          >
            <Info className="w-5 h-5 text-[#e05252] mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--ch-text)' }}>
                No hostel allocation found
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--ch-muted)' }}>
                You don't have a hostel room assigned yet. If you're a hosteller and this looks wrong,
                contact the hostel warden. The weekly mess menu is shown below.
              </p>
            </div>
          </div>
        )}

        {/* Mess menu */}
        {!loading && menu.length > 0 && (
          <div
            className="rounded-2xl border p-6"
            style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
          >
            <div className="flex items-center gap-3 mb-4">
              <Utensils className="w-5 h-5 text-[#e05252]" />
              <h3 className="font-semibold" style={{ color: 'var(--ch-text)' }}>
                Weekly Mess Menu
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ color: 'var(--ch-muted)' }}>
                    <th className="text-left font-medium py-2 pr-4">Day</th>
                    <th className="text-left font-medium py-2 pr-4">Breakfast</th>
                    <th className="text-left font-medium py-2 pr-4">Lunch</th>
                    <th className="text-left font-medium py-2 pr-4">Snacks</th>
                    <th className="text-left font-medium py-2">Dinner</th>
                  </tr>
                </thead>
                <tbody>
                  {menu.map(row => {
                    const isToday = row.day_of_week === todayName;
                    return (
                      <tr
                        key={row.day_of_week}
                        className="border-t"
                        style={{
                          borderColor: 'var(--ch-border)',
                          backgroundColor: isToday ? 'var(--ch-accent-soft)' : 'transparent',
                        }}
                      >
                        <td className="py-3 pr-4 font-semibold" style={{ color: 'var(--ch-text)' }}>
                          {row.day_of_week}
                          {isToday && (
                            <span className="ml-2 text-[10px] font-bold uppercase text-[#e05252]">
                              Today
                            </span>
                          )}
                        </td>
                        <td className="py-3 pr-4" style={{ color: 'var(--ch-muted)' }}>
                          {row.breakfast || '—'}
                        </td>
                        <td className="py-3 pr-4" style={{ color: 'var(--ch-muted)' }}>
                          {row.lunch || '—'}
                        </td>
                        <td className="py-3 pr-4" style={{ color: 'var(--ch-muted)' }}>
                          {row.snacks || '—'}
                        </td>
                        <td className="py-3" style={{ color: 'var(--ch-muted)' }}>
                          {row.dinner || '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!loading && menu.length === 0 && (
          <div
            className="rounded-2xl border p-6 text-sm"
            style={{
              backgroundColor: 'var(--ch-card)',
              borderColor: 'var(--ch-border)',
              color: 'var(--ch-muted)',
            }}
          >
            Mess menu not available yet.
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
