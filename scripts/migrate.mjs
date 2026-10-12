import fs from 'fs';
import mongoose from 'mongoose';

// Parse .env.local safely
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
const sourceUri = (process.env.SOURCE_MONGO_URI || env.MONGO_URI || env.MONGO_URL || '').trim();
const targetUri = (process.env.TARGET_MONGO_URI || env.STORAGE_MONGODB_URI || '').trim();

if (!sourceUri) {
  console.error('❌ Falta URI de origen (MONGO_URI o MONGO_URL en .env.local)');
  process.exit(1);
}

if (!targetUri) {
  console.error('❌ Falta URI de destino (STORAGE_MONGODB_URI en .env.local)');
  process.exit(1);
}

async function migrate() {
  console.log('🚀 Iniciando migración de datos e índices...');
  const sourceConn = await mongoose.createConnection(sourceUri).asPromise();
  const targetConn = await mongoose.createConnection(targetUri).asPromise();

  const collections = await sourceConn.db.listCollections().toArray();
  console.log(`\nColecciones encontradas en origen: ${collections.map(c => c.name).join(', ')}`);

  for (const colInfo of collections) {
    const colName = colInfo.name;
    if (colName.startsWith('system.')) continue;

    const sourceCol = sourceConn.db.collection(colName);
    const targetCol = targetConn.db.collection(colName);

    const sourceDocs = await sourceCol.find({}).toArray();
    console.log(`\n📦 Procesando colección "${colName}": ${sourceDocs.length} documentos.`);

    if (sourceDocs.length > 0) {
      const operations = sourceDocs.map(doc => ({
        replaceOne: {
          filter: { _id: doc._id },
          replacement: doc,
          upsert: true,
        },
      }));

      const res = await targetCol.bulkWrite(operations);
      console.log(`   Documentos sincronizados: ${res.upsertedCount + res.modifiedCount + res.matchedCount}`);
    }

    // Copiar índices con todas sus propiedades (incluyendo partialFilterExpression)
    try {
      const indexes = await sourceCol.indexes();
      for (const idx of indexes) {
        if (idx.name === '_id_') continue;
        const keys = idx.key;
        const options = {};
        for (const [key, val] of Object.entries(idx)) {
          if (['v', 'key', 'ns'].includes(key)) continue;
          options[key] = val;
        }
        await targetCol.createIndex(keys, options);
      }
      console.log(`   Índices sincronizados correctamente para "${colName}".`);
    } catch (idxErr) {
      console.warn(`  ⚠️ Nota sobre índices en "${colName}": ${idxErr.message}`);
    }

    const targetCount = await targetCol.countDocuments();
    console.log(`   Total verificado en destino: ${targetCount} documentos.`);
  }

  await sourceConn.close();
  await targetConn.close();
  console.log('\n Migración y sincronización finalizada con éxito.');
}

migrate().catch(err => {
  console.error('\n❌ Error durante la migración:', err);
  process.exit(1);
});
