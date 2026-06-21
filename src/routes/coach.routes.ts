import express, { Request, Response } from 'express';
import { Coach } from '../models/Coach';
import { upload } from '../middleware/upload.middleware';
import { requireAuth, requireUserAuth, AuthRequest } from '../middleware/auth.middleware';
import { sendApprovalEmail } from '../utils/email';
const router = express.Router();

// @route   PUT /api/coaches/update-profile
// @desc    Update a coach profile after initial registration
// @access  Private (Portal User)
router.put('/update-profile', requireUserAuth, upload.any(), async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const data = { ...req.body };
        const files = req.files as Express.Multer.File[];

        if (files && files.length > 0) {
            files.forEach((file) => {
                data[`${file.fieldname}Url`] = file.path;
            });
        }

        const currentCoach = await Coach.findById(req.user._id || req.user.id);
        if (currentCoach && !currentCoach.status || currentCoach?.status === 'Pending') {
            data.status = 'Pending';
        }

        const updatedCoach = await Coach.findByIdAndUpdate(
            req.user._id || req.user.id,
            { $set: data },
            { new: true, runValidators: true }
        );

        if (!updatedCoach) {
            console.error('Coach not found for ID:', req.user?._id || req.user?.id);
            res.status(404).json({ message: 'Coach profile not found' });
            return;
        }

        res.status(200).json(updatedCoach);
    } catch (error: any) {
        console.error('Error updating coach profile:', error);
        res.status(500).json({ 
            message: 'Error updating coach profile', 
            error: error.message || 'Unknown error',
            details: error.errors || error 
        });
    }
});

// @route   GET /api/coaches
// @desc    Get all registered coaches
// @access  Private (Admin)
router.get('/', requireAuth, async (req: Request, res: Response) => {
    try {
        const coaches = await Coach.find().sort({ createdAt: -1 });
        res.json(coaches);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   PUT /api/coaches/:id/status
// @desc    Update coach registration status
// @access  Private (Admin)
router.put('/:id/status', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { status, remarks } = req.body;
        const coach = await Coach.findByIdAndUpdate(
            req.params.id,
            {
                status,
                remarks,
                reviewedBy: req.user?.clubName || 'Admin'
            },
            { new: true }
        );

        if (!coach) {
            res.status(404).json({ message: 'Coach not found' });
            return;
        }

        if (status === 'Approved' && coach.email) {
            try {
                await sendApprovalEmail(coach.email, 'coach', coach.coachFullName || coach.surname || 'Coach');
            } catch (err) {
                console.error('Failed to send approval email', err);
            }
        }

        res.json(coach);
    } catch (error) {
        res.status(400).json({ message: 'Invalid data' });
    }
});

// @route   DELETE /api/coaches/:id
// @desc    Delete a coach registration
// @access  Private (Admin)
router.delete('/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
    try {
        const coach = await Coach.findByIdAndDelete(req.params.id);
        if (!coach) {
            res.status(404).json({ message: 'Coach not found' });
            return;
        }
        res.json({ message: 'Coach removed' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

export default router;
