import { NextResponse } from 'next/server';
import { geolocation } from '@vercel/functions';

export function GET(request: Request) {
  const geo = geolocation(request);
  return NextResponse.json({
    country: geo.country || 'FI', // Defaults to Finland if not found
  });
}