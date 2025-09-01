import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { detail: 'File upload has been disabled. Please place files directly in /app/storage/uploads/ directory.' },
    { status: 403 }
  );
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}