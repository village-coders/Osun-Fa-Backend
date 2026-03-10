import mongoose, { Schema, Document } from 'mongoose';

export interface INegotiation extends Document {
    player: mongoose.Types.ObjectId;
    fromClub: mongoose.Types.ObjectId;
    toClub: mongoose.Types.ObjectId;
    offerAmount: number;
    message?: string;
    status: 'Pending' | 'Accepted' | 'Rejected' | 'Cancelled' | 'Completed';
    createdAt: Date;
    updatedAt: Date;
}

const negotiationSchema = new Schema<INegotiation>(
    {
        player: { type: Schema.Types.ObjectId, ref: 'Player', required: true },
        fromClub: { type: Schema.Types.ObjectId, ref: 'Club', required: true },
        toClub: { type: Schema.Types.ObjectId, ref: 'Club', required: true },
        offerAmount: { type: Number, required: true },
        message: { type: String },
        status: {
            type: String,
            enum: ['Pending', 'Accepted', 'Rejected', 'Cancelled', 'Completed'],
            default: 'Pending'
        }
    },
    { timestamps: true }
);

export const Negotiation = mongoose.model<INegotiation>('Negotiation', negotiationSchema);
