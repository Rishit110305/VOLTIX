import api from "../config/api";

// User Registration
export const signup = (data: {
  name: string;
  email: string;
  password: string;
  phone: string;
  city: string;
  vehicleType?: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: number;
  batteryCapacity: number;
  registrationNumber: string;
}) => {
  console.log('🔍 AuthService - Sending signup request with data:', data);
  return api.post("/api/auth/signup", data).then(r => {
    console.log('✅ AuthService - Signup response:', r.data);
    return r.data;
  }).catch(err => {
    console.error('❌ AuthService - Signup error:', err.response?.data || err.message);
    // Extract error message from response
    const errorMessage = err.response?.data?.message || err.response?.data || err.message || 'Signup failed';
    throw new Error(errorMessage);
  });
};

// Email Verification
export const verifyEmail = (data: {
  userId: string;
  otp: string;
}) => api.post("/api/auth/verify-email", data).then(r => r.data);

// User Login
export const login = (data: {
  email: string;
  password: string;
}) => api.post("/api/auth/login", data).then(r => r.data);

// Forgot Password
export const forgotPassword = (data: {
  email: string;
}) => api.post("/api/auth/forgot-password", data).then(r => r.data);

// Reset Password
export const resetPassword = (data: {
  email: string;
  otp: string;
  newPassword: string;
}) => api.post("/api/auth/reset-password", data).then(r => r.data);

// Resend OTP
export const resendOTP = (data: {
  userId: string;
  type?: "email_verification" | "password_reset" | "phone_verification";
}) => api.post("/api/auth/resend-otp", data).then(r => r.data);

// Refresh Token
export const refreshToken = () => api.post("/api/auth/refresh").then(r => r.data);

// Logout
export const logout = () => api.post("/api/auth/logout").then(r => r.data);

// Get Current User Profile
export const getMe = () => api.get("/api/auth/me").then(r => r.data);

// Get Public Profile
export const getPublicProfile = (userId: string) => 
  api.get(`/api/auth/profile/${userId}`).then(r => r.data);

// Update Profile
export const updateProfile = (data: {
  name?: string;
  phone?: string;
  city?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleYear?: number;
  batteryCapacity?: number;
  preferences?: {
    maxDistance?: number;
    pricePreference?: "lowest" | "balanced" | "premium";
    chargingTimePreference?: "fastest" | "balanced" | "cheapest";
    notifications?: {
      email?: boolean;
      sms?: boolean;
      push?: boolean;
      marketing?: boolean;
    };
    language?: "en" | "hi" | "mr" | "ta" | "te" | "kn" | "bn";
  };
}) => api.put("/api/auth/profile", data).then(r => r.data);

// Change Password
export const changePassword = (data: {
  currentPassword: string;
  newPassword: string;
}) => api.put("/api/auth/change-password", data).then(r => r.data);

// Delete Account
export const deleteAccount = (data: {
  password: string;
}) => api.delete("/api/auth/account", { data }).then(r => r.data);

// Phone Verification
export const verifyPhone = (data: {
  userId: string;
  otp: string;
}) => api.post("/api/auth/verify-phone", data).then(r => r.data);

// Send Phone OTP
export const sendPhoneOTP = (data: {
  userId: string;
}) => api.post("/api/auth/send-phone-otp", data).then(r => r.data);

// Set Authorization Header
export const setAuthToken = (token: string) => {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
};

// Remove Authorization Header
export const removeAuthToken = () => {
  delete api.defaults.headers.common["Authorization"];
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  const token = localStorage.getItem("accessToken");
  return !!token;
};

// Get stored tokens
export const getStoredTokens = () => {
  return {
    accessToken: localStorage.getItem("accessToken"),
    refreshToken: localStorage.getItem("refreshToken")
  };
};

// Store tokens
export const storeTokens = (accessToken: string, refreshToken: string) => {
  localStorage.setItem("accessToken", accessToken);
  localStorage.setItem("refreshToken", refreshToken);
  setAuthToken(accessToken);
};

// Clear stored tokens
export const clearTokens = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  removeAuthToken();
};

// Request interceptor to add token (skip for auth routes)
api.interceptors.request.use(
  (config) => {
    // Don't add token for signup/login/verify routes
    const authRoutes = ['/api/auth/signup', '/api/auth/login', '/api/auth/verify-email', '/api/auth/forgot-password', '/api/auth/reset-password'];
    const isAuthRoute = authRoutes.some(route => config.url?.includes(route));
    
    if (!isAuthRoute) {
      const token = localStorage.getItem("accessToken");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for auto token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshTokenValue = localStorage.getItem("refreshToken");
        if (refreshTokenValue) {
          const response = await api.post("/api/auth/refresh", {
            refreshToken: refreshTokenValue
          });

          const { accessToken, refreshToken: newRefreshToken } = response.data;
          storeTokens(accessToken, newRefreshToken);

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        clearTokens();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export interface User {
  userId: string;
  profile: {
    name: string;
    email: string;
    phone: string;
    avatar?: string;
  };
  location: {
    city: string;
    coordinates?: [number, number];
  };
  vehicle: {
    type: string;
    make: string;
    model: string;
    year: number;
    batteryCapacity: number;
    registrationNumber: string;
  };
  subscription: {
    plan: "basic" | "premium" | "enterprise";
    status: "active" | "inactive" | "suspended";
    startDate: string;
    endDate?: string;
  };
  preferences: {
    maxDistance: number;
    pricePreference: "lowest" | "balanced" | "premium";
    chargingTimePreference: "fastest" | "balanced" | "cheapest";
    notifications: {
      email: boolean;
      sms: boolean;
      push: boolean;
      marketing: boolean;
    };
    language: string;
  };
  wallet: {
    balance: number;
    currency: string;
  };
  usage: {
    totalSessions: number;
    totalEnergyConsumed: number;
    totalAmountSpent: number;
    carbonSaved: number;
    averageSessionDuration: number;
  };
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  lastLogin: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
  accessToken?: string;
  refreshToken?: string;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: string[];
}

export default {
  // Authentication
  signup,
  verifyEmail,
  login,
  forgotPassword,
  resetPassword,
  resendOTP,
  refreshToken,
  logout,
  
  // Profile Management
  getMe,
  getPublicProfile,
  updateProfile,
  changePassword,
  deleteAccount,
  
  // Phone Verification
  verifyPhone,
  sendPhoneOTP,
  
  // Utilities
  setAuthToken,
  removeAuthToken,
  isAuthenticated,
  getStoredTokens,
  storeTokens,
  clearTokens
};