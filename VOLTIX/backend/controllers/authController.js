import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {
  generateAccessToken,
  generateRefreshToken,
  setAuthTokens,
} from "../utils/generateTokens.js";
import ExpressError from "../middlewares/expressError.js";
import otpService from "../services/otpService.js";

export const signup = async (req, res) => {
  console.log('🔍 Signup controller - Request body:', JSON.stringify(req.body, null, 2));
  
  const {
    name,
    email,
    phone,
    password,
    city,
    vehicleType,
    vehicleMake,
    vehicleModel,
    vehicleYear,
    batteryCapacity,
    registrationNumber,
    subscriptionPlan = 'basic'
  } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({
    $or: [
      { 'profile.email': email.toLowerCase() },
      { 'profile.phone': phone },
      { 'vehicle.registrationNumber': registrationNumber }
    ]
  });

  if (existingUser) {
    if (existingUser.profile.email === email.toLowerCase()) {
      throw new ExpressError(400, "User with this email already exists");
    }
    if (existingUser.profile.phone === phone) {
      throw new ExpressError(400, "Phone number already registered");
    }
    if (existingUser.vehicle.registrationNumber === registrationNumber) {
      throw new ExpressError(400, "Vehicle registration number already registered");
    }
  }

  // Generate unique userId
  const userCount = await User.countDocuments();
  const userId = `USR_${(userCount + 1).toString().padStart(6, '0')}`;

  // Calculate subscription end date
  const subscriptionEndDate = new Date();
  subscriptionEndDate.setFullYear(subscriptionEndDate.getFullYear() + 1);

  // Create new user (password will be hashed by pre-save middleware)
  const newUser = await User.create({
    userId,
    profile: {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone
    },
    authentication: {
      password: password // Don't hash here - let the pre-save middleware handle it
    },
    location: {
      city
    },
    vehicle: {
      type: vehicleType,
      make: vehicleMake,
      model: vehicleModel,
      year: vehicleYear,
      batteryCapacity,
      registrationNumber: registrationNumber.toUpperCase()
    },
    subscription: {
      plan: subscriptionPlan,
      startDate: new Date(),
      endDate: subscriptionEndDate
    }
  });

  // Generate OTP and send email
  await otpService.generateAndSendOTP(newUser.userId, email, 'email_verification');

  console.log('✅ User created successfully:', {
    userId: newUser.userId,
    email: newUser.profile.email,
    name: newUser.profile.name
  });

  res.status(201).json({
    success: true,
    message: "User registered successfully. Please verify your email with the OTP sent.",
    userId: newUser.userId, // Make sure userId is returned
    user: {
      userId: newUser.userId,
      name: newUser.profile.name,
      email: newUser.profile.email,
      phone: newUser.profile.phone,
      isEmailVerified: newUser.authentication.isEmailVerified
    }
  });
};

export const verifyEmail = async (req, res) => {
  const { userId, otp } = req.body;

  console.log('🔍 Email verification attempt:', { userId, otp, body: req.body });

  if (!userId || !otp) {
    console.log('❌ Missing userId or otp:', { userId: !!userId, otp: !!otp });
    throw new ExpressError(400, "User ID and OTP are required");
  }

  // Verify OTP
  const isValid = await otpService.verifyOTP(userId, otp, 'email_verification');
  console.log('🔍 OTP verification result:', { userId, otp, isValid });
  
  if (!isValid) {
    console.log('❌ Invalid OTP for user:', userId);
    throw new ExpressError(400, "Invalid or expired OTP");
  }

  // Update user verification status
  const user = await User.findOneAndUpdate(
    { userId },
    { 
      $set: { 
        'authentication.isEmailVerified': true,
        'authentication.lastLogin': new Date()
      }
    },
    { new: true }
  );

  if (!user) {
    console.log('❌ User not found:', userId);
    throw new ExpressError(404, "User not found");
  }

  console.log('✅ Email verified successfully for user:', userId);

  // Generate tokens
  const accessToken = generateAccessToken(user.userId);
  const refreshToken = generateRefreshToken(user.userId);

  // Save refresh token
  user.authentication.refreshTokens = user.authentication.refreshTokens || [];
  user.authentication.refreshTokens = user.authentication.refreshTokens.slice(-4); // Keep only last 4
  user.authentication.refreshTokens.push({ token: refreshToken });
  await user.save();

  setAuthTokens(res, accessToken, refreshToken);

  res.status(200).json({
    success: true,
    message: "Email verified successfully",
    user: {
      userId: user.userId,
      name: user.profile.name,
      email: user.profile.email,
      phone: user.profile.phone,
      isEmailVerified: user.authentication.isEmailVerified,
      subscription: user.subscription
    },
    accessToken,
    refreshToken
  });
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({
    'profile.email': email.toLowerCase()
  }).select("+authentication.password");

  if (!user) {
    throw new ExpressError(400, "Invalid credentials");
  }

  // Check if account is locked
  if (user.isLocked) {
    throw new ExpressError(423, "Account is temporarily locked due to too many failed login attempts");
  }

  const isMatch = await bcrypt.compare(password, user.authentication.password);
  if (!isMatch) {
    await user.incLoginAttempts();
    throw new ExpressError(400, "Invalid credentials");
  }

  // Check if email is verified
  if (!user.authentication.isEmailVerified) {
    // Send new OTP
    await otpService.generateAndSendOTP(user.userId, user.profile.email, 'email_verification');
    throw new ExpressError(403, "Please verify your email first. New OTP sent to your email.");
  }

  // Reset login attempts on successful login
  await user.resetLoginAttempts();

  const accessToken = generateAccessToken(user.userId);
  const refreshToken = generateRefreshToken(user.userId);

  // Manage refresh tokens
  user.authentication.refreshTokens = user.authentication.refreshTokens || [];
  user.authentication.refreshTokens = user.authentication.refreshTokens.slice(-4);
  user.authentication.refreshTokens.push({ token: refreshToken });
  await user.save();

  setAuthTokens(res, accessToken, refreshToken);

  res.status(200).json({
    success: true,
    message: "Login successful",
    accessToken,  // Add tokens to response
    refreshToken, // Add tokens to response
    user: {
      userId: user.userId,
      name: user.profile.name,
      email: user.profile.email,
      phone: user.profile.phone,
      subscription: user.subscription,
      preferences: user.preferences,
      wallet: user.wallet
    }
  });
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ 'profile.email': email.toLowerCase() });
  if (!user) {
    throw new ExpressError(404, "User with this email does not exist");
  }

  // Generate and send OTP
  await otpService.generateAndSendOTP(user.userId, email, 'password_reset');

  res.status(200).json({
    success: true,
    message: "Password reset OTP sent to your email"
  });
};

export const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  const user = await User.findOne({ 'profile.email': email.toLowerCase() });
  if (!user) {
    throw new ExpressError(404, "User not found");
  }

  // Verify OTP
  const isValid = await otpService.verifyOTP(user.userId, otp, 'password_reset');
  if (!isValid) {
    throw new ExpressError(400, "Invalid or expired OTP");
  }

  // Update password
  const hashedPassword = await bcrypt.hash(newPassword, 12);
  user.authentication.password = hashedPassword;
  
  // Clear all refresh tokens for security
  user.authentication.refreshTokens = [];
  await user.save();

  res.status(200).json({
    success: true,
    message: "Password reset successfully. Please login with your new password."
  });
};

export const resendOTP = async (req, res) => {
  const { userId, type = 'email_verification' } = req.body;

  const user = await User.findOne({ userId });
  if (!user) {
    throw new ExpressError(404, "User not found");
  }

  await otpService.generateAndSendOTP(userId, user.profile.email, type);

  res.status(200).json({
    success: true,
    message: "OTP sent successfully"
  });
};

export const logout = async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;

  if (refreshToken) {
    const user = await User.findOne({
      "authentication.refreshTokens.token": refreshToken
    });

    if (user) {
      user.authentication.refreshTokens = user.authentication.refreshTokens.filter(
        (rt) => rt.token !== refreshToken
      );
      await user.save();
    }
  }

  res.clearCookie("accessToken", {
    httpOnly: true,
    sameSite: "Strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  res.clearCookie("refreshToken", {
    httpOnly: true,
    sameSite: "Strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  res.status(200).json({ 
    success: true,
    message: "Logged out successfully" 
  });
};

export const refreshToken = async (req, res) => {
  const token = req.cookies?.refreshToken;

  if (!token) {
    throw new ExpressError(401, "Unauthorized");
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.REFRESH_JWT_SECRET);
  } catch {
    throw new ExpressError(401, "Invalid refresh token");
  }

  const user = await User.findOne({ userId: decoded.userId });
  if (!user) {
    throw new ExpressError(401, "Unauthorized");
  }

  const tokenExists = user.authentication.refreshTokens?.find((rt) => rt.token === token);
  if (!tokenExists) {
    throw new ExpressError(401, "Invalid refresh token");
  }

  const newAccessToken = generateAccessToken(user.userId);
  const newRefreshToken = generateRefreshToken(user.userId);

  // Rotate refresh token
  user.authentication.refreshTokens = user.authentication.refreshTokens.filter(
    (rt) => rt.token !== token
  );
  user.authentication.refreshTokens.push({ token: newRefreshToken });
  await user.save();

  setAuthTokens(res, newAccessToken, newRefreshToken);

  res.status(200).json({ 
    success: true,
    message: "Access token refreshed" 
  });
};

// Update user profile
export const updateProfile = async (req, res) => {
  const userId = req.user.userId;
  const {
    name,
    phone,
    city,
    vehicleMake,
    vehicleModel,
    vehicleYear,
    batteryCapacity,
    preferences
  } = req.body;

  const updateData = {};

  if (name) updateData['profile.name'] = name.trim();
  if (phone) {
    // Check if phone is already taken by another user
    const existingUser = await User.findOne({
      'profile.phone': phone,
      userId: { $ne: userId }
    });
    if (existingUser) {
      throw new ExpressError(400, "Phone number already registered");
    }
    updateData['profile.phone'] = phone;
  }
  if (city) updateData['location.city'] = city;
  if (vehicleMake) updateData['vehicle.make'] = vehicleMake;
  if (vehicleModel) updateData['vehicle.model'] = vehicleModel;
  if (vehicleYear) updateData['vehicle.year'] = vehicleYear;
  if (batteryCapacity) updateData['vehicle.batteryCapacity'] = batteryCapacity;
  if (preferences) {
    if (preferences.maxDistance) updateData['preferences.maxDistance'] = preferences.maxDistance;
    if (preferences.pricePreference) updateData['preferences.pricePreference'] = preferences.pricePreference;
    if (preferences.chargingTimePreference) updateData['preferences.chargingTimePreference'] = preferences.chargingTimePreference;
    if (preferences.notifications) updateData['preferences.notifications'] = preferences.notifications;
    if (preferences.language) updateData['preferences.language'] = preferences.language;
  }

  const user = await User.findOneAndUpdate(
    { userId },
    { $set: updateData },
    { new: true, runValidators: true }
  );

  if (!user) {
    throw new ExpressError(404, "User not found");
  }

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    user: {
      userId: user.userId,
      profile: user.profile,
      location: user.location,
      vehicle: user.vehicle,
      preferences: user.preferences
    }
  });
};

// Change password
export const changePassword = async (req, res) => {
  const userId = req.user.userId;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new ExpressError(400, "Current password and new password are required");
  }

  if (newPassword.length < 6) {
    throw new ExpressError(400, "New password must be at least 6 characters");
  }

  const user = await User.findOne({ userId }).select("+authentication.password");
  if (!user) {
    throw new ExpressError(404, "User not found");
  }

  // Verify current password
  const isMatch = await bcrypt.compare(currentPassword, user.authentication.password);
  if (!isMatch) {
    throw new ExpressError(400, "Current password is incorrect");
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 12);
  user.authentication.password = hashedPassword;
  
  // Clear all refresh tokens for security
  user.authentication.refreshTokens = [];
  await user.save();

  res.status(200).json({
    success: true,
    message: "Password changed successfully. Please login again."
  });
};

// Delete account
export const deleteAccount = async (req, res) => {
  const userId = req.user.userId;
  const { password } = req.body;

  if (!password) {
    throw new ExpressError(400, "Password is required to delete account");
  }

  const user = await User.findOne({ userId }).select("+authentication.password");
  if (!user) {
    throw new ExpressError(404, "User not found");
  }

  // Verify password
  const isMatch = await bcrypt.compare(password, user.authentication.password);
  if (!isMatch) {
    throw new ExpressError(400, "Incorrect password");
  }

  // Soft delete - mark as deleted instead of removing
  user.status = 'deleted';
  user.authentication.refreshTokens = [];
  await user.save();

  // Clear cookies
  res.clearCookie("accessToken", {
    httpOnly: true,
    sameSite: "Strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  res.clearCookie("refreshToken", {
    httpOnly: true,
    sameSite: "Strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  res.status(200).json({
    success: true,
    message: "Account deleted successfully"
  });
};

// Verify phone number
export const verifyPhone = async (req, res) => {
  const { userId, otp } = req.body;

  if (!userId || !otp) {
    throw new ExpressError(400, "User ID and OTP are required");
  }

  // Verify OTP
  const isValid = await otpService.verifyOTP(userId, otp, 'phone_verification');
  
  if (!isValid) {
    throw new ExpressError(400, "Invalid or expired OTP");
  }

  // Update user verification status
  const user = await User.findOneAndUpdate(
    { userId },
    { 
      $set: { 
        'authentication.isPhoneVerified': true
      }
    },
    { new: true }
  );

  if (!user) {
    throw new ExpressError(404, "User not found");
  }

  res.status(200).json({
    success: true,
    message: "Phone number verified successfully",
    user: {
      userId: user.userId,
      isPhoneVerified: user.authentication.isPhoneVerified
    }
  });
};

// Send phone verification OTP
export const sendPhoneOTP = async (req, res) => {
  const { userId } = req.body;

  const user = await User.findOne({ userId });
  if (!user) {
    throw new ExpressError(404, "User not found");
  }

  await otpService.generateAndSendOTP(userId, user.profile.email, 'phone_verification');

  res.status(200).json({
    success: true,
    message: "Phone verification OTP sent to your email"
  });
};