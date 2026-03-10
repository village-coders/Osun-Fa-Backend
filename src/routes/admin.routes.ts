import express, { Request, Response } from 'express';
import { Club } from '../models/Club';
import { Player } from '../models/Player';
import { Coach } from '../models/Coach';
import { Referee } from '../models/Referee';
import { FriendlyMatch } from '../models/FriendlyMatch';
import { requireAuth, AuthRequest } from '../middleware/auth.middleware';

const router = express.Router();

// @route   GET /api/admin/stats
// @desc    Get system-wide statistics for the admin dashboard
// @access  Private (Admin)
router.get('/stats', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
        const [
            clubStats,
            playerStats,
            coachCount,
            refereeCount,
            matchCount
        ] = await Promise.all([
            Club.aggregate([
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ]),
            Player.aggregate([
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ]),
            Coach.countDocuments(),
            Referee.countDocuments(),
            FriendlyMatch.countDocuments()
        ]);

        res.json({
            clubs: clubStats.reduce((acc: any, curr: any) => ({ ...acc, [curr._id.toLowerCase()]: curr.count }), { pending: 0, approved: 0, rejected: 0 }),
            players: playerStats.reduce((acc: any, curr: any) => ({ ...acc, [curr._id.toLowerCase()]: curr.count }), { pending: 0, approved: 0, rejected: 0 }),
            coaches: coachCount,
            referees: refereeCount,
            matches: matchCount,
            totalClubs: clubStats.reduce((acc: number, curr: any) => acc + curr.count, 0),
            totalPlayers: playerStats.reduce((acc: number, curr: any) => acc + curr.count, 0)
        });
    } catch (error) {
        console.error('Admin Stats Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/admin/needs-attention
// @desc    Get list of pending clubs and players requiring review
// @access  Private (Admin)
router.get('/needs-attention', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
        const [pendingClubs, pendingPlayers] = await Promise.all([
            Club.find({ status: 'Pending' }).select('name clubName city townCity createdAt').limit(10),
            Player.find({ status: 'Pending' }).select('surname firstName currentClubName createdAt').limit(10)
        ]);

        const attentionItems = [
            ...pendingClubs.map(c => ({ id: c._id, type: 'Club', name: c.name || c.clubName, details: c.city || c.townCity, date: c.createdAt })),
            ...pendingPlayers.map(p => ({ id: p._id, type: 'Player', name: `${p.surname} ${p.firstName}`, details: p.currentClubName, date: p.createdAt }))
        ].sort((a: any, b: any) => b.date.getTime() - a.date.getTime());

        res.json(attentionItems);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

export default router;
