import { NextResponse } from 'next/server';

export function GET(request: Request) {
  const country = request.headers.get('x-vercel-ip-country') || 'FI';
  return NextResponse.json({
    country: country,
  });
}