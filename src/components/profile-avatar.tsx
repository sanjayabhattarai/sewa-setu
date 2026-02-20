"use client";

import { ProfileEditModal } from "@/components/profile-edit-modal";

interface ProfileAvatarProps {
  user: {
    fullName: string | null;
    imageUrl: string | null;
    primaryEmailAddress: {
      emailAddress: string;
    } | null;
    primaryEmailAddressVerificationStatus: string | undefined;
  };
}

export function ProfileAvatar({ user }: ProfileAvatarProps) {
  const initials = user.fullName
    ?.split(" ")
    .map((name) => name[0])
    .join("")
    .toUpperCase() || "U";

  return (
    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5 md:gap-6">
      {/* Avatar Container */}
      <ProfileEditModal>
        <div className="relative group cursor-pointer flex-shrink-0">
          {/* Avatar Image/Initials */}
          {user.imageUrl ? (
            <div className="relative w-28 h-28 sm:w-32 sm:h-32 md:w-40 md:h-40">
              <img
                src={user.imageUrl}
                alt={user.fullName || "User"}
                className="w-full h-full rounded-full shadow-lg ring-2 ring-offset-2 ring-blue-100 bg-white object-cover"
                crossOrigin="anonymous"
                loading="eager"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
              {/* Hover Overlay */}
              <div className="absolute inset-0 rounded-full bg-black bg-opacity-0 group-hover:bg-opacity-25 transition-all duration-300 flex items-center justify-center">
                <span className="text-white text-xs sm:text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  Click to Edit
                </span>
              </div>
            </div>
          ) : (
            <div className="w-28 h-28 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-full shadow-lg ring-2 ring-offset-2 ring-blue-100 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 flex items-center justify-center text-white font-bold text-3xl sm:text-4xl md:text-5xl group-hover:shadow-xl transition-all duration-300">
              {initials}
            </div>
          )}
          
          {/* Edit Camera Badge */}
          <div className="absolute -bottom-1 -right-1 bg-gradient-to-br from-blue-500 to-blue-600 text-white p-2 rounded-full shadow-md ring-2 ring-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:scale-110 transition-transform">
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5z"/>
            </svg>
          </div>
        </div>
      </ProfileEditModal>

      {/* User Info */}
      <div className="flex-1 min-w-0 text-center sm:text-left">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 leading-tight mb-0.5 break-words">
          {user.fullName || "User"}
        </h1>
        
        <p className="text-sm sm:text-base md:text-lg text-gray-600 mb-2 break-all font-medium">
          {user.primaryEmailAddress?.emailAddress || "No email"}
        </p>

        {/* Status Badges */}
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
          {user.primaryEmailAddressVerificationStatus === "verified" && (
            <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-green-100 border border-green-300 ring-1 ring-green-200">
              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-green-500 text-white text-xs font-bold flex-shrink-0">
                ✓
              </span>
              <span className="text-xs sm:text-sm font-semibold text-green-700">Verified</span>
            </span>
          )}
          
          <ProfileEditModal>
            <button className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-blue-600 text-white font-semibold text-xs sm:text-sm hover:bg-blue-700 transition-colors duration-200 shadow-md hover:shadow-lg">
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5z"/>
              </svg>
              Edit
            </button>
          </ProfileEditModal>
        </div>
      </div>
    </div>
  );
}
