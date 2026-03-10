import mongoose, { Schema, Document } from 'mongoose';

export interface IFriendlyMatch extends Document {
    homeClub: mongoose.Types.ObjectId;
    awayClub: mongoose.Types.ObjectId;
    matchDate: Date;
    matchTime: string;
    venue: string;
    message?: string;
    status: 'Pending' | 'Accepted' | 'Rejected' | 'Cancelled' | 'Completed';
    createdAt: Date;
    updatedAt: Date;
}

const friendlyMatchSchema = new Schema<IFriendlyMatch>(
    {
        homeClub: { type: Schema.Types.ObjectId, ref: 'Club', required: true },
        awayClub: { type: Schema.Types.ObjectId, ref: 'Club', required: true },
        matchDate: { type: Date, required: true },
        matchTime: { type: String, required: true },
        venue: { type: String, required: true },
        message: { type: String },
        status: {
            type: String,
            enum: ['Pending', 'Accepted', 'Rejected', 'Cancelled', 'Completed'],
            default: 'Pending'
        },
    },
    { timestamps: true }
);

export const FriendlyMatch = mongoose.model<IFriendlyMatch>('FriendlyMatch', friendlyMatchSchema);
