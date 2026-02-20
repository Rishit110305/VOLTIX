import * as authService from "../app/services/authService";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// Export types
export type SignupData = {
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
};

export type LoginData = {
  email: string;
  password: string;
};

export type AuthResponse = {
  success: boolean;
  message: string;
  user?: any;
  userId?: string;
  accessToken?: string;
  refreshToken?: string;
};
