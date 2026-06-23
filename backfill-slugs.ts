import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Club } from './src/models/Club';

dotenv.config();

function generateSlug(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
}

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI as string);
        console.log('Connected to MongoDB');

        const clubs = await Club.find({ $or: [{ slug: { $exists: false } }, { slug: null }, { slug: '' }] });
        console.log(`Found ${clubs.length} clubs without a slug.`);

        for (const club of clubs) {
            const finalName = club.clubName || club.name;
            if (finalName) {
                let baseSlug = generateSlug(finalName);
                let slug = baseSlug;
                let counter = 1;
                while (await Club.findOne({ slug, _id: { $ne: club._id } })) {
                    slug = `${baseSlug}-${counter}`;
                    counter++;
                }
                club.slug = slug;
                await club.save();
                console.log(`Updated club ${finalName} with slug ${slug}`);
            }
        }

        console.log('Done!');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

run();
