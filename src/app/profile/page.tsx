import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LogOut, ArrowLeft, MapPin, Clock, Heart } from "lucide-react";
import { SignOutButton } from "@clerk/nextjs";

export default async function ProfilePage() {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const initials = user.fullName
    ?.split(" ")
    .map((name) => name[0])
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-100 p-4 pt-24">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition">
            <ArrowLeft size={18} />
            <span>Back to home</span>
          </Link>
        </div>

        {/* Main Profile Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 h-40"></div>

          {/* Profile Content */}
          <div className="px-8 pb-10">
            {/* Avatar and Name Section */}
            <div className="flex items-end gap-6 -mt-20 mb-8">
              {user.imageUrl ? (
                <img
                  src={user.imageUrl}
                  alt={user.fullName || "User"}
                  className="w-32 h-32 rounded-full border-4 border-white shadow-xl bg-gray-200 object-cover"
                />
              ) : (
                <div className="w-32 h-32 rounded-full border-4 border-white shadow-xl bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold">
                  {initials}
                </div>
              )}
              <div className="pb-2">
                <h1 className="text-4xl font-bold text-gray-900">{user.fullName || "User"}</h1>
                <p className="text-gray-600 text-lg">{user.primaryEmailAddress?.emailAddress}</p>
                <div className="mt-2 flex items-center gap-2">
                  {user.primaryEmailAddress?.verification?.status === "verified" && (
                    <span className="inline-flex items-center gap-1 text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
                      <span className="text-green-500">✓</span> Email Verified
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Stats Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 pt-6 border-t">
              <div className="text-center py-4">
                <div className="text-3xl font-bold text-blue-600">∞</div>
                <p className="text-gray-600 text-sm mt-1">Bookings</p>
              </div>
              <div className="text-center py-4">
                <div className="text-3xl font-bold text-indigo-600">0</div>
                <p className="text-gray-600 text-sm mt-1">Saved Hospitals</p>
              </div>
              <div className="text-center py-4">
                <div className="text-3xl font-bold text-purple-600">Member</div>
                <p className="text-gray-600 text-sm mt-1">Since Today</p>
              </div>
            </div>

            {/* Account Info Section */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Account Information</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                  <h3 className="text-sm font-semibold text-blue-900 uppercase mb-2">Email Address</h3>
                  <p className="text-gray-900 break-all">{user.primaryEmailAddress?.emailAddress}</p>
                </div>

                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-4 border border-indigo-200">
                  <h3 className="text-sm font-semibold text-indigo-900 uppercase mb-2">User ID</h3>
                  <p className="text-gray-900 font-mono text-xs break-all">{user.id}</p>
                </div>

                {user.primaryEmailAddress?.verification?.status === "verified" && (
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                    <h3 className="text-sm font-semibold text-green-900 uppercase mb-2">Email Status</h3>
                    <p className="text-green-700 font-semibold">✓ Verified</p>
                  </div>
                )}

                {user.phoneNumbers && user.phoneNumbers.length > 0 && (
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                    <h3 className="text-sm font-semibold text-purple-900 uppercase mb-2">Phone</h3>
                    <p className="text-gray-900">{user.phoneNumbers[0].phoneNumber}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link href="/search">
                  <button className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-medium py-3 px-4 rounded-lg hover:bg-blue-700 transition">
                    <MapPin size={18} />
                    Find Hospitals
                  </button>
                </Link>
                <Link href="/book">
                  <button className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-medium py-3 px-4 rounded-lg hover:bg-indigo-700 transition">
                    <Clock size={18} />
                    Book Appointment
                  </button>
                </Link>
                <button className="w-full flex items-center justify-center gap-2 bg-gray-200 text-gray-800 font-medium py-3 px-4 rounded-lg hover:bg-gray-300 transition">
                  <Heart size={18} />
                  Saved Hospitals
                </button>
              </div>
            </div>

            {/* Sign Out Section */}
            <div className="border-t pt-8 flex flex-col sm:flex-row gap-3">
              <SignOutButton redirectUrl="/">
                <button className="flex items-center justify-center gap-2 bg-red-600 text-white font-medium py-3 px-6 rounded-lg hover:bg-red-700 transition flex-1">
                  <LogOut size={18} />
                  Sign Out
                </button>
              </SignOutButton>
              <Link href="/" className="flex-1">
                <button className="w-full flex items-center justify-center gap-2 bg-gray-200 text-gray-800 font-medium py-3 px-6 rounded-lg hover:bg-gray-300 transition">
                  Back Home
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-6 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
          <h3 className="font-semibold text-blue-900 mb-3">💡 Tips</h3>
          <ul className="text-blue-800 text-sm space-y-2">
            <li>• Search and compare hospitals near you</li>
            <li>• Save your favorite hospitals for quick access</li>
            <li>• Book appointments and track your health</li>
            <li>• Your data is secure and encrypted</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
