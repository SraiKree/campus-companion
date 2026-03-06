import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // This is a basic middleware - authentication is handled client-side
  // You can add server-side auth checks here if needed
  return NextResponse.next();
}

export const config = {
  matcher: ['/student/:path*', '/faculty/:path*'],
};
