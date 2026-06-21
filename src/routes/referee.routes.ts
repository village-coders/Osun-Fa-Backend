import express, { Request, Response } from 'express';
import { Referee } from '../models/Referee';
import { upload } from '../middleware/upload.middleware';
import { requireAuth, requireUserAuth, AuthRequest } from '../middleware/auth.middleware';
import { sendApprovalEmail } from '../utils/email';
const router = express.Router();

// @route   PUT /api/referees/update-profile
// @desc    Update a referee profile after initial registration
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

        const currentRef = await Referee.findById(req.user._id || req.user.id);
        if (currentRef && !currentRef.status || currentRef?.status === 'Pending') {
            data.status = 'Pending';
        }

        const updatedReferee = await Referee.findByIdAndUpdate(
            req.user._id || req.user.id,
            { $set: data },
            { new: true, runValidators: true }
        );

        if (!updatedReferee) {
            console.error('Referee not found for ID:', req.user?._id || req.user?.id);
            res.status(404).json({ message: 'Referee profile not found' });
            return;
        }

        res.status(200).json(updatedReferee);
    } catch (error: any) {
        console.error('Error updating referee profile:', error);
        res.status(500).json({ 
            message: 'Error updating referee profile', 
            error: error.message || 'Unknown error',
            details: error.errors || error 
        });
    }
});

// @route   GET /api/referees
// @desc    Get all registered referees
// @access  Private (Admin)
router.get('/', requireAuth, async (req: Request, res: Response) => {
    try {
        const referees = await Referee.find().sort({ createdAt: -1 });
        res.json(referees);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   PUT /api/referees/:id/status
// @desc    Update referee registration status
// @access  Private (Admin)
router.put('/:id/status', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { status, remarks } = req.body;
        const ref = await Referee.findByIdAndUpdate(
            req.params.id,
            {
                status,
                remarks,
                reviewedBy: req.user?.clubName || 'Admin'
            },
            { new: true }
        );

        if (!ref) {
            res.status(404).json({ message: 'Referee not found' });
            return;
        }

        if (status === 'Approved' && ref.email) {
            try {
                await sendApprovalEmail(ref.email, 'referee', ref.refereeFullName || ref.surname || 'Referee');
            } catch (err) {
                console.error('Failed to send approval email', err);
            }
        }

        res.json(ref);
    } catch (error) {
        res.status(400).json({ message: 'Invalid data' });
    }
});

// @route   DELETE /api/referees/:id
// @desc    Delete a referee registration
// @access  Private (Admin)
router.delete('/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
    try {
        const ref = await Referee.findByIdAndDelete(req.params.id);
        if (!ref) {
            res.status(404).json({ message: 'Referee not found' });
            return;
        }
        res.json({ message: 'Referee removed' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

export default router;
