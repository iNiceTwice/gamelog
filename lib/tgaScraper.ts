import { connectToDatabase } from '@/lib/mongodb';
import { TgaEdition } from '@/models/TgaEdition';

export interface ScrapedNominee {
  title: string;
  isWinner: boolean;
}

export async function scrapeTgaFromWikipedia(
  year: number
): Promise<{ found: boolean; nominees: ScrapedNominee[]; message: string }> {
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=parse&page=The_Game_Awards_${year}&prop=text&format=json`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'GamelogBot/1.0 (info@gamelog.gg; educational gaming database)',
        Accept: 'application/json',
      },
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      return {
        found: false,
        nominees: [],
        message: `No se pudo conectar con el repositorio de The Game Awards ${year}.`,
      };
    }

    const data = await res.json();
    if (data.error) {
      return {
        found: false,
        nominees: [],
        message: `Aún no existe una edición publicada para The Game Awards ${year}.`,
      };
    }

    const html: string = data.parse?.text?.['*'] || '';

    // Match table cell after Game of the Year header
    const tableRegex =
      /<th[^>]*>(?:<[^>]+>)*\s*Game of the Year(?:\s*<[^>]+>)*\s*<\/th>[\s\S]*?<tr>\s*<td[^>]*>([\s\S]*?)<\/td>/i;
    const match = html.match(tableRegex);

    if (!match) {
      return {
        found: false,
        nominees: [],
        message: `La ceremonia de The Game Awards ${year} aún no ha anunciado los nominados oficiales al GOTY.`,
      };
    }

    const cell = match[1];
    const regex = /<li[^>]*>(.*?)(?=<li|<\/td|$)/gs;
    const matches = [...cell.matchAll(regex)];
    const nominees: ScrapedNominee[] = [];

    for (const m of matches) {
      const chunk = m[1];
      const titleMatch = chunk.match(/<i>(?:<a[^>]*>)?([^<]+)(?:<\/a>)?<\/i>/);
      if (titleMatch) {
        let title = titleMatch[1].trim();
        // Clean common suffixes or disambiguation
        title = title.replace(/\s*\(video game\)/i, '').trim();

        const isWinner =
          chunk.includes('<b>') ||
          chunk.includes('&#8202;‡') ||
          chunk.includes('‡') ||
          chunk.includes('&#x2021;');

        if (!nominees.some((n) => n.title.toLowerCase() === title.toLowerCase())) {
          nominees.push({ title, isWinner });
        }
      }
    }

    if (nominees.length === 0) {
      return {
        found: false,
        nominees: [],
        message: `No se encontraron títulos válidos en la sección GOTY de ${year}.`,
      };
    }

    // Persist in MongoDB
    await connectToDatabase();
    await TgaEdition.findOneAndUpdate(
      { year },
      {
        $set: {
          year,
          nominees,
        },
      },
      { upsert: true, returnDocument: 'after' }
    );

    return {
      found: true,
      nominees,
      message: `¡Se encontraron e importaron ${nominees.length} nominados para The Game Awards ${year}!`,
    };
  } catch (err: any) {
    console.error(`Error scraping TGA ${year}:`, err);
    return {
      found: false,
      nominees: [],
      message: `Error al procesar la información de ${year}: ${err.message}`,
    };
  }
}
