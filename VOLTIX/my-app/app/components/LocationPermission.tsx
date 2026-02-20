import { useState, useEffect } from 'react';
import { useLiveLocation } from '../hooks/useLiveLocation';
import { useAuth } from '../hooks/useAuth';

interface LocationPermissionProps {
  onLocationGranted?: (location: any) => void;
  onLocationDenied?: () => void;
  onSkip?: () => void;
  showSkipOption?: boolean;
  title?: string;
  description?: string;
}

export default function LocationPermission({
  onLocationGranted,
  onLocationDenied,
  onSkip,
  showSkipOption = true,
  title = "Enable Location Services",
  description = "We'll use your location to find nearby charging stations and provide personalized recommendations."
}: LocationPermissionProps) {
  const { location, error, loading, isSupported, requestLocation } = useLiveLocation();
  const { updateProfile } = useAuth();
  const [hasRequested, setHasRequested] = useState(false);

  // Handle location success
  useEffect(() => {
    if (location && !error) {
      // Update user profile with location
      updateProfile({
        location: {
          coordinates: [location.coordinates.longitude, location.coordinates.latitude],
          address: location.address
        }
      }).then(() => {
        onLocationGranted?.(location);
      });
    }
  }, [location, error, updateProfile, onLocationGranted]);

  // Handle location error
  useEffect(() => {
    if (error && hasRequested) {
      onLocationDenied?.();
    }
  }, [error, hasRequested, onLocationDenied]);

  const handleRequestLocation = () => {
    setHasRequested(true);
    requestLocation();
  };

  const handleSkip = () => {
    onSkip?.();
  };

  if (!isSupported) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Location Not Supported</h2>
          <p className="text-gray-600 mb-6">Your browser doesn't support location services.</p>
          {showSkipOption && (
            <button
              onClick={handleSkip}
              className="w-full bg-gray-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-gray-700 transition-colors"
            >
              Continue Without Location
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {/* Location Icon */}
        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
          {loading ? (
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          )}
        </div>

        {/* Title and Description */}
        <h2 className="text-2xl font-bold text-gray-800 mb-4">{title}</h2>
        <p className="text-gray-600 mb-8 leading-relaxed">{description}</p>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-700 text-sm">{error.message}</p>
            </div>
          </div>
        )}

        {/* Success Message */}
        {location && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-green-700 text-sm">Location detected successfully!</p>
            </div>
            {location.address && (
              <p className="text-green-600 text-xs mt-2">{location.address}</p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {!location && (
            <button
              onClick={handleRequestLocation}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Getting Location...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Enable Location
                </>
              )}
            </button>
          )}

          {showSkipOption && (
            <button
              onClick={handleSkip}
              className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              {location ? 'Continue' : 'Skip for Now'}
            </button>
          )}
        </div>

        {/* Privacy Note */}
        <p className="text-xs text-gray-500 mt-6 leading-relaxed">
          Your location data is encrypted and only used to enhance your charging experience. 
          You can change this setting anytime in your profile.
        </p>
      </div>
    </div>
  );
}