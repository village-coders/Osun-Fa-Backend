import express, { Request, Response } from 'express';
import { Match } from '../models/Match';
import { requireAuth, requireUserAuth, AuthRequest } from '../middleware/auth.middleware';

const router = express.Router();

// @route   GET /api/matches/my-matches
// @desc    Get matches associated with the logged-in portal user
// @access  Private (Team, Coach, or Referee)
router.get('/my-matches', requireUserAuth, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const user = req.user;
        let query = {};

        if (user.role === 'team') {
            const clubName = user.clubName;
            query = { $or: [{ homeTeam: clubName }, { awayTeam: clubName }] };
        } else if (user.role === 'coach') {
            const clubName = user.currentClub;
            query = { $or: [{ homeTeam: clubName }, { awayTeam: clubName }] };
        } else if (user.role === 'referee') {
            const refereeName = user.refereeFullName || user.surname;
            // Simple string matching. For robustness, standardizing referee DB references is recommended later.
            query = { referee: { $regex: new RegExp(refereeName, 'i') } };
        } else {
            res.status(403).json({ message: 'Invalid role for fetching matches' });
            return;
        }

        const matches = await Match.find(query).populate('competition', 'name season').sort({ matchDate: 1 });
        res.json(matches);
    } catch (error) {
        console.error('Error fetching user matches:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/matches
// @desc    Get all matches
// @access  Public
router.get('/', async (req: Request, res: Response) => {
    try {
        const matches = await Match.find().populate('competition', 'name season').sort({ matchDate: 1 });
        res.json(matches);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   POST /api/matches
// @desc    Create a match
// @access  Private (Admin)
router.post('/', requireAuth, async (req: Request, res: Response) => {
    try {
        const match = new Match(req.body);
        const createdMatch = await match.save();
        res.status(201).json(createdMatch);
    } catch (error) {
        res.status(400).json({ message: 'Invalid match data', error });
    }
});

// @route   PUT /api/matches/:id
// @desc    Update a match
// @access  Private (Admin)
router.put('/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
    try {
        const match = await Match.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!match) {
            res.status(404).json({ message: 'Match not found' });
            return;
        }
        res.json(match);
    } catch (error) {
        res.status(400).json({ message: 'Invalid data' });
    }
});

// @route   DELETE /api/matches/:id
// @desc    Delete a match
// @access  Private (Admin)
router.delete('/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
    try {
        const match = await Match.findByIdAndDelete(req.params.id);
        if (!match) {
            res.status(404).json({ message: 'Match not found' });
            return;
        }
        res.json({ message: 'Match removed' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

export default router;
