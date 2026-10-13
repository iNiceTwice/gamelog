import { NextResponse } from 'next/server';
import { scrapeTgaFromWikipedia } from '@/lib/tgaScraper';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const year = parseInt(body.year, 10);

    if (!year || isNaN(year) || year < 2014 || year > 2040) {
      return NextResponse.json(
        { success: false, error: 'Año no válido para The Game Awards' },
        { status: 400 }
      );
    }

    const result = await scrapeTgaFromWikipedia(year);
    return NextResponse.json({
      success: true,
      found: result.found,
      count: result.nominees.length,
      nominees: result.nominees,
      message: result.message,
    });
  } catch (error: any) {
    console.error('Error in /api/tga/scrape:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
