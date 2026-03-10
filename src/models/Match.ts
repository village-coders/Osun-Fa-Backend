import mongoose, { Schema, Document } from 'mongoose';

export interface IMatch extends Document {
    competition: mongoose.Types.ObjectId;
    homeTeam: string; // Storing names for simplicity, could link to a Team model later
    awayTeam: string;
    homeScore?: number;
    awayScore?: number;
    matchDate: Date;
    venue: string;
    status: 'scheduled' | 'live' | 'completed' | 'postponed';
    referee?: string;
}

const matchSchema = new Schema<IMatch>(
    {
        competition: { type: Schema.Types.ObjectId, ref: 'Competition', required: true },
        homeTeam: { type: String, required: true },
        awayTeam: { type: String, required: true },
        homeScore: { type: Number, default: 0 },
        awayScore: { type: Number, default: 0 },
        matchDate: { type: Date, required: true },
        venue: { type: String, required: true },
        status: { type: String, enum: ['scheduled', 'live', 'completed', 'postponed'], default: 'scheduled' },
        referee: { type: String },
    },
    { timestamps: true }
);

export const Match = mongoose.model<IMatch>('Match', matchSchema);
