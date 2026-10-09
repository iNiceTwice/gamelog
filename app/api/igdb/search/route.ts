import { NextRequest, NextResponse } from 'next/server';
import { searchGamesInIGDB } from '@/lib/igdb/client';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';

    if (!query.trim()) {
      return NextResponse.json({ success: true, data: [] });
    }

    const results = await searchGamesInIGDB(query);
    return NextResponse.json({ success: true, data: results });
  } catch (error: any) {
    console.error('Error in IGDB search route:', error);
    return NextResponse.json(
      { success: false, error: 'Error al buscar en IGDB' },
      { status: 500 }
    );
  }
}
