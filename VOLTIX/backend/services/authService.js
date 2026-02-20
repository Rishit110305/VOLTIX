import User from '../models/User.js';
import ExpressError from '../middlewares/expressError.js';

class AuthService {
  
  async registerUser(userData) {
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
    } = userData;

    try {
      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [
          { 'profile.email': email },
          { 'profile.phone': phone },
          { 'vehicle.registrationNumber': registrationNumber }
        ]
      });

      if (existingUser) {
        if (existingUser.profile.email === email) {
          throw new ExpressError(400, 'Email already registered');
        }
        if (existingUser.profile.phone === phone) {
          throw new ExpressError(400, 'Phone number already registered');
        }
        if (existingUser.vehicle.registrationNumber === registrationNumber) {
          throw new ExpressError(400, 'Vehicle registration number already registered');
        }
      }

      // Generate unique userId
      const userCount = await User.countDocuments();
      const userId = `USR_${(userCount + 1).toString().padStart(6, '0')}`;

      // Calculate subscription end date (1 year from now)
      const subscriptionEndDate = new Date();
      subscriptionEndDate.setFullYear(subscriptionEndDate.getFullYear() + 1);

      // Create new user
      const newUser = new User({
        userId,
        profile: {
          name,
          email,
          phone
        },
        authentication: {
          password // Will be hashed by pre-save middleware
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
          registrationNumber
        },
        subscription: {
          plan: subscriptionPlan,
          startDate: new Date(),
          endDate: subscriptionEndDate
        }
      });

      await newUser.save();

      // Generate JWT token
      const token = newUser.generateAuthToken();

      // Remove sensitive data from response
      const userResponse = {
        userId: newUser.userId,
        profile: newUser.profile,
        location: newUser.location,
        vehicle: newUser.vehicle,
        subscription: newUser.subscription,
        createdAt: newUser.createdAt
      };

      return {
        success: true,
        message: 'User registered successfully',
        user: userResponse,
        token
      };
    } catch (error) {
      if (error instanceof ExpressError) throw error;
      if (error.code === 11000) {
        const field = Object.keys(error.keyValue)[0];
        throw new ExpressError(400, `${field} already exists`);
      }
      throw new ExpressError(500, `Registration failed: ${error.message}`);
    }
  }

  
  async loginUser(email, password) {
    try {
      // Find user by email
      const user = await User.findOne({ 'profile.email': email });
      
      if (!user) {
        throw new ExpressError(401, 'Invalid email or password');
      }

      // Check if account is locked
      if (user.isLocked) {
        throw new ExpressError(423, 'Account is temporarily locked due to too many failed login attempts');
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);
      
      if (!isPasswordValid) {
        // Increment login attempts
        await user.incLoginAttempts();
        throw new ExpressError(401, 'Invalid email or password');
      }

      // Reset login attempts on successful login
      await user.resetLoginAttempts();

      // Generate JWT token
      const token = user.generateAuthToken();

      // Remove sensitive data from response
      const userResponse = {
        userId: user.userId,
        profile: user.profile,
        location: user.location,
        vehicle: user.vehicle,
        subscription: user.subscription,
        preferences: user.preferences,
        wallet: user.wallet,
        lastLogin: new Date()
      };

      return {
        success: true,
        message: 'Login successful',
        user: userResponse,
        token
      };
    } catch (error) {
      if (error instanceof ExpressError) throw error;
      throw new ExpressError(500, `Login failed: ${error.message}`);
    }
  }
}

// Create singleton instance
const authService = new AuthService();

export default authService;