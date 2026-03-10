import express, { Response } from 'express';
import { Squad } from '../models/Squad';
import { requireUserAuth, requireApprovedClub, AuthRequest } from '../middleware/auth.middleware';

const router = express.Router();

// @route   GET /api/squad
// @desc    Get the current squad lineup for the club
// @access  Private (Club Role)
router.get('/', requireUserAuth, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (req.user?.role !== 'team') {
            res.status(403).json({ message: 'Access denied' });
            return;
        }

        let squad = await Squad.findOne({ clubId: req.user._id })
            .populate('startingEleven.player', 'playerName playingPosition passportPhotographUrl jerseyNumber')
            .populate('substitutes', 'playerName playingPosition passportPhotographUrl jerseyNumber')
            .populate('reserves', 'playerName playingPosition passportPhotographUrl jerseyNumber');

        if (!squad) {
            // Create a default empty squad if none exists
            squad = new Squad({
                clubId: req.user._id,
                formation: '4-4-2',
                startingEleven: [],
                substitutes: [],
                reserves: []
            });
            // We don't necessarily need to save it yet, but return an empty structure
        }

        res.json(squad);
    } catch (error) {
        console.error('Error fetching squad:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   POST /api/squad
// @desc    Save or update the squad lineup
// @access  Private (Club - Approved Only)
router.post('/', requireUserAuth, requireApprovedClub, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (req.user?.role !== 'team') {
            res.status(403).json({ message: 'Access denied' });
            return;
        }

        const { formation, startingEleven, substitutes, reserves } = req.body;

        const updatedSquad = await Squad.findOneAndUpdate(
            { clubId: req.user._id },
            {
                formation,
                startingEleven,
                substitutes,
                reserves
            },
            { upsert: true, new: true }
        );

        res.json(updatedSquad);
    } catch (error) {
        console.error('Error saving squad:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

export default router;
