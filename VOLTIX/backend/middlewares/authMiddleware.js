import User from "../models/User.js";
import jwt from "jsonwebtoken";
import ExpressError from "./expressError.js";

export const userAuth = async (req, res, next) => {
  try {
    const token = 
      req.cookies?.accessToken || 
      req.headers?.authorization?.split(" ")[1];

    if (!token) {
      throw new ExpressError(401, "User not authenticated");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ userId: decoded.userId });

    if (!user) {
      throw new ExpressError(401, "User not authenticated");
    }

    // Check if user account is active
    if (user.status !== 'active') {
      throw new ExpressError(401, "Account is not active");
    }

    // Check if email is verified
    if (!user.authentication.isEmailVerified) {
      throw new ExpressError(403, "Please verify your email first");
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      return next(new ExpressError(401, "Invalid or expired token"));
    }
    next(err);
  }
};

export const optionalAuth = async (req, res, next) => {
  try {
    const token = 
      req.cookies?.accessToken || 
      req.headers?.authorization?.split(" ")[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findOne({ userId: decoded.userId });
      
      if (user && user.status === 'active' && user.authentication.isEmailVerified) {
        req.user = user;
      }
    }
    
    next();
  } catch (err) {
    // Continue without authentication for optional auth
    next();
  }
};

export const requireEmailVerification = (req, res, next) => {
  if (!req.user) {
    throw new ExpressError(401, "User not authenticated");
  }

  if (!req.user.authentication.isEmailVerified) {
    throw new ExpressError(403, "Please verify your email first");
  }

  next();
};

export const requireSubscription = (plans = []) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new ExpressError(401, "User not authenticated");
    }

    if (!req.user.subscription.isActive) {
      throw new ExpressError(403, "Active subscription required");
    }

    if (plans.length && !plans.includes(req.user.subscription.plan)) {
      throw new ExpressError(403, `Subscription plan ${plans.join(' or ')} required`);
    }

    next();
  };
};