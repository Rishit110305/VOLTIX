import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGO_URL;

async function dropBadIndexes() {
  try {
    await mongoose.connect(uri);
    console.log("Connected to MongoDB");
    
    const db = mongoose.connection.db;
    const collection = db.collection('users');
    
    const indexes = await collection.indexes();
    for (const idx of indexes) {
      if (idx.name !== '_id_') {
        console.log(`Dropping ${idx.name}`);
        await collection.dropIndex(idx.name);
      }
    }
    
    console.log("Dropped all non-_id indexes. Mongoose will recreate them next start.");
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await mongoose.disconnect();
  }
}

dropBadIndexes();
