import mongoose, { Schema, Document } from 'mongoose';

export interface ISquad extends Document {
    clubId: mongoose.Types.ObjectId;
    formation: string;
    startingEleven: {
        player: mongoose.Types.ObjectId;
        position: string;
        x?: number; // For visual positioning on the pitch
        y?: number;
    }[];
    substitutes: mongoose.Types.ObjectId[];
    reserves: mongoose.Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
}

const squadSchema = new Schema<ISquad>(
    {
        clubId: { type: Schema.Types.ObjectId, ref: 'Club', required: true, unique: true },
        formation: { type: String, default: '4-4-2' },
        startingEleven: [
            {
                player: { type: Schema.Types.ObjectId, ref: 'Player' },
                position: { type: String },
                x: { type: Number },
                y: { type: Number }
            }
        ],
        substitutes: [{ type: Schema.Types.ObjectId, ref: 'Player' }],
        reserves: [{ type: Schema.Types.ObjectId, ref: 'Player' }]
    },
    { timestamps: true }
);

export const Squad = mongoose.model<ISquad>('Squad', squadSchema);
