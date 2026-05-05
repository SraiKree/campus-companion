'use client';

import { useEffect, useState } from 'react';
import { useRoleProtection } from '@/hooks/useRoleProtection';
import FacultyLayout from '@/components/layout/FacultyLayout';
import { supabase } from '@/lib/supabase';
import { Wallet, Download, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Payslip {
  id: string;
  pay_month: number;
  pay_year: number;
  basic_salary: number;
  hra: number;
  allowances: number;
  incentive_total: number;
  pf_deduction: number;
  tax_deduction: number;
  other_deductions: number;
  net_pay: number;
  status: string;
  generated_at: string;
  paid_at: string | null;
  remarks: string | null;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function FacultyPayrollPage() {
  const { loading, authorized } = useRoleProtection('faculty');
  const [employee, setEmployee] = useState<any>(null);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fetching, setFetching] = useState(true);
  const [selected, setSelected] = useState<Payslip | null>(null);

  useEffect(() => {
    if (!authorized) return;
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch('/api/faculty/payroll', {
          headers: { Authorization: `Bearer ${session?.access_token ?? ''}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load');
        setEmployee(data.employee);
        setPayslips(data.payslips);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setFetching(false);
      }
    })();
  }, [authorized]);

  if (loading || !authorized) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Loading...</p></div>;
  }

  const downloadPayslip = (p: Payslip) => {
    if (!employee) return;
    const lines = [
      'PAYSLIP',
      '====================================',
      `Employee: ${employee.full_name}`,
      `Code: ${employee.employee_code || '—'}`,
      `Period: ${MONTHS[p.pay_month - 1]} ${p.pay_year}`,
      `Generated: ${new Date(p.generated_at).toLocaleDateString()}`,
      '',
      'EARNINGS',
      `  Basic           ${p.basic_salary.toFixed(2)}`,
      `  HRA             ${p.hra.toFixed(2)}`,
      `  Allowances      ${p.allowances.toFixed(2)}`,
      `  Incentives      ${p.incentive_total.toFixed(2)}`,
      '',
      'DEDUCTIONS',
      `  PF              ${p.pf_deduction.toFixed(2)}`,
      `  Tax             ${p.tax_deduction.toFixed(2)}`,
      `  Other           ${p.other_deductions.toFixed(2)}`,
      '',
      `NET PAY:          ${p.net_pay.toFixed(2)}`,
      `Status:           ${p.status.toUpperCase()}`,
      p.remarks ? `Remarks: ${p.remarks}` : '',
    ].filter(Boolean);
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `payslip-${p.pay_year}-${String(p.pay_month).padStart(2, '0')}.txt`;
    a.click();
  };

  return (
    <FacultyLayout>
      <div className="max-w-5xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2" style={{ color: 'var(--ch-text)' }}>
            <Wallet className="w-7 h-7" /> Payroll
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--ch-muted)' }}>
            Your monthly payslips. HR generates these from your employment record.
          </p>
        </div>

        {error && (
          <div className="rounded-md border p-3 text-sm flex items-start gap-2" style={{ borderColor: 'rgba(220,38,38,0.3)', color: '#dc2626' }}>
            <AlertCircle className="w-4 h-4 mt-0.5" /> {error}
          </div>
        )}

        {fetching ? (
          <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>Loading...</p>
        ) : !employee ? (
          <div className="rounded-xl border p-5 text-sm" style={{ borderColor: 'var(--ch-border)', backgroundColor: 'var(--ch-card)', color: 'var(--ch-muted)' }}>
            No HR record on file yet. Contact HR to be added — payslips will appear here automatically once you're enrolled.
          </div>
        ) : payslips.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>No payslips generated yet.</p>
        ) : (
          <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: 'var(--ch-muted-bg)' }}>
                  <th className="text-left px-4 py-2 text-xs font-bold uppercase" style={{ color: 'var(--ch-muted)' }}>Period</th>
                  <th className="text-right px-4 py-2 text-xs font-bold uppercase" style={{ color: 'var(--ch-muted)' }}>Earnings</th>
                  <th className="text-right px-4 py-2 text-xs font-bold uppercase" style={{ color: 'var(--ch-muted)' }}>Deductions</th>
                  <th className="text-right px-4 py-2 text-xs font-bold uppercase" style={{ color: 'var(--ch-muted)' }}>Net</th>
                  <th className="text-left px-4 py-2 text-xs font-bold uppercase" style={{ color: 'var(--ch-muted)' }}>Status</th>
                  <th className="text-right px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {payslips.map(p => {
                  const earnings = p.basic_salary + p.hra + p.allowances + p.incentive_total;
                  const deductions = p.pf_deduction + p.tax_deduction + p.other_deductions;
                  return (
                    <tr key={p.id} className="border-t cursor-pointer hover:bg-[var(--ch-hover)]" style={{ borderColor: 'var(--ch-border)' }} onClick={() => setSelected(p)}>
                      <td className="px-4 py-2 font-medium" style={{ color: 'var(--ch-text)' }}>{MONTHS[p.pay_month - 1]} {p.pay_year}</td>
                      <td className="px-4 py-2 text-right font-mono" style={{ color: 'var(--ch-muted)' }}>{earnings.toFixed(2)}</td>
                      <td className="px-4 py-2 text-right font-mono" style={{ color: 'var(--ch-muted)' }}>{deductions.toFixed(2)}</td>
                      <td className="px-4 py-2 text-right font-mono font-bold" style={{ color: 'var(--ch-text)' }}>{p.net_pay.toFixed(2)}</td>
                      <td className="px-4 py-2 text-xs uppercase" style={{ color: 'var(--ch-muted)' }}>{p.status}</td>
                      <td className="px-4 py-2 text-right">
                        <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); downloadPayslip(p); }} className="gap-1">
                          <Download className="w-3 h-3" /> TXT
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {selected && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
            onClick={() => setSelected(null)}
          >
            <div
              className="max-w-md w-full m-4 rounded-xl border p-6 shadow-elevated"
              style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--ch-text)' }}>
                Payslip — {MONTHS[selected.pay_month - 1]} {selected.pay_year}
              </h3>
              <p className="text-xs mb-4" style={{ color: 'var(--ch-muted)' }}>
                {employee?.full_name} · {employee?.employee_code || '—'}
              </p>

              <div className="space-y-1 text-sm">
                <Row label="Basic" value={selected.basic_salary} />
                <Row label="HRA" value={selected.hra} />
                <Row label="Allowances" value={selected.allowances} />
                <Row label="Incentives" value={selected.incentive_total} />
                <hr className="my-2" style={{ borderColor: 'var(--ch-border)' }} />
                <Row label="PF" value={-selected.pf_deduction} />
                <Row label="Tax" value={-selected.tax_deduction} />
                <Row label="Other deductions" value={-selected.other_deductions} />
                <hr className="my-2" style={{ borderColor: 'var(--ch-border)' }} />
                <Row label="Net pay" value={selected.net_pay} bold />
              </div>

              <div className="flex gap-2 mt-5">
                <Button onClick={() => downloadPayslip(selected)} className="gap-1 flex-1">
                  <Download className="w-4 h-4" /> Download
                </Button>
                <Button variant="ghost" onClick={() => setSelected(null)} className="flex-1">Close</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </FacultyLayout>
  );
}

function Row({ label, value, bold }: { label: string; value: number; bold?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className={bold ? 'font-bold' : ''} style={{ color: 'var(--ch-text)' }}>{label}</span>
      <span className={`font-mono ${bold ? 'font-bold' : ''}`} style={{ color: bold ? 'var(--ch-accent)' : 'var(--ch-text)' }}>
        {value.toFixed(2)}
      </span>
    </div>
  );
}
