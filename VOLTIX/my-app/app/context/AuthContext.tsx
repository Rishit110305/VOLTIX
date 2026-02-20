'use client';

import { createContext, useEffect, useState, ReactNode } from "react";
import * as auth from "../services/authService";
import { connectSocket, disconnectSocket } from "../config/socket";

interface User {
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

interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
  userId?: string;
  accessToken?: string;
  refreshToken?: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface SignupData {
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
}

interface VerifyEmailData {
  userId: string;
  otp: string;
}

interface ResendOTPData {
  userId: string;
  type?: "email_verification" | "password_reset" | "phone_verification";
}

interface ForgotPasswordData {
  email: string;
}

interface ResetPasswordData {
  email: string;
  otp: string;
  newPassword: string;
}

interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

interface UpdateProfileData {
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
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginData) => Promise<AuthResponse>;
  signup: (data: SignupData) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  verifyEmail: (data: VerifyEmailData) => Promise<AuthResponse>;
  resendOTP: (data: ResendOTPData) => Promise<AuthResponse>;
  forgotPassword: (data: ForgotPasswordData) => Promise<AuthResponse>;
  resetPassword: (data: ResetPasswordData) => Promise<AuthResponse>;
  changePassword: (data: ChangePasswordData) => Promise<AuthResponse>;
  updateProfile: (data: UpdateProfileData) => Promise<AuthResponse>;
  verifyPhone: (data: VerifyEmailData) => Promise<AuthResponse>;
  sendPhoneOTP: (data: { userId: string }) => Promise<AuthResponse>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated on app start
    auth.getMe()
      .then(res => {
        if (res.success) {
          setUser(res.user);
          connectSocket(); // connect socket after login
        }
      })
      .catch(error => {
        console.log("User not authenticated:", error);
        // Clear any invalid tokens
        auth.clearTokens();
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (data: LoginData): Promise<AuthResponse> => {
    try {
      const res = await auth.login(data);
      if (res.success) {
        // Store tokens
        if (res.accessToken && res.refreshToken) {
          auth.storeTokens(res.accessToken, res.refreshToken);
        }
        
        // Get user profile
        const me = await auth.getMe();
        if (me.success) {
          setUser(me.user);
          connectSocket(); // connect socket after successful login
        }
      }
      return res;
    } catch (error: unknown) {
      console.error("Login error:", error);
      const errorMessage = error instanceof Error ? error.message : "Login failed";
      return {
        success: false,
        message: errorMessage
      };
    }
  };

  const signup = async (data: SignupData): Promise<AuthResponse> => {
    try {
      const res = await auth.signup(data);
      return res;
    } catch (error: unknown) {
      console.error("Signup error:", error);
      const errorMessage = error instanceof Error ? error.message : "Signup failed";
      return {
        success: false,
        message: errorMessage
      };
    }
  };

  const logout = async () => {
    try {
      await auth.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Always clear local state and disconnect socket
      disconnectSocket();
      auth.clearTokens();
      setUser(null);
    }
  };

  const verifyEmail = async (data: VerifyEmailData): Promise<AuthResponse> => {
    try {
      const res = await auth.verifyEmail(data);
      if (res.success) {
        // Store tokens if provided
        if (res.accessToken && res.refreshToken) {
          auth.storeTokens(res.accessToken, res.refreshToken);
        }
        
        // Get updated user profile
        const me = await auth.getMe();
        if (me.success) {
          setUser(me.user);
          connectSocket();
        }
      }
      return res;
    } catch (error: unknown) {
      console.error("Email verification error:", error);
      const errorMessage = error instanceof Error ? error.message : "Email verification failed";
      return {
        success: false,
        message: errorMessage
      };
    }
  };

  const updateProfile = async (data: UpdateProfileData): Promise<AuthResponse> => {
    try {
      const res = await auth.updateProfile(data);
      if (res.success) {
        setUser(res.user);
      }
      return res;
    } catch (error: unknown) {
      console.error("Profile update error:", error);
      const errorMessage = error instanceof Error ? error.message : "Profile update failed";
      return {
        success: false,
        message: errorMessage
      };
    }
  };

  const forgotPassword = async (data: ForgotPasswordData): Promise<AuthResponse> => {
    try {
      const res = await auth.forgotPassword(data);
      return res;
    } catch (error: unknown) {
      console.error("Forgot password error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to send reset email";
      return {
        success: false,
        message: errorMessage
      };
    }
  };

  const resetPassword = async (data: ResetPasswordData): Promise<AuthResponse> => {
    try {
      const res = await auth.resetPassword(data);
      return res;
    } catch (error: unknown) {
      console.error("Reset password error:", error);
      const errorMessage = error instanceof Error ? error.message : "Password reset failed";
      return {
        success: false,
        message: errorMessage
      };
    }
  };

  const changePassword = async (data: ChangePasswordData): Promise<AuthResponse> => {
    try {
      const res = await auth.changePassword(data);
      return res;
    } catch (error: unknown) {
      console.error("Change password error:", error);
      const errorMessage = error instanceof Error ? error.message : "Password change failed";
      return {
        success: false,
        message: errorMessage
      };
    }
  };

  const resendOTP = async (data: ResendOTPData): Promise<AuthResponse> => {
    try {
      const res = await auth.resendOTP(data);
      return res;
    } catch (error: unknown) {
      console.error("Resend OTP error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to resend OTP";
      return {
        success: false,
        message: errorMessage
      };
    }
  };

  const verifyPhone = async (data: VerifyEmailData): Promise<AuthResponse> => {
    try {
      const res = await auth.verifyPhone(data);
      if (res.success) {
        // Get updated user profile
        const me = await auth.getMe();
        if (me.success) {
          setUser(me.user);
        }
      }
      return res;
    } catch (error: unknown) {
      console.error("Phone verification error:", error);
      const errorMessage = error instanceof Error ? error.message : "Phone verification failed";
      return {
        success: false,
        message: errorMessage
      };
    }
  };

  const sendPhoneOTP = async (data: { userId: string }): Promise<AuthResponse> => {
    try {
      const res = await auth.sendPhoneOTP(data);
      return res;
    } catch (error: unknown) {
      console.error("Send phone OTP error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to send phone OTP";
      return {
        success: false,
        message: errorMessage
      };
    }
  };

  return (
    <AuthContext.Provider 
      value={{
        // State
        user,
        loading,
        isAuthenticated: !!user,
        
        // Authentication methods
        login,
        signup,
        logout,
        
        // Email verification
        verifyEmail,
        resendOTP,
        
        // Password management
        forgotPassword,
        resetPassword,
        changePassword,
        
        // Profile management
        updateProfile,
        
        // Phone verification
        verifyPhone,
        sendPhoneOTP
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};