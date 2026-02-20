import jwt from 'jsonwebtoken';
import ExpressError from './expressError.js';

/**
 * Middleware to protect admin-only routes.
 * Checks for a valid JWT with isAdmin: true.
 */
export const adminAuth = (req, res, next) => {
    try {
        const token =
            req.cookies?.adminToken ||
            req.headers?.authorization?.split(' ')[1];

        if (!token) {
            throw new ExpressError(401, 'Admin authentication required');
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');

        if (!decoded.isAdmin) {
            throw new ExpressError(403, 'Admin access denied');
        }

        req.admin = decoded;
        next();
    } catch (err) {
        if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
            return next(new ExpressError(401, 'Invalid or expired admin token'));
        }
        next(err);
    }
};
