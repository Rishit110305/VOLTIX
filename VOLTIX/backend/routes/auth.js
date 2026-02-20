import express from 'express';
import {
  signup,
  verifyEmail,
  login,
  forgotPassword,
  resetPassword,
  resendOTP,
  logout,
  refreshToken,
  updateProfile,
  changePassword,
  deleteAccount,
  verifyPhone,
  sendPhoneOTP
} from '../controllers/authController.js';
import { userAuth, optionalAuth } from '../middlewares/authMiddleware.js';
import {
  validateUserSignUp,
  validateUserLogin,
  validateOTPVerification,
  validatePasswordReset,
  validateResendOTP,
  validateForgotPassword,
  validateUpdateProfile,
  validateChangePassword,
  validateDeleteAccount,
  validateSendPhoneOTP
} from '../middlewares/validate.js';
import wrapAsync from '../middlewares/wrapAsync.js';
import User from '../models/User.js';
import ExpressError from '../middlewares/expressError.js';

const router = express.Router();

// User Registration
router.post('/signup', validateUserSignUp, wrapAsync(signup));

// Email Verification
router.post('/verify-email', validateOTPVerification, wrapAsync(verifyEmail));

// User Login
router.post('/login', validateUserLogin, wrapAsync(login));

// Forgot Password
router.post('/forgot-password', validateForgotPassword, wrapAsync(forgotPassword));

// Reset Password
router.post('/reset-password', validatePasswordReset, wrapAsync(resetPassword));

// Resend OTP
router.post('/resend-otp', validateResendOTP, wrapAsync(resendOTP));

// Refresh Token
router.post('/refresh', wrapAsync(refreshToken));

// Logout
router.post('/logout', userAuth, wrapAsync(logout));

// =============================================================================
// PROFILE MANAGEMENT ROUTES
// =============================================================================

// Get Current User Profile
router.get('/me', userAuth, wrapAsync((req, res) => {
  res.status(200).json({
    success: true,
    user: {
      userId: req.user.userId,
      profile: req.user.profile,
      location: req.user.location,
      vehicle: req.user.vehicle,
      subscription: req.user.subscription,
      preferences: req.user.preferences,
      wallet: req.user.wallet,
      usage: req.user.usage,
      isEmailVerified: req.user.authentication.isEmailVerified,
      isPhoneVerified: req.user.authentication.isPhoneVerified,
      lastLogin: req.user.authentication.lastLogin
    }
  });
}));

// Get Public Profile (for other users to see basic info)
router.get('/profile/:userId', optionalAuth, wrapAsync(async (req, res) => {
  const { userId } = req.params;
  
  const user = await User.findOne({ userId, status: 'active' })
    .select('userId profile.name location.city vehicle.type subscription.plan usage.totalSessions usage.carbonSaved');
  
  if (!user) {
    throw new ExpressError(404, 'User not found');
  }

  res.status(200).json({
    success: true,
    user: {
      userId: user.userId,
      name: user.profile.name,
      city: user.location.city,
      vehicleType: user.vehicle.type,
      subscriptionPlan: user.subscription.plan,
      totalSessions: user.usage.totalSessions,
      carbonSaved: user.usage.carbonSaved
    }
  });
}));

// Update Profile
router.put('/profile', userAuth, validateUpdateProfile, wrapAsync(updateProfile));

// Change Password
router.put('/change-password', userAuth, validateChangePassword, wrapAsync(changePassword));

// Delete Account
router.delete('/account', userAuth, validateDeleteAccount, wrapAsync(deleteAccount));

// =============================================================================
// PHONE VERIFICATION ROUTES
// =============================================================================

// Phone Verification
router.post('/verify-phone', validateOTPVerification, wrapAsync(verifyPhone));

// Send Phone OTP
router.post('/send-phone-otp', validateSendPhoneOTP, wrapAsync(sendPhoneOTP));

export default router;