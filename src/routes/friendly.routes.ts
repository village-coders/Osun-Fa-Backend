import express, { Response } from 'express';
import { FriendlyMatch } from '../models/FriendlyMatch';
import { Club } from '../models/Club';
import { requireUserAuth, requireApprovedClub, AuthRequest } from '../middleware/auth.middleware';

const router = express.Router();

// @route   POST /api/friendlies
// @desc    Request a friendly match
// @access  Private (Club - Approved Only)
router.post('/', requireUserAuth, requireApprovedClub, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (req.user?.role !== 'team') {
            res.status(403).json({ message: 'Only clubs can request friendly matches' });
            return;
        }

        const { awayClubId, matchDate, matchTime, venue, message } = req.body;

        if (!awayClubId || !matchDate || !matchTime || !venue) {
            res.status(400).json({ message: 'Please provide all required fields' });
            return;
        }

        if (awayClubId === req.user._id.toString()) {
            res.status(400).json({ message: 'You cannot request a match with yourself' });
            return;
        }

        const newMatch = new FriendlyMatch({
            homeClub: req.user._id,
            awayClub: awayClubId,
            matchDate,
            matchTime,
            venue,
            message
        });

        await newMatch.save();
        res.status(201).json(newMatch);
    } catch (error) {
        console.error('Error requesting friendly:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/friendlies/incoming
// @desc    Get incoming friendly match requests
// @access  Private (Club)
router.get('/incoming', requireUserAuth, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (req.user?.role !== 'team') {
            res.status(403).json({ message: 'Access denied' });
            return;
        }

        const friendlies = await FriendlyMatch.find({ awayClub: req.user._id })
            .populate('homeClub', 'clubName clubLogoUrl townCity')
            .sort({ createdAt: -1 });

        res.json(friendlies);
    } catch (error) {
        console.error('Error fetching incoming friendlies:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/friendlies/outgoing
// @desc    Get outgoing friendly match requests
// @access  Private (Club)
router.get('/outgoing', requireUserAuth, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (req.user?.role !== 'team') {
            res.status(403).json({ message: 'Access denied' });
            return;
        }

        const friendlies = await FriendlyMatch.find({ homeClub: req.user._id })
            .populate('awayClub', 'clubName clubLogoUrl townCity')
            .sort({ createdAt: -1 });

        res.json(friendlies);
    } catch (error) {
        console.error('Error fetching outgoing friendlies:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   PUT /api/friendlies/:id/respond
// @desc    Respond (Accept/Reject) to a friendly request
// @access  Private (Invited Club)
router.put('/:id/respond', requireUserAuth, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (req.user?.role !== 'team') {
            res.status(403).json({ message: 'Access denied' });
            return;
        }

        const { status } = req.body;
        if (!['Accepted', 'Rejected'].includes(status)) {
            res.status(400).json({ message: 'Invalid status response' });
            return;
        }

        const friendly = await FriendlyMatch.findById(req.params.id);

        if (!friendly) {
            res.status(404).json({ message: 'Request not found' });
            return;
        }

        if (friendly.awayClub.toString() !== req.user._id.toString()) {
            res.status(403).json({ message: 'Unauthorized response' });
            return;
        }

        if (friendly.status !== 'Pending') {
            res.status(400).json({ message: 'This request has already been processed' });
            return;
        }

        friendly.status = status;
        await friendly.save();

        res.json(friendly);
    } catch (error) {
        console.error('Error responding to friendly:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/friendlies/clubs
// @desc    Get list of all clubs to invite (simplified for now)
// @access  Private
router.get('/clubs', requireUserAuth, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const clubs = await Club.find({ _id: { $ne: req.user?._id } }, 'clubName clubLogoUrl townCity status')
            .where('status').equals('Approved');
        res.json(clubs);
    } catch (error) {
        console.error('Error fetching clubs:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

export default router;
