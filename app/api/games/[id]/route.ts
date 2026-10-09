import { NextRequest, NextResponse } from 'next/server';
import { updateGameEntry, deleteGameEntry } from '@/lib/store';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const { data, error } = await updateGameEntry(id, body);
    if (error) {
      return NextResponse.json({ success: false, error }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error updating game:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error al actualizar el registro' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = await deleteGameEntry(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Registro no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: 'Juego eliminado correctamente' });
  } catch (error: any) {
    console.error('Error deleting game:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error al eliminar el registro' },
      { status: 500 }
    );
  }
}
