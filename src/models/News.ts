import mongoose, { Schema, Document } from 'mongoose';

export interface INews extends Document {
    title: string;
    content: string;
    excerpt: string;
    imageUrl?: string;
    author: string;
    category: string;
    status: 'draft' | 'published';
    publishedAt: Date;
}

const newsSchema = new Schema<INews>(
    {
        title: { type: String, required: true },
        content: { type: String, required: true },
        excerpt: { type: String, required: true },
        category: { type: String, default: 'News' },
        imageUrl: { type: String },
        author: { type: String, default: 'Admin' },
        status: { type: String, enum: ['draft', 'published'], default: 'published' },
        publishedAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

export const News = mongoose.model<INews>('News', newsSchema);
