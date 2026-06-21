import express, { Request, Response } from 'express';
import { Player } from '../models/Player';
import { upload } from '../middleware/upload.middleware';
import { requireAuth, requireUserAuth, requireApprovedClub, AuthRequest } from '../middleware/auth.middleware';
import { deleteFromCloudinary } from '../utils/cloudinary';

const router = express.Router();

// @route   POST /api/players/register
// @desc    Register a new player
// @access  Public
router.post('/register', upload.any(), async (req: Request, res: Response): Promise<void> => {
    try {
        const playerData = { ...req.body };
        const files = req.files as Express.Multer.File[];

        if (files && files.length > 0) {
            files.forEach((file) => {
                playerData[`${file.fieldname}Url`] = file.path;
            });
        }

        const player = new Player(playerData);
        const savedPlayer = await player.save();



        res.status(201).json(savedPlayer);
    } catch (error) {
        console.error('Error registering player:', error);
        res.status(400).json({ message: 'Error registering player' });
    }
});

// @route   POST /api/players/portal-register
// @desc    Register a new player from the team portal
// @access  Private (Team Role - Approved Only)
router.post('/portal-register', requireUserAuth, requireApprovedClub, upload.any(), async (req: AuthRequest, res: Response): Promise<void> => {
    const { jerseyNumber } = req.body;
    try {
        if (req.user?.role !== 'team') {
            res.status(403).json({ message: 'Only clubs can register players via the portal' });
            return;
        }

        const playerData = { ...req.body };
        const files = req.files as Express.Multer.File[];

        if (files && files.length > 0) {
            files.forEach((file) => {
                playerData[`${file.fieldname}Url`] = file.path;
            });
        }

        if (jerseyNumber) {
            const existingPlayer = await Player.findOne({ jerseyNumber, clubId: req.user._id, status: { $in: ['Pending', 'Approved', 'Verified'] } });
            if (existingPlayer) {
                res.status(400).json({ message: 'Player with this jersey number already exists' });
                return;
            }
        }

        const player = new Player({
            ...playerData,
            clubId: req.user._id,
            currentClubName: req.user.clubName // Sync the name from the club profile
        });

        const savedPlayer = await player.save();



        res.status(201).json(savedPlayer);
    } catch (error) {
        console.error('Portal player registration error:', error);
        res.status(400).json({ message: 'Error registering player' });
    }
});

// @route   GET /api/players/my-players
// @desc    Get all players registered by the logged-in club
// @access  Private (Team Role)
router.get('/my-players', requireUserAuth, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (req.user?.role !== 'team') {
            res.status(403).json({ message: 'Only clubs can view their registered players' });
            return;
        }

        const players = await Player.find({ clubId: req.user._id }).sort({ createdAt: -1 });
        res.json(players);
    } catch (error) {
        console.error('Error fetching club players:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/players
// @desc    Get all registered players
// @access  Private (Admin)
router.get('/', requireAuth, async (req: Request, res: Response) => {
    try {
        const players = await Player.find().sort({ createdAt: -1 });
        res.json(players);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   PUT /api/players/:id/status
// @desc    Update player registration status
// @access  Private (Admin)
router.put('/:id/status', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { status, remarks } = req.body;
        const player = await Player.findByIdAndUpdate(
            req.params.id,
            {
                status,
                remarks,
                reviewedBy: req.user?.clubName || 'Admin'
            },
            { new: true }
        );

        if (!player) {
            res.status(404).json({ message: 'Player not found' });
            return;
        }

        res.json(player);
    } catch (error) {
        res.status(400).json({ message: 'Invalid data' });
    }
});

router.put('/:id/update-profile', requireUserAuth, requireApprovedClub, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const updatedPlayerData = req.body;
        delete updatedPlayerData.status;

        if (updatedPlayerData.jerseyNumber) {
            const existingPlayer = await Player.findOne({ jerseyNumber: updatedPlayerData.jerseyNumber, clubId: req.user._id, _id: { $ne: req.params.id } });
            if (existingPlayer) {
                res.status(400).json({ message: 'Player with this jersey number already exists' });
                return;
            }
        }
        const player = await Player.findByIdAndUpdate(req.params.id, { ...updatedPlayerData }, { new: true });

        if (!player) {
            res.status(404).json({ message: 'Player not found' });
            return;
        }

        res.json(player);
    } catch (error) {
        res.status(400).json({ message: 'Invalid data' });
    }
});

// @route   DELETE /api/players/:id
// @desc    Delete a player registration
// @access  Private (Admin)
router.delete('/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
    try {
        const player = await Player.findByIdAndDelete(req.params.id);
        if (!player) {
            res.status(404).json({ message: 'Player not found' });
            return;
        }

        // Delete associated files from Cloudinary if they exist
        const fileFields = [
            'passportPhotographUrl',
            'birthCertificateUrl',
            'ninDocumentUrl',
            'schoolIdUrl',
            'consentFormUploadUrl',
            'medicalClearanceUploadUrl'
        ];

        for (const field of fileFields) {
            const url = (player as any)[field];
            if (url) {
                // We don't necessarily need to await each one if we want it to be faster, 
                // but for reliability we can await or use Promise.all
                deleteFromCloudinary(url).catch(err =>
                    console.error(`[Cleanup] Failed to delete ${field}:`, err)
                );
            }
        }

        res.json({ message: 'Player removed' });
    } catch (error) {
        console.error('Error deleting player:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/players/market
// @desc    Get all players available on the market (OnMarket or Released)
// @access  Private (Club Role)
router.get('/market', requireUserAuth, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (req.user?.role !== 'team') {
            res.status(403).json({ message: 'Only clubs can browse the player market' });
            return;
        }

        const players = await Player.find({
            status: { $in: ['Approved', 'Verified'] },
            transferStatus: { $in: ['OnMarket', 'Released'] },
            clubId: { $ne: req.user._id } // Don't show club's own players in market
        }).sort({ updatedAt: -1 });

        res.json(players);
    } catch (error) {
        console.error('Error fetching market players:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   PUT /api/players/:id/release
// @desc    Release a player (make them a Free Agent)
// @access  Private (Team Role - Approved Only)
router.put('/:id/release', requireUserAuth, requireApprovedClub, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (req.user?.role !== 'team') {
            res.status(403).json({ message: 'Only clubs can release players' });
            return;
        }

        const player = await Player.findOne({ _id: req.params.id, clubId: req.user._id });

        if (!player) {
            res.status(404).json({ message: 'Player not found in your roster' });
            return;
        }

        player.transferStatus = 'Released';
        player.clubId = undefined; // No longer owned by any club
        player.currentClubName = 'Free Agent';
        await player.save();

        res.json({ message: 'Player released successfully', player });
    } catch (error) {
        console.error('Error releasing player:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   PUT /api/players/:id/list-on-market
// @desc    List a player on the transfer market
// @access  Private (Team Role - Approved Only)
router.put('/:id/list-on-market', requireUserAuth, requireApprovedClub, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (req.user?.role !== 'team') {
            res.status(403).json({ message: 'Only clubs can list players on the market' });
            return;
        }

        const { marketValue } = req.body;
        const player = await Player.findOne({ _id: req.params.id, clubId: req.user._id });

        if (!player) {
            res.status(404).json({ message: 'Player not found in your roster' });
            return;
        }

        player.transferStatus = 'OnMarket';
        player.marketValue = marketValue || 0;
        await player.save();

        res.json({ message: 'Player listed on market successfully', player });
    } catch (error) {
        console.error('Error listing player on market:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   POST /api/players/:id/sign
// @desc    Directly sign a released player (Free Agent)
// @access  Private (Team Role)
router.post('/:id/sign', requireUserAuth, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (req.user?.role !== 'team') {
            res.status(403).json({ message: 'Only clubs can sign players' });
            return;
        }

        const player = await Player.findOne({ _id: req.params.id, transferStatus: 'Released', status: { $in: ['Approved', 'Verified'] } });

        if (!player) {
            res.status(404).json({ message: 'Player not available for direct signing' });
            return;
        }

        player.clubId = req.user._id;
        player.currentClubName = req.user.clubName;
        player.transferStatus = 'None';
        player.marketValue = 0;
        await player.save();

        res.json({ message: 'Player signed successfully', player });
    } catch (error) {
        console.error('Error signing player:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

export default router;
