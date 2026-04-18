import { NextResponse } from 'next/server';

// POST /api/hostel/auth/login
// Placeholder backend hook. Real authentication will be wired up once
// warden credentials are provisioned (insert a row into hostel_admins
// and replace this handler with the actual lookup + token logic).
export async function POST() {
  return NextResponse.json(
    {
      error:
        'Hostel-admin authentication is not configured yet. Credentials will be provided by the administrator.',
    },
    { status: 501 }
  );
}
