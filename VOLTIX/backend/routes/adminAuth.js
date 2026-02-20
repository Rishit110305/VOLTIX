import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const router = express.Router();

// ─── Admin credentials (stored as env vars for security) ───────────────────
// In production, these would come from a database or secure vault
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@voltix.com';
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || null;
const ADMIN_PLAINTEXT = process.env.ADMIN_PASSWORD || 'voltix@admin2026';

// ─── Admin Login ───────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required',
            });
        }

        // Validate email
        if (email.toLowerCase().trim() !== ADMIN_EMAIL.toLowerCase()) {
            return res.status(401).json({
                success: false,
                message: 'Invalid admin credentials',
            });
        }

        // Validate password — support bcrypt hash or plaintext fallback
        let isMatch = false;
        if (ADMIN_PASSWORD_HASH) {
            isMatch = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
        } else {
            isMatch = password === ADMIN_PLAINTEXT;
        }

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid admin credentials',
            });
        }

        // Generate admin JWT token (longer expiry for admin sessions)
        const adminToken = jwt.sign(
            {
                email: ADMIN_EMAIL,
                role: 'admin',
                isAdmin: true,
            },
            process.env.JWT_SECRET || 'default-secret',
            { expiresIn: '24h' }
        );

        console.log(`✅ Admin login successful: ${email}`);

        return res.status(200).json({
            success: true,
            message: 'Admin login successful',
            token: adminToken,
            admin: {
                email: ADMIN_EMAIL,
                role: 'admin',
                name: 'Voltix Admin',
            },
        });
    } catch (err) {
        console.error('❌ Admin login error:', err);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
});

// ─── Verify Admin Token ───────────────────────────────────────────────────
router.get('/verify', (req, res) => {
    try {
        const token =
            req.cookies?.adminToken ||
            req.headers?.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No admin token provided',
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');

        if (!decoded.isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Not an admin token',
            });
        }

        return res.status(200).json({
            success: true,
            admin: {
                email: decoded.email,
                role: decoded.role,
                name: 'Voltix Admin',
            },
        });
    } catch (err) {
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired admin token',
        });
    }
});

// ─── Admin Logout ─────────────────────────────────────────────────────────
router.post('/logout', (req, res) => {
    res.clearCookie('adminToken', {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
    });

    return res.status(200).json({
        success: true,
        message: 'Admin logged out successfully',
    });
});

export default router;
