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
            <div className="w-28 h-28 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-full shadow-lg ring-2 ring-offset-2 ring-[#c8a96e]/30 bg-gradient-to-br from-[#0f1e38] via-[#1a3059] to-[#0f1e38] flex items-center justify-center text-[#c8a96e] font-bold text-3xl sm:text-4xl md:text-5xl group-hover:shadow-xl transition-all duration-300">
              {initials}
            </div>
          )}
          
          {/* Edit Camera Badge */}
          <div className="absolute -bottom-1 -right-1 bg-[#c8a96e] text-[#0f1e38] p-2 rounded-full shadow-md ring-2 ring-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:scale-110 transition-transform">
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5z"/>
            </svg>
          </div>
        </div>
      </ProfileEditModal>

      {/* User Info */}
      <div className="flex-1 min-w-0 text-center sm:text-left">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white leading-tight mb-1 break-words">
          {user.fullName || "User"}
        </h1>

        <p className="text-sm sm:text-base text-[#c8a96e] mb-3 break-all font-medium">
          {user.primaryEmailAddress?.emailAddress || "No email"}
        </p>

        {/* Status Badges */}
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
          {user.primaryEmailAddressVerificationStatus === "verified" && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30">
              <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-emerald-400 text-[#0f1e38] text-xs font-bold flex-shrink-0">
                ✓
              </span>
              <span className="text-xs font-semibold text-emerald-300">Verified</span>
            </span>
          )}

          <ProfileEditModal>
            <button className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white/80 border border-white/20 font-semibold text-xs hover:bg-white/20 transition-colors duration-200">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
              </svg>
              Edit Profile
            </button>
          </ProfileEditModal>
        </div>
      </div>
    </div>
  );
}
