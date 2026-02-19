import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LogOut, ArrowLeft } from "lucide-react";

export default async function ProfilePage() {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto pt-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4">
            <ArrowLeft size={18} />
            <span>Back to home</span>
          </Link>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 h-32"></div>

          {/* Profile Content */}
          <div className="px-8 pb-8">
            {/* Avatar and Name */}
            <div className="flex items-end gap-6 -mt-16 mb-6">
              {user.imageUrl && (
                <img
                  src={user.imageUrl}
                  alt={user.fullName || "User"}
                  className="w-24 h-24 rounded-full border-4 border-white shadow-lg bg-gray-200"
                />
              )}
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{user.fullName}</h1>
                <p className="text-gray-600">{user.primaryEmailAddress?.emailAddress}</p>
              </div>
            </div>

            {/* User Info */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-600 uppercase mb-2">Email</h3>
                <p className="text-gray-900">{user.primaryEmailAddress?.emailAddress}</p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-600 uppercase mb-2">User ID</h3>
                <p className="text-gray-900 font-mono text-sm break-all">{user.id}</p>
              </div>

              {user.primaryEmailAddress?.verification?.status === "verified" && (
                <div className="border border-green-200 bg-green-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-green-700 uppercase mb-2">Email Status</h3>
                  <p className="text-green-700">✓ Verified</p>
                </div>
              )}

              {user.phoneNumbers && user.phoneNumbers.length > 0 && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-600 uppercase mb-2">Phone</h3>
                  <p className="text-gray-900">{user.phoneNumbers[0].phoneNumber}</p>
                </div>
              )}
            </div>

            {/* Logout Button */}
            <div className="mt-8 flex gap-4">
              <Link href="/api/auth/sign-out">
                <button className="flex items-center justify-center gap-2 bg-red-600 text-white font-medium py-2 px-6 rounded-lg hover:bg-red-700 transition">
                  <LogOut size={18} />
                  Sign Out
                </button>
              </Link>
              <Link href="/">
                <button className="flex items-center justify-center gap-2 bg-gray-200 text-gray-800 font-medium py-2 px-6 rounded-lg hover:bg-gray-300 transition">
                  Back to Home
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">About Your Profile</h3>
          <ul className="text-blue-800 text-sm space-y-1">
            <li>• Your profile is securely managed by Clerk</li>
            <li>• You can update your information in your Clerk account settings</li>
            <li>• Your email address is verified and encrypted</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
