
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function checkCollections() {
    try {
        await mongoose.connect(process.env.MONGO_URI!);
        
        const db = mongoose.connection.db;
        if (!db) {
            throw new Error('Database connection not established');
        }

        const collections = await db.listCollections().toArray();
        console.log('Collections in Database:');
        collections.forEach(c => console.log(`- ${c.name}`));

        // Specifically check if there is a collection with 'face' in it
        const faceCollections = collections.filter(c => c.name.toLowerCase().includes('face'));
        if (faceCollections.length > 0) {
            console.log('\nPotential Face-related collections found:');
            for (const coll of faceCollections) {
                const count = await db.collection(coll.name).countDocuments();
                console.log(`- ${coll.name} (Count: ${count})`);
                const sample = await db.collection(coll.name).findOne();
                console.log('  Sample:', JSON.stringify(sample, null, 2));
            }
        } else {
            console.log('\nNo separate face-related collections found.');
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

checkCollections();
