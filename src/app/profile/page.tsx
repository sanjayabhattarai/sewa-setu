import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LogOut, ArrowLeft, MapPin, Clock, Heart, Shield, Calendar } from "lucide-react";
import { SignOutButton } from "@clerk/nextjs";
import { ProfileEditModal } from "@/components/profile-edit-modal";
import { ProfileAvatar } from "@/components/profile-avatar";

export const revalidate = 0;

export default async function ProfilePage() {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Extract only serializable data to pass to client components
  const userDataForClient = {
    id: user.id,
    fullName: user.fullName,
    imageUrl: user.imageUrl,
    primaryEmailAddress: user.primaryEmailAddress ? {
      emailAddress: user.primaryEmailAddress.emailAddress,
    } : null,
    primaryEmailAddressVerificationStatus: user.primaryEmailAddress?.verification?.status,
    phoneNumbers: user.phoneNumbers ? 
      user.phoneNumbers.map((p) => ({
        phoneNumber: p.phoneNumber,
      })) 
      : [],
    createdAt: user.createdAt,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-100 p-4 pt-20 pb-12">
      <div className="max-w-5xl mx-auto">
        {/* Back Navigation */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors">
            <ArrowLeft size={18} />
            <span>Back to home</span>
          </Link>
        </div>

        {/* Main Profile Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Profile Content */}
          <div className="px-6 md:px-10 py-10 pb-10">
            {/* Avatar and Name Section */}
            <div className="mb-8">
              <ProfileAvatar user={userDataForClient} />
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-blue-200 via-indigo-200 to-transparent mb-8"></div>

            {/* Stats Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 text-center border border-blue-200 hover:shadow-lg transition-shadow">
                <div className="text-4xl font-bold text-blue-600 mb-2">∞</div>
                <p className="text-gray-700 font-medium">Total Bookings</p>
                <p className="text-xs text-gray-500 mt-1">All your appointments</p>
              </div>
              
              <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-2xl p-6 text-center border border-indigo-200 hover:shadow-lg transition-shadow">
                <div className="text-4xl font-bold text-indigo-600 mb-2">0</div>
                <p className="text-gray-700 font-medium">Saved Hospitals</p>
                <p className="text-xs text-gray-500 mt-1">Your favorites</p>
              </div>
              
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 text-center border border-purple-200 hover:shadow-lg transition-shadow flex flex-col items-center justify-center min-h-[180px]">
                <div className="text-2xl font-bold text-purple-600 mb-2 break-words">
                  {userDataForClient.createdAt ? new Date(userDataForClient.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                </div>
                <p className="text-gray-700 font-medium text-center">Member Since</p>
              </div>
            </div>

            {/* Account Information Section */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Shield size={24} className="text-blue-600" />
                Account Information
              </h2>
              <div className="grid md:grid-cols-2 gap-5">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200 hover:border-blue-300 transition-colors">
                  <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wide mb-2">Email Address</h3>
                  <p className="text-gray-900 font-medium break-all text-sm">{userDataForClient.primaryEmailAddress?.emailAddress || "-"}</p>
                </div>

                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-2xl p-6 border border-indigo-200 hover:border-indigo-300 transition-colors">
                  <h3 className="text-xs font-bold text-indigo-900 uppercase tracking-wide mb-2">User ID</h3>
                  <p className="text-gray-900 font-mono text-xs break-all">{userDataForClient.id}</p>
                </div>

                {userDataForClient.primaryEmailAddressVerificationStatus === "verified" && (
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-200 hover:border-green-300 transition-colors">
                    <h3 className="text-xs font-bold text-green-900 uppercase tracking-wide mb-2">Email Status</h3>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-500">
                        <span className="text-white text-sm">✓</span>
                      </span>
                      <p className="text-green-700 font-semibold">Verified</p>
                    </div>
                  </div>
                )}

                {userDataForClient.phoneNumbers && userDataForClient.phoneNumbers.length > 0 && (
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200 hover:border-purple-300 transition-colors">
                    <h3 className="text-xs font-bold text-purple-900 uppercase tracking-wide mb-2">Phone Number</h3>
                    <p className="text-gray-900 font-medium">{userDataForClient.phoneNumbers[0].phoneNumber}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions Section */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Calendar size={24} className="text-blue-600" />
                Quick Actions
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link href="/search" className="group">
                  <button className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold py-4 px-6 rounded-2xl hover:shadow-lg hover:from-blue-700 hover:to-blue-800 transition-all active:scale-95">
                    <MapPin size={20} />
                    Find Hospitals
                  </button>
                </Link>
                
                <Link href="/book" className="group">
                  <button className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-semibold py-4 px-6 rounded-2xl hover:shadow-lg hover:from-indigo-700 hover:to-indigo-800 transition-all active:scale-95">
                    <Clock size={20} />
                    Book Appointment
                  </button>
                </Link>
                
                <button className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold py-4 px-6 rounded-2xl hover:shadow-lg hover:from-red-600 hover:to-red-700 transition-all active:scale-95">
                  <Heart size={20} />
                  Saved Hospitals
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent mb-8"></div>

            {/* Sign Out Section */}
            <div className="flex flex-col sm:flex-row gap-3">
              <SignOutButton redirectUrl="/">
                <button className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white font-semibold py-4 px-6 rounded-2xl hover:bg-red-700 hover:shadow-lg transition-all active:scale-95">
                  <LogOut size={20} />
                  Sign Out
                </button>
              </SignOutButton>
              
              <Link href="/" className="flex-1">
                <button className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-800 font-semibold py-4 px-6 rounded-2xl hover:bg-gray-200 hover:shadow-lg transition-all active:scale-95">
                  Back to Home
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Helpful Tips Section */}
        <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 border border-blue-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
            <span>💡</span>
            Quick Tips
          </h3>
          <ul className="text-blue-800 text-sm space-y-2.5 grid md:grid-cols-2 gap-3">
            <li className="flex items-start gap-3">
              <span className="text-blue-600 font-bold mt-0.5">•</span>
              <span>Search and compare hospitals near you with ease</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-600 font-bold mt-0.5">•</span>
              <span>Save your favorite hospitals for quick access</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-600 font-bold mt-0.5">•</span>
              <span>Book appointments and manage your health</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-600 font-bold mt-0.5">•</span>
              <span>Your data is secure and fully encrypted</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
