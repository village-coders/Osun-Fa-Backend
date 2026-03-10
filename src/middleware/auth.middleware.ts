import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AdminUser } from '../models/AdminUser';
import { Club } from '../models/Club';
import { Coach } from '../models/Coach';
import { Referee } from '../models/Referee';

export interface AuthRequest extends Request {
    user?: any; // You can type this more strictly later if needed
}

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized to access this route' });
        return;
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as jwt.JwtPayload;
        const user = await AdminUser.findById(decoded.id).select('-passwordHash');

        if (!user) {
            res.status(401).json({ message: 'User not found' });
            return;
        }

        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Not authorized to access this route' });
    }
};

export const requireUserAuth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    let token;
    console.log("MWAUTH: Checking authorization header");

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
        res.status(401).json({ message: 'Not authorized to access this route' });
        return;
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as jwt.JwtPayload;

        // Determine which model to use based on the role in the token
        let Model: any = null;
        switch (decoded.role) {
            case 'team': Model = Club; break;
            case 'coach': Model = Coach; break;
            case 'referee': Model = Referee; break;
            default:
                res.status(401).json({ message: 'Invalid role in token' });
                return;
        }

        const user = await Model.findById(decoded.id).select('-passwordHash');

        if (!user) {
            res.status(401).json({ message: 'User not found' });
            return;
        }

        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Not authorized to access this route' });
    }
};

export const requireApprovedClub = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
        res.status(401).json({ message: 'Authentication required' });
        return;
    }

    if (req.user.role === 'team' && req.user.status !== 'Approved') {
        res.status(403).json({
            message: 'Your club registration is still pending approval. You cannot perform this action until an admin approves your club.'
        });
        return;
    }

    next();
};
