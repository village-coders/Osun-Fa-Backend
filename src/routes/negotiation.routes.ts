import express, { Response } from 'express';
import mongoose from 'mongoose';
import { Negotiation } from '../models/Negotiation';
import { Player } from '../models/Player';
import { requireUserAuth, AuthRequest } from '../middleware/auth.middleware';

const router = express.Router();

// @route   POST /api/negotiations
// @desc    Make a transfer offer for a player
// @access  Private (Club Role)
router.post('/', requireUserAuth, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (req.user?.role !== 'team') {
            res.status(403).json({ message: 'Only clubs can initiate negotiations' });
            return;
        }

        const { playerId, offerAmount, message } = req.body;

        const player = await Player.findById(playerId);
        if (!player) {
            res.status(404).json({ message: 'Player not found' });
            return;
        }

        if (player.transferStatus !== 'OnMarket') {
            res.status(400).json({ message: 'Player is not listed on the market' });
            return;
        }

        if (!player.clubId) {
            res.status(400).json({ message: 'Player does not have a current club. Use direct signing instead.' });
            return;
        }

        if (player.clubId.toString() === req.user._id.toString()) {
            res.status(400).json({ message: 'You cannot negotiate for your own player' });
            return;
        }

        // Check if an active negotiation already exists
        const existing = await Negotiation.findOne({
            player: playerId,
            toClub: req.user._id,
            status: 'Pending'
        });

        if (existing) {
            res.status(400).json({ message: 'You already have a pending offer for this player' });
            return;
        }

        const negotiation = new Negotiation({
            player: playerId,
            fromClub: player.clubId, // The owning club
            toClub: req.user._id,    // The offering club
            offerAmount,
            message
        });

        await negotiation.save();
        res.status(201).json(negotiation);
    } catch (error) {
        console.error('Error creating negotiation:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/negotiations/incoming
// @desc    Get offers received by the club (as the owner)
// @access  Private (Club Role)
router.get('/incoming', requireUserAuth, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (req.user?.role !== 'team') {
            res.status(403).json({ message: 'Access denied' });
            return;
        }

        const negotiations = await Negotiation.find({ fromClub: req.user._id })
            .populate('player', 'playerName playingPosition passportPhotographUrl')
            .populate('toClub', 'clubName')
            .sort({ createdAt: -1 });

        res.json(negotiations);
    } catch (error) {
        console.error('Error fetching incoming negotiations:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/negotiations/outgoing
// @desc    Get offers made by the club
// @access  Private (Club Role)
router.get('/outgoing', requireUserAuth, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (req.user?.role !== 'team') {
            res.status(403).json({ message: 'Access denied' });
            return;
        }

        const negotiations = await Negotiation.find({ toClub: req.user._id })
            .populate('player', 'playerName playingPosition passportPhotographUrl')
            .populate('fromClub', 'clubName')
            .sort({ createdAt: -1 });

        res.json(negotiations);
    } catch (error) {
        console.error('Error fetching outgoing negotiations:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   PUT /api/negotiations/:id/respond
// @desc    Accept or reject a transfer offer
// @access  Private (Owner Club)
router.put('/:id/respond', requireUserAuth, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (req.user?.role !== 'team') {
            res.status(403).json({ message: 'Access denied' });
            return;
        }

        const { status } = req.body; // 'Accepted' or 'Rejected'
        if (!['Accepted', 'Rejected'].includes(status)) {
            res.status(400).json({ message: 'Invalid response status' });
            return;
        }

        const negotiation = await Negotiation.findOne({
            _id: req.params.id,
            fromClub: req.user._id,
            status: 'Pending'
        });

        if (!negotiation) {
            res.status(404).json({ message: 'Pending negotiation not found' });
            return;
        }

        negotiation.status = status;
        await negotiation.save();

        // If accepted, we should finalize the transfer
        if (status === 'Accepted') {
            const player = await Player.findById(negotiation.player);
            if (player) {
                player.clubId = negotiation.toClub;
                // We need to fetch the toClub's name
                const toClub = await mongoose.model('Club').findById(negotiation.toClub);
                player.currentClubName = toClub?.clubName || 'Unknown Club';
                player.transferStatus = 'None';
                player.marketValue = 0;
                await player.save();

                negotiation.status = 'Completed';
                await negotiation.save();
            }
        }

        res.json(negotiation);
    } catch (error) {
        console.error('Error responding to negotiation:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

export default router;
