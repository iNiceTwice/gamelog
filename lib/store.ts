import { connectToDatabase } from './mongodb';
import { getAuthenticatedUser } from './auth';
import { GameEntry, IGameEntry } from '@/models/GameEntry';
import { NOTION_INITIAL_DATA, SeedEntry } from './initial-data';

// In-memory fallback database for development or when remote cluster auth fails
let memoryEntries: (SeedEntry & { _id: string; createdAt: Date; updatedAt: Date })[] = 
  NOTION_INITIAL_DATA.map((entry, idx) => ({
    ...entry,
    _id: `mem_${idx + 1}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));

export async function getAllGameEntries(filter?: { status?: string; year?: string }): Promise<{
  entries: any[];
  isUsingFallback: boolean;
}> {
  const db = await connectToDatabase();

  if (db) {
    try {
      const user = await getAuthenticatedUser();
      const count = await GameEntry.countDocuments({ userId: user._id });
      if (count === 0) {
        const docs = NOTION_INITIAL_DATA.map((entry) => ({
          ...entry,
          userId: user._id,
        }));
        await GameEntry.insertMany(docs);
      }

      const query: Record<string, any> = { userId: user._id };
      if (filter?.status) query.status = filter.status;
      if (filter?.year && filter.year !== 'all') query.yearPlayed = parseInt(filter.year, 10);

      const entries = await GameEntry.find(query)
        .sort({ yearPlayed: -1, podium: 1, createdAt: -1 })
        .lean();

      return { entries, isUsingFallback: false };
    } catch (err) {
      console.warn('Querying MongoDB failed, using memory store:', err);
    }
  }

  // Fallback memory filtering
  let results = [...memoryEntries];
  if (filter?.status) {
    results = results.filter((r) => r.status === filter.status);
  }
  if (filter?.year && filter.year !== 'all') {
    results = results.filter((r) => r.yearPlayed === parseInt(filter.year!, 10));
  }

  // Sort by year desc, then podium (gold -> silver -> bronze -> null)
  results.sort((a, b) => {
    if ((b.yearPlayed || 0) !== (a.yearPlayed || 0)) {
      return (b.yearPlayed || 0) - (a.yearPlayed || 0);
    }
    const order: Record<string, number> = { gold: 1, silver: 2, bronze: 3 };
    const aRank = a.podium ? order[a.podium] || 99 : 99;
    const bRank = b.podium ? order[b.podium] || 99 : 99;
    return aRank - bRank;
  });

  return { entries: results, isUsingFallback: true };
}

export async function createGameEntry(body: any): Promise<{ data?: any; error?: string }> {
  const db = await connectToDatabase();

  if (db) {
    try {
      const user = await getAuthenticatedUser();

      // Check podium
      if (body.podium && body.yearPlayed) {
        const existing = await GameEntry.findOne({
          userId: user._id,
          yearPlayed: body.yearPlayed,
          podium: body.podium,
        });
        if (existing) {
          return { error: `Ya existe un juego con podio '${body.podium}' en el año ${body.yearPlayed}` };
        }
      }

      const newDoc = await GameEntry.create({
        ...body,
        userId: user._id,
      });

      return { data: newDoc };
    } catch (err: any) {
      return { error: err.message };
    }
  }

  // Memory fallback insertion
  if (body.podium && body.yearPlayed) {
    const existing = memoryEntries.find(
      (m) => m.yearPlayed === body.yearPlayed && m.podium === body.podium
    );
    if (existing) {
      return { error: `Ya existe un juego con podio '${body.podium}' en el año ${body.yearPlayed} (${existing.title})` };
    }
  }

  const newEntry = {
    ...body,
    _id: `mem_${Date.now()}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  memoryEntries.unshift(newEntry);
  return { data: newEntry };
}

export async function updateGameEntry(id: string, body: any): Promise<{ data?: any; error?: string }> {
  const db = await connectToDatabase();

  if (db) {
    try {
      const user = await getAuthenticatedUser();
      const entry = await GameEntry.findOne({ _id: id, userId: user._id });
      if (!entry) return { error: 'No encontrado' };

      Object.assign(entry, body);
      await entry.save();
      return { data: entry };
    } catch (err: any) {
      return { error: err.message };
    }
  }

  // Memory fallback update
  const index = memoryEntries.findIndex((m) => m._id === id);
  if (index === -1) return { error: 'No encontrado' };

  memoryEntries[index] = {
    ...memoryEntries[index],
    ...body,
    updatedAt: new Date(),
  };

  return { data: memoryEntries[index] };
}

export async function deleteGameEntry(id: string): Promise<boolean> {
  const db = await connectToDatabase();

  if (db) {
    try {
      const user = await getAuthenticatedUser();
      const res = await GameEntry.findOneAndDelete({ _id: id, userId: user._id });
      return !!res;
    } catch (err) {
      console.error(err);
    }
  }

  const prevLen = memoryEntries.length;
  memoryEntries = memoryEntries.filter((m) => m._id !== id);
  return memoryEntries.length < prevLen;
}
