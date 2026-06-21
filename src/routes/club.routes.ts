import express, { Request, Response } from 'express';
import { Club } from '../models/Club';
import { upload } from '../middleware/upload.middleware';
import { requireAuth, requireUserAuth, AuthRequest } from '../middleware/auth.middleware';
import { sendApprovalEmail } from '../utils/email';
const router = express.Router();

// @route   PUT /api/clubs/update-profile
// @desc    Update a club profile after initial registration
// @access  Private (Portal User)
router.put(
    '/update-profile',
    requireUserAuth,
    upload.any(),
    async (req: AuthRequest, res: Response): Promise<void> => {
        console.log("ROUTE: Entering /api/clubs/update-profile");
        try {
            console.log("Updating club profile for user:", req.user?._id || req.user?.id);
            const clubData = { ...req.body };
            const files = req.files as Express.Multer.File[];

            // Map uploaded files to their respective URL fields
            if (files && files.length > 0) {
                files.forEach((file) => {
                    clubData[`${file.fieldname}Url`] = file.path;
                });
            }

            // Auto-generate Application ID and submission date if this is the first submission
            const currentClub = await Club.findById(req.user._id);
            if (currentClub && !currentClub.applicationId) {
                const year = new Date().getFullYear();
                const random = Math.floor(1000 + Math.random() * 9000);
                clubData.applicationId = `OSFA-CLUB-${year}-${random}`;
                clubData.dateSubmitted = new Date();
                clubData.status = 'Pending';
            }

            // Update the existing user (Club document) with the profile data
            const updatedClub = await Club.findByIdAndUpdate(
                req.user._id || req.user.id,
                { $set: clubData },
                { new: true, runValidators: true }
            );

            if (!updatedClub) {
                console.error('Club not found for ID:', req.user?._id || req.user?.id);
                res.status(404).json({ message: 'Club profile not found' });
                return;
            }

            res.status(200).json(updatedClub);
        } catch (error: any) {
            console.error('Error updating club profile:', error);
            res.status(500).json({
                message: 'Error updating club profile',
                error: error.message || 'Unknown error',
                details: error.errors || error
            });
        }
    }
);

// @route   GET /api/clubs
// @desc    Get all registered clubs
// @access  Private (Admin)
router.get('/', requireAuth, async (req: Request, res: Response) => {
    try {
        const clubs = await Club.find().sort({ createdAt: -1 });
        res.json(clubs);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/clubs/public
// @desc    Get all registered clubs
// @access  Public
router.get('/public', async (req: Request, res: Response) => {
    try {
        const clubs = await Club.find().sort({ createdAt: -1 });
        console.log(clubs);
        res.json(clubs);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   PUT /api/clubs/:id/status
// @desc    Update club registration status
// @access  Private (Admin)
router.put('/:id/status', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { status, remarks } = req.body;
        const reviewer = req.user?.email || 'Admin';

        const club = await Club.findByIdAndUpdate(
            req.params.id,
            {
                status,
                remarks,
                reviewedBy: reviewer,
                dateSubmitted: new Date() // Date of review
            },
            { new: true }
        );

        if (!club) {
            res.status(404).json({ message: 'Club not found' });
            return;
        }

        if (status === 'Approved' && club.email) {
            try {
                await sendApprovalEmail(club.email, 'club', club.clubName || club.name || 'Club Representative');
            } catch (err) {
                console.error('Failed to send approval email', err);
            }
        }

        res.json(club);
    } catch (error) {
        console.error('Update Status Error:', error);
        res.status(400).json({ message: 'Invalid data' });
    }
});

// @route   DELETE /api/clubs/:id
// @desc    Delete a club registration
// @access  Private (Admin)
router.delete('/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
    try {
        const club = await Club.findByIdAndDelete(req.params.id);
        if (!club) {
            res.status(404).json({ message: 'Club not found' });
            return;
        }
        res.json({ message: 'Club removed' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

export default router;
