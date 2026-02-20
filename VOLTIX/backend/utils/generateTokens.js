import jwt from "jsonwebtoken";

export const generateAccessToken = (userId) => {
  return jwt.sign(
    { userId }, 
    process.env.JWT_SECRET || 'default-secret', 
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "15m",
    }
  );
};

export const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId }, 
    process.env.REFRESH_JWT_SECRET || 'default-refresh-secret', 
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
    }
  );
};

export const setAuthTokens = (res, accessToken, refreshToken) => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  const accessOptions = {
    httpOnly: true,
    sameSite: isProduction ? 'none' : 'lax', // 'none' for cross-origin in production
    secure: isProduction, // Required when sameSite='none'
    maxAge: 15 * 60 * 1000, // 15 mins
    path: '/'
  };

  const refreshOptions = {
    httpOnly: true,
    sameSite: isProduction ? 'none' : 'lax', // 'none' for cross-origin in production
    secure: isProduction, // Required when sameSite='none'
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/'
  };

  res.cookie('accessToken', accessToken, accessOptions);
  res.cookie('refreshToken', refreshToken, refreshOptions);
};