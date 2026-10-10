import { connectToDatabase } from './mongodb';
import { getAuthenticatedUser } from './auth';
import { GameEntry, IGameEntry } from '@/models/GameEntry';
import { NOTION_INITIAL_DATA } from './initial-data';

export async function getAllGameEntries(filter?: { status?: string; year?: string }): Promise<any[]> {
  await connectToDatabase();
  const user = await getAuthenticatedUser();

  // If user has zero records on fresh database, seed their initial Notion entries
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

  return entries;
}

export async function createGameEntry(body: any): Promise<{ data?: any; error?: string }> {
  await connectToDatabase();
  const user = await getAuthenticatedUser();

  // Validate unique podium per year
  if (body.podium && body.yearPlayed) {
    const existing = await GameEntry.findOne({
      userId: user._id,
      yearPlayed: body.yearPlayed,
      podium: body.podium,
    });
    if (existing) {
      return {
        error: `Ya existe un juego con podio '${body.podium}' en el año ${body.yearPlayed} (${existing.title})`,
      };
    }
  }

  const newDoc = await GameEntry.create({
    ...body,
    userId: user._id,
  });

  return { data: newDoc };
}

export async function updateGameEntry(id: string, body: any): Promise<{ data?: any; error?: string }> {
  await connectToDatabase();
  const user = await getAuthenticatedUser();

  const entry = await GameEntry.findOne({ _id: id, userId: user._id });
  if (!entry) return { error: 'Registro no encontrado o no autorizado' };

  if (body.podium && body.yearPlayed && (body.podium !== entry.podium || body.yearPlayed !== entry.yearPlayed)) {
    const collision = await GameEntry.findOne({
      _id: { $ne: entry._id },
      userId: user._id,
      yearPlayed: body.yearPlayed,
      podium: body.podium,
    });
    if (collision) {
      return {
        error: `Ya existe un juego con podio '${body.podium}' en el año ${body.yearPlayed} (${collision.title})`,
      };
    }
  }

  Object.assign(entry, body);
  await entry.save();
  return { data: entry };
}

export async function deleteGameEntry(id: string): Promise<boolean> {
  await connectToDatabase();
  const user = await getAuthenticatedUser();

  const res = await GameEntry.findOneAndDelete({ _id: id, userId: user._id });
  return !!res;
}
