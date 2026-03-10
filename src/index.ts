import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';

dotenv.config();

import authRoutes from './routes/auth.routes';
import newsRoutes from './routes/news.routes';
import competitionRoutes from './routes/competition.routes';
import matchRoutes from './routes/match.routes';
import clubRoutes from './routes/club.routes';
import playerRoutes from './routes/player.routes';
import coachRoutes from './routes/coach.routes';
import refereeRoutes from './routes/referee.routes';
import portalAuthRoutes from './routes/portal-auth.routes';
import negotiationRoutes from './routes/negotiation.routes';
import squadRoutes from './routes/squad.routes';
import friendlyRoutes from './routes/friendly.routes';
import adminRoutes from './routes/admin.routes';

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cloudinary config
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// MongoDB Connection
const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGO_URI!;
        await mongoose.connect(mongoURI);
        console.log('MongoDB connected successfully');
    } catch (err) {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    }
};

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/competitions', competitionRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/clubs', clubRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/coaches', coachRoutes);
app.use('/api/referees', refereeRoutes);
app.use('/api/portal-auth', portalAuthRoutes);
app.use('/api/negotiations', negotiationRoutes);
app.use('/api/squad', squadRoutes);
app.use('/api/friendlies', friendlyRoutes);
app.use('/api/admin', adminRoutes);

// Basic route
app.get('/', (req: Request, res: Response) => {
    res.send('Welcome to Osun Fa Backend v1.0.0');
});

// Error Handling Middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('SERVER ERROR:', err);
    res.status(err.status || 500).json({
        message: err.message || 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});

// Start Server
if(process.env.NODE_ENV === 'development') {
    app.listen(PORT, async () => {
        await connectDB();
        console.log(`Server running on port ${PORT}`);
    });
}else{
    connectDB();
}

module.exports = app;
