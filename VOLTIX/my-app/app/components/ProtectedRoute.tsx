import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, loading, user } = useAuth();
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(false);
  const [progress, setProgress] = useState(0);

  // Simulate progress for better UX
  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 15;
        });
      }, 200);

      return () => clearInterval(interval);
    }
  }, [loading]);

  useEffect(() => {
    if (!loading) {
      setProgress(100);
      
      if (!isAuthenticated) {
        setRedirecting(true);
        setTimeout(() => {
          router.push('/login');
        }, 1000);
      }
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center relative overflow-hidden">
        {/* Background Animation */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-100 rounded-full opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-100 rounded-full opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-full opacity-30 animate-spin" style={{ animationDuration: '20s' }}></div>
        </div>

        <div className="text-center z-10 relative">
          {/* Main Loader */}
          <div className="relative mb-8">
            {/* Outer spinning ring */}
            <div className="w-24 h-24 border-4 border-blue-200 rounded-full animate-spin border-t-blue-600 mx-auto"></div>
            
            {/* Middle ring */}
            <div className="absolute top-2 left-2 w-20 h-20 border-2 border-indigo-100 rounded-full animate-spin border-b-indigo-400" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
            
            {/* Inner pulsing dot */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="w-4 h-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full animate-pulse"></div>
            </div>
          </div>

          {/* Loading text with enhanced animation */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800 animate-pulse">
              Authenticating...
            </h2>
            
            {/* Animated dots */}
            <div className="flex justify-center space-x-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-3 h-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                ></div>
              ))}
            </div>
          </div>

          {/* Enhanced Progress bar */}
          <div className="mt-8 w-80 mx-auto">
            <div className="flex justify-between text-sm text-gray-500 mb-2">
              <span>Verifying credentials</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="bg-gray-200 rounded-full h-2 overflow-hidden shadow-inner">
              <div 
                className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 h-full rounded-full transition-all duration-300 ease-out relative"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute inset-0 bg-white opacity-30 animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Status messages */}
          <div className="mt-6 space-y-2">
            <p className="text-sm text-gray-600 animate-fade-in">
              {progress < 30 && "Connecting to server..."}
              {progress >= 30 && progress < 60 && "Verifying authentication..."}
              {progress >= 60 && progress < 90 && "Loading user profile..."}
              {progress >= 90 && "Almost ready..."}
            </p>
            
            {user && (
              <p className="text-xs text-gray-500 animate-fade-in">
                Welcome back, {user.profile?.name}!
              </p>
            )}
          </div>
        </div>

        <style jsx>{`
          @keyframes fade-in {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in {
            animation: fade-in 0.8s ease-in-out;
          }
        `}</style>
      </div>
    );
  }

  if (redirecting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">Redirecting to login...</p>
          <div className="w-48 h-1 bg-orange-200 rounded-full mx-auto overflow-hidden">
            <div className="w-full h-full bg-gradient-to-r from-orange-400 to-red-500 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}