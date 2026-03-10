import mongoose, { Schema, Document } from 'mongoose';

export interface ICompetition extends Document {
    name: string;
    season: string;
    startDate: Date;
    endDate: Date;
    status: 'upcoming' | 'ongoing' | 'completed';
    description?: string;
    logoUrl?: string;
}

const competitionSchema = new Schema<ICompetition>(
    {
        name: { type: String, required: true },
        season: { type: String, required: true },
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
        status: { type: String, enum: ['upcoming', 'ongoing', 'completed'], default: 'upcoming' },
        description: { type: String },
        logoUrl: { type: String },
    },
    { timestamps: true }
);

export const Competition = mongoose.model<ICompetition>('Competition', competitionSchema);
