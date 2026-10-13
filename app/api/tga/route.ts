import { NextResponse } from 'next/server';
import { getTgaEditionsFromDb } from '@/lib/tgaService';

export async function GET() {
  try {
    const data = await getTgaEditionsFromDb();
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error fetching TGA editions:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
