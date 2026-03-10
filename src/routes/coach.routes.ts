import express, { Request, Response } from 'express';
import { Coach } from '../models/Coach';
import { upload } from '../middleware/upload.middleware';
import { requireAuth, requireUserAuth, AuthRequest } from '../middleware/auth.middleware';
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

        const updatedCoach = await Coach.findByIdAndUpdate(
            req.user._id,
            { $set: data },
            { new: true, runValidators: true }
        );

        if (!updatedCoach) {
            res.status(404).json({ message: 'Coach profile not found' });
            return;
        }

        res.status(200).json(updatedCoach);
    } catch (error) {
        console.error('Error updating coach profile:', error);
        res.status(400).json({ message: 'Error updating coach profile', error });
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
