import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthenticatedUser } from '@/lib/auth';
import { DismissedGame } from '@/models/DismissedGame';

export async function GET() {
  try {
    await connectToDatabase();
    const user = await getAuthenticatedUser();
    const items = await DismissedGame.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: items,
    });
  } catch (error: any) {
    console.error('Error getting dismissed games:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const user = await getAuthenticatedUser();
    const body = await req.json();

    if (!body.title) {
      return NextResponse.json({ success: false, error: 'Título requerido' }, { status: 400 });
    }

    const doc = await DismissedGame.findOneAndUpdate(
      { userId: user._id, title: body.title.trim() },
      {
        userId: user._id,
        title: body.title.trim(),
        igdbId: body.igdbId || undefined,
        coverUrl: body.coverUrl || '',
        source: 'recommendations',
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, data: doc });
  } catch (error: any) {
    console.error('Error saving dismissed game:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await connectToDatabase();
    const user = await getAuthenticatedUser();
    const { searchParams } = new URL(req.url);
    const clearAll = searchParams.get('all') === 'true';
    const igdbId = searchParams.get('igdbId');
    const title = searchParams.get('title');

    if (clearAll) {
      await DismissedGame.deleteMany({ userId: user._id });
      return NextResponse.json({ success: true, message: 'Todos los juegos restablecidos' });
    }

    if (igdbId) {
      await DismissedGame.deleteMany({ userId: user._id, igdbId: parseInt(igdbId, 10) });
    } else if (title) {
      await DismissedGame.deleteMany({ userId: user._id, title: title.trim() });
    }

    return NextResponse.json({ success: true, message: 'Juego restablecido' });
  } catch (error: any) {
    console.error('Error deleting dismissed game:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
