import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { AdminUser } from './models/AdminUser';

dotenv.config();

const seedAdmin = async () => {
    try {
        const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/osun-fa';
        await mongoose.connect(mongoURI);
        console.log('MongoDB connected successfully for seeding');

        const adminEmail = 'admin@osfa.org';

        const existingAdmin = await AdminUser.findOne({ email: adminEmail });
        if (existingAdmin) {
            console.log('Admin user already exists!');
            process.exit(0);
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash('admin123', salt);

        const admin = new AdminUser({
            email: adminEmail,
            passwordHash,
            role: 'superadmin',
        });

        await admin.save();
        console.log('Admin user created successfully! Email: admin@osfa.org, Password: admin123');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding admin user:', error);
        process.exit(1);
    }
};

seedAdmin();
