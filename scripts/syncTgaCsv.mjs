import fs from 'fs';
import mongoose from 'mongoose';

function loadEnv() {
  const env = {};
  if (fs.existsSync('.env.local')) {
    const lines = fs.readFileSync('.env.local', 'utf8').split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        let val = trimmed.slice(idx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        env[key] = val;
      }
    }
  }
  return env;
}

const env = loadEnv();
const targetUri = (process.env.STORAGE_MONGODB_URI || env.STORAGE_MONGODB_URI || env.MONGODB_URI || env.MONGO_URI || '').trim();

if (!targetUri) {
  console.error('❌ Falta STORAGE_MONGODB_URI en .env.local');
  process.exit(1);
}

const csvPath = 'C:/Users/NiceTwice/Desktop/nominados_goty_the_game_awards_2014_2025.csv';
if (!fs.existsSync(csvPath)) {
  console.error('❌ No se encontró el archivo CSV en:', csvPath);
  process.exit(1);
}

const csvLines = fs.readFileSync(csvPath, 'utf8').split(/\r?\n/).filter(Boolean);
const header = csvLines.shift(); // remove header: año,nombre,ganador_goty

const editionsMap = {};

for (const line of csvLines) {
  const parts = line.split(',');
  if (parts.length < 3) continue;
  const year = parseInt(parts[0].trim(), 10);
  const title = parts[1].trim();
  const isWinner = parts[2].trim().toLowerCase() === 'sí' || parts[2].trim().toLowerCase() === 'si';

  if (!editionsMap[year]) {
    editionsMap[year] = [];
  }
  editionsMap[year].push({ title, isWinner });
}

const TgaEditionSchema = new mongoose.Schema(
  {
    year: { type: Number, required: true, unique: true, index: true },
    nominees: [
      {
        title: { type: String, required: true, trim: true },
        isWinner: { type: Boolean, default: false },
      },
    ],
  },
  { timestamps: true }
);

const TgaEdition = mongoose.model('TgaEdition', TgaEditionSchema);

async function runSync() {
  console.log('🔄 Conectando a MongoDB para sincronizar TGA desde el CSV...');
  const conn = await mongoose.connect(targetUri);
  console.log('✅ Conectado a MongoDB con éxito.');

  for (const [yearStr, nominees] of Object.entries(editionsMap)) {
    const year = parseInt(yearStr, 10);
    const winner = nominees.find(n => n.isWinner);
    await TgaEdition.findOneAndUpdate(
      { year },
      {
        $set: {
          year,
          nominees,
        },
      },
      { upsert: true, new: true }
    );
    console.log(`✨ Año ${year}: ${nominees.length} nominados sincronizados. Ganador: ${winner ? winner.title : 'Ninguno'}`);
  }

  const total = await TgaEdition.countDocuments();
  console.log(`\n🎉 Sincronización completada con éxito. Total de ediciones en MongoDB: ${total}`);
  await mongoose.disconnect();
}

runSync().catch((err) => {
  console.error('❌ Error durante la sincronización:', err);
  process.exit(1);
});
