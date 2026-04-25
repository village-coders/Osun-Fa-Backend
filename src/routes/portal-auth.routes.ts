import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Club } from '../models/Club';
import { Coach } from '../models/Coach';
import { Referee } from '../models/Referee';
import { Model } from 'mongoose';
import { requireUserAuth, AuthRequest } from '../middleware/auth.middleware';
import { sendVerificationEmail } from '../utils/email';

const router = express.Router();

// Shared interface for models that have authentication fields
interface IAuthModel extends Model<any> {
    comparePassword?: (p: string) => Promise<boolean>;
}

// Helper to determine which model to use based on role
const getModelByRole = (role: string): IAuthModel | null => {
    switch (role) {
        case 'team': return Club as any;
        case 'coach': return Coach as any;
        case 'referee': return Referee as any;
        default: return null;
    }
};

// Register
router.post('/register', async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password, role } = req.body;

        if (!email || !password || !role) {
            res.status(400).json({ message: 'All fields are required' });
            return;
        }

        const Model = getModelByRole(role);
        if (!Model) {
            res.status(400).json({ message: 'Invalid role selected' });
            return;
        }

        const existingUser = await Model.findOne({ email });
        if (existingUser) {
            res.status(400).json({ message: 'User with this email already exists' });
            return;
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const verificationToken = crypto.randomBytes(32).toString('hex');

        // Note: The specific domain fields (e.g. clubName) are no longer required, so we can save this.
        const newUser = new Model({
            email,
            passwordHash,
            role,
            verificationToken,
            isVerified: false
        });

        await newUser.save();

        try {
            await sendVerificationEmail(email, verificationToken, role);
        } catch (emailError) {
            console.error('Email Sending Failed:', emailError);
            // We still registered the user, but they'll need a "resend" option later
        }

        res.status(201).json({ message: 'Registration successful. Please check your email to verify your account.' });
    } catch (error) {
        console.error('Portal Registration Error:', error);
        res.status(500).json({ message: 'Server error during registration' });
    }
});

// Verify Email
router.get('/verify-email', async (req: Request, res: Response): Promise<void> => {
    try {
        const { token, role } = req.query;

        if (!token || !role || typeof role !== 'string') {
            res.status(400).json({ message: 'Invalid or missing verification token' });
            return;
        }

        const Model = getModelByRole(role);
        if (!Model) {
            res.status(400).json({ message: 'Invalid role' });
            return;
        }

        const user = await Model.findOne({ verificationToken: token });
        if (!user) {
            res.status(400).json({ message: 'Invalid or expired verification token' });
            return;
        }

        user.isVerified = true;
        user.verificationToken = undefined;
        await user.save();

        // Redirect to frontend portal setup loop / login
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        res.redirect(`${frontendUrl}/portal/verify?status=success`);
    } catch (error) {
        console.error('Email Verification Error:', error);
        res.status(500).json({ message: 'Server error during email verification' });
    }
});

// Login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password, role } = req.body;

        if (!email || !password || !role) {
            res.status(400).json({ message: 'Email, password, and role are required' });
            return;
        }

        const Model = getModelByRole(role);
        if (!Model) {
            res.status(400).json({ message: 'Invalid role' });
            return;
        }

        // We type assert to any here since typescript doesn't easily infer shared interface methods via the generic static Model
        const user: any = await Model.findOne({ email });

        if (!user) {
            res.status(401).json({ message: 'Invalid credentials' });
            return;
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            res.status(401).json({ message: 'Invalid credentials' });
            return;
        }

        if (!user.isVerified) {
            res.status(403).json({ message: 'Please verify your email address before logging in' });
            return;
        }

        const token = jwt.sign(
            { id: user._id.toString(), email: user.email, role: user.role },
            process.env.JWT_SECRET!,
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                email: user.email,
                role: user.role,
                isVerified: user.isVerified
            }
        });
    } catch (error) {
        console.error('Portal Login Error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
});

// Get Current Logged In User Profile
router.get('/me', requireUserAuth, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const user = req.user;
        if (!user) {
            res.status(404).json({ message: 'User profile not found' });
            return;
        }
        res.json(user);
    } catch (error) {
        console.error('Fetch Profile Error:', error);
        res.status(500).json({ message: 'Server error while fetching profile' });
    }
});

// Update Profile Settings
router.put('/settings', requireUserAuth, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?._id;
        const role = req.user?.role;

        if (!userId || !role) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        const Model = getModelByRole(role);
        if (!Model) {
            res.status(400).json({ message: 'Invalid role' });
            return;
        }

        const updates = { ...req.body };

        // Prevent updating sensitive fields
        delete updates.passwordHash;
        delete updates.role;
        delete updates.isVerified;
        delete updates.email; // Email changes might require re-verification

        // Handle password update if provided
        if (req.body.newPassword && req.body.currentPassword) {
            const user: any = await Model.findById(userId);
            const isMatch = await user.comparePassword(req.body.currentPassword);
            if (!isMatch) {
                res.status(401).json({ message: 'Invalid current password' });
                return;
            }
            updates.passwordHash = await bcrypt.hash(req.body.newPassword, 10);
        }

        const updatedUser = await Model.findByIdAndUpdate(userId, updates, { new: true }).select('-passwordHash');

        if (!updatedUser) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        res.json(updatedUser);
    } catch (error) {
        console.error('Update Settings Error:', error);
        res.status(500).json({ message: 'Server error while updating settings' });
    }
});

export default router;
