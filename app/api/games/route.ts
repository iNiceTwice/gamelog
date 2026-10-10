import { NextRequest, NextResponse } from 'next/server';
import { getAllGameEntries, createGameEntry } from '@/lib/store';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || undefined;
    const year = searchParams.get('year') || undefined;

    const entries = await getAllGameEntries({ status, year });
    return NextResponse.json({ success: true, data: entries });
  } catch (error: any) {
    console.error('Error fetching games:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.title || !body.title.trim()) {
      return NextResponse.json(
        { success: false, error: 'El nombre del videojuego es obligatorio' },
        { status: 400 }
      );
    }

    const { data, error } = await createGameEntry(body);

    if (error) {
      return NextResponse.json({ success: false, error }, { status: 400 });
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating game:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error al guardar el videojuego' },
      { status: 500 }
    );
  }
}
