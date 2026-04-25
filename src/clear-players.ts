import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { Player } from './models/Player';

dotenv.config();

const clearData = async () => {
    try {
        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri) {
            throw new Error('MONGO_URI is not defined in .env');
        }

        console.log('Connecting to MongoDB...');
        await mongoose.connect(mongoUri);
        console.log('Connected successfully.');

        const count = await Player.countDocuments();
        console.log(`Found ${count} players to remove.`);

        if (count > 0) {
            const result = await Player.deleteMany({});
            console.log(`Successfully deleted ${result.deletedCount} players.`);
        } else {
            console.log('No players found in the database.');
        }

        console.log('Clearing face data (if applicable in other models)...');
        // If there were other models with face data, we'd clear them here.
        // In this app, it's primarily in the Player model which we just deleted.

        await mongoose.disconnect();
        console.log('Disconnected from MongoDB.');
        process.exit(0);
    } catch (error) {
        console.error('Error clearing data:', error);
        process.exit(1);
    }
};

clearData();
