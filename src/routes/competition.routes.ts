import express, { Request, Response } from 'express';
import { Competition } from '../models/Competition';
import { requireAuth } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';

const router = express.Router();

// @route   GET /api/competitions
// @desc    Get all competitions
// @access  Public
router.get('/', async (req: Request, res: Response) => {
    try {
        const competitions = await Competition.find().sort({ startDate: -1 });
        res.json(competitions);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});
// @route   GET /api/competitions/:id
// @desc    Get a single competition
// @access  Public
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
    try {
        const competition = await Competition.findById(req.params.id);
        if (!competition) {
            res.status(404).json({ message: 'Competition not found' });
            return;
        }
        res.json(competition);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   POST /api/competitions
// @desc    Create a competition
// @access  Private (Admin)
router.post('/', requireAuth, upload.single('logo'), async (req: Request, res: Response) => {
    try {
        const compData = { ...req.body };
        if (req.file) {
            compData.logoUrl = req.file.path;
        }
        const competition = new Competition(compData);
        const createdCompetition = await competition.save();
        res.status(201).json(createdCompetition);
    } catch (error) {
        res.status(400).json({ message: 'Invalid competition data' });
    }
});

// @route   PUT /api/competitions/:id
// @desc    Update a competition
// @access  Private (Admin)
router.put('/:id', requireAuth, upload.single('logo'), async (req: Request, res: Response): Promise<void> => {
    try {
        const compData = { ...req.body };
        if (req.file) {
            compData.logoUrl = req.file.path;
        }
        const comp = await Competition.findByIdAndUpdate(req.params.id, compData, { new: true });
        if (!comp) {
            res.status(404).json({ message: 'Competition not found' });
            return;
        }
        res.json(comp);
    } catch (error) {
        res.status(400).json({ message: 'Invalid data' });
    }
});

// @route   POST /api/competitions/:id/enroll
// @desc    Enroll authenticated club into competition
// @access  Private (Club Portal)
router.post('/:id/enroll', requireAuth, async (req: Request, res: Response): Promise<void> => {
    try {
        const competition = await Competition.findById(req.params.id);
        if (!competition) {
            res.status(404).json({ message: 'Competition not found' });
            return;
        }

        if (competition.registrationStatus !== 'open') {
            res.status(400).json({ message: 'Registration is closed for this competition' });
            return;
        }

        // Add club id to enrolledClubs if not already present
        // Note: req.user._id comes from requireAuth middleware
        const clubId = (req as any).user._id;
        
        if (!competition.enrolledClubs.includes(clubId)) {
            competition.enrolledClubs.push(clubId);
            await competition.save();
        }

        res.json({ message: 'Successfully enrolled', competition });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   DELETE /api/competitions/:id
// @desc    Delete a competition
// @access  Private (Admin)
router.delete('/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
    try {
        const comp = await Competition.findByIdAndDelete(req.params.id);
        if (!comp) {
            res.status(404).json({ message: 'Competition not found' });
            return;
        }
        res.json({ message: 'Competition removed' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

export default router;
