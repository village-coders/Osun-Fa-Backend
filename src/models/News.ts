import mongoose, { Schema, Document } from 'mongoose';

export interface INews extends Document {
    title: string;
    slug: string;
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
        slug: { type: String, unique: true },
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

// Generate slug from title
newsSchema.pre('save', function() {
    if (this.isModified('title') || !this.slug) {
        this.slug = this.title
            .toLowerCase()
            .replace(/[^\w ]+/g, '')
            .replace(/ +/g, '-');
    }
});

export const News = mongoose.model<INews>('News', newsSchema);
