import express, { Request, Response } from 'express';
import { News } from '../models/News';
import { requireAuth } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';

const router = express.Router();

// @route   GET /api/news
// @desc    Get all news
// @access  Public
router.get('/', async (req: Request, res: Response) => {
    try {
        const { all } = req.query;
        let filter: any = { status: 'published' };

        // If 'all=true' is requested, we show everything (intended for admin panel)
        if (all === 'true') {
            filter = {};
        }

        const news = await News.find(filter).sort({ publishedAt: -1 });
        res.json(news);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/news/:id
// @desc    Get single news
// @access  Public
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
    try {
        let news;
        const idOrSlug = req.params.id as string;

        // Check if the id is a valid MongoDB ObjectId
        if (idOrSlug && idOrSlug.match(/^[0-9a-fA-F]{24}$/)) {
            news = await News.findById(idOrSlug);
        }
        
        // If not found by ID (or not a valid ID), try finding by slug
        if (!news) {
            news = await News.findOne({ slug: idOrSlug });
        }

        if (!news) {
            res.status(404).json({ message: 'News not found' });
            return;
        }

        // Block access to drafts unless specifically requested (admin side)
        const { all } = req.query;
        if (news.status === 'draft' && all !== 'true') {
            res.status(404).json({ message: 'News not found' });
            return;
        }

        res.json(news);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   POST /api/news
// @desc    Create a news article
// @access  Private (Admin)
router.post('/', requireAuth, upload.single('image'), async (req: Request, res: Response) => {
    try {
        const newsData = { ...req.body };
        if (req.file) {
            newsData.imageUrl = req.file.path;
        }
        const news = new News(newsData);
        const createdNews = await news.save();
        res.status(201).json(createdNews);
    } catch (error) {
        res.status(400).json({ message: 'Invalid news data' });
    }
});

// @route   PUT /api/news/:id
// @desc    Update a news article
// @access  Private (Admin)
router.put('/:id', requireAuth, upload.single('image'), async (req: Request, res: Response): Promise<void> => {
    try {
        const newsData = { ...req.body };
        if (req.file) {
            newsData.imageUrl = req.file.path;
        }
        const news = await News.findByIdAndUpdate(req.params.id, newsData, { new: true });
        if (!news) {
            res.status(404).json({ message: 'News not found' });
            return;
        }
        res.json(news);
    } catch (error) {
        res.status(400).json({ message: 'Invalid news data' });
    }
});

// @route   DELETE /api/news/:id
// @desc    Delete a news article
// @access  Private (Admin)
router.delete('/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
    try {
        const news = await News.findByIdAndDelete(req.params.id);
        if (!news) {
            res.status(404).json({ message: 'News not found' });
            return;
        }
        res.json({ message: 'News removed' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

export default router;
