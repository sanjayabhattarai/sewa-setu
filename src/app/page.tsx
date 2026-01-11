import { Navbar } from "@/components/navbar";
import { Search } from "lucide-react";
import Link from "next/link"; // <--- 1. Import this!

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <div className="relative overflow-hidden bg-white">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              Care for your parents, <br />
              <span className="text-blue-600">from miles away.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
              Book prepaid whole-body checkups at Nepal&apos;s top hospitals. 
              Ensure your money is used for health.
            </p>
            
            <div className="mt-10 flex items-center justify-center gap-x-6">
              {/* 2. Added the Link wrapper below */}
              <Link href="/search">
                <button className="flex items-center rounded-md bg-blue-600 px-8 py-4 text-lg font-semibold text-white hover:bg-blue-700">
                  <Search className="mr-2 h-5 w-5" />
                  Find a Hospital
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}