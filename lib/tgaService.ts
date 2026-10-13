import { connectToDatabase } from '@/lib/mongodb';
import { TgaEdition } from '@/models/TgaEdition';
import { TGA_GOTY_DATA, TGA_AVAILABLE_YEARS } from '@/lib/data/tgaGoty';

let isSeeded = false;

export async function ensureTgaDataSeeded(): Promise<void> {
  if (isSeeded) return;
  try {
    await connectToDatabase();
    const promises = Object.entries(TGA_GOTY_DATA).map(async ([yearStr, nominees]) => {
      const year = parseInt(yearStr, 10);
      return TgaEdition.findOneAndUpdate(
        { year },
        {
          $setOnInsert: {
            year,
            nominees: nominees.map((n) => ({
              title: n.title,
              isWinner: n.isWinner,
            })),
          },
        },
        { upsert: true, returnDocument: 'after' }
      );
    });
    await Promise.all(promises);
    isSeeded = true;
  } catch (err) {
    console.error('Error ensuring TGA data is seeded in MongoDB:', err);
  }
}

export async function getTgaEditionsFromDb(): Promise<{
  years: number[];
  editions: Record<number, { title: string; isWinner: boolean }[]>;
  latestYearWithData: number;
}> {
  const currentYear = new Date().getFullYear();
  try {
    await connectToDatabase();
    await ensureTgaDataSeeded();
    const docs = await TgaEdition.find({}).sort({ year: -1 }).lean();

    if (docs.length > 0) {
      const editions: Record<number, { title: string; isWinner: boolean }[]> = {};
      const yearsSet = new Set<number>();
      yearsSet.add(currentYear);

      let latestYearWithData = 2025;
      let foundLatest = false;

      for (const doc of docs as any[]) {
        yearsSet.add(doc.year);
        editions[doc.year] = doc.nominees || [];
        if (!foundLatest && doc.nominees && doc.nominees.length > 0) {
          latestYearWithData = doc.year;
          foundLatest = true;
        }
      }

      if (!editions[currentYear]) {
        editions[currentYear] = [];
      }

      const years = Array.from(yearsSet).sort((a, b) => b - a);
      return { years, editions, latestYearWithData };
    }
  } catch (err) {
    console.error('Error getting TGA editions from MongoDB, falling back to seed:', err);
  }

  const editions: Record<number, { title: string; isWinner: boolean }[]> = {};
  const yearsSet = new Set<number>(TGA_AVAILABLE_YEARS);
  yearsSet.add(currentYear);

  for (const [y, nominees] of Object.entries(TGA_GOTY_DATA)) {
    editions[Number(y)] = nominees;
  }
  if (!editions[currentYear]) {
    editions[currentYear] = [];
  }

  const years = Array.from(yearsSet).sort((a, b) => b - a);
  const latestYearWithData = years.find((y) => editions[y] && editions[y].length > 0) || 2025;

  return {
    years,
    editions,
    latestYearWithData,
  };
}

export async function getTgaNomineesForYearFromDb(
  year: number
): Promise<{ title: string; isWinner: boolean }[]> {
  try {
    await connectToDatabase();
    await ensureTgaDataSeeded();
    const doc = (await TgaEdition.findOne({ year }).lean()) as any;
    if (doc && doc.nominees && doc.nominees.length > 0) {
      return doc.nominees;
    }
  } catch (err) {
    console.error(`Error getting TGA nominees for year ${year} from MongoDB:`, err);
  }

  return TGA_GOTY_DATA[year] || [];
}
