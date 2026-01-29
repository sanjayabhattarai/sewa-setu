import Link from "next/link";
import { Heart, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";

export function Footer() {
  return (
    <footer id="contact" className="bg-slate-900 text-slate-300 py-12 border-t border-slate-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          
          {/* Brand Column */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-white font-bold text-xl">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                <Heart className="h-4 w-4 text-white fill-white" />
              </div>
              <span>Sewa-Setu</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Bridging the distance between you and your family's health. 
              Book prepaid health checkups for your loved ones in Nepal.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-3 text-sm">
              <li><Link href="/search" className="hover:text-blue-400 transition-colors">Find a Hospital</Link></li>
              <li><Link href="#" className="hover:text-blue-400 transition-colors">How it Works</Link></li>
              <li><Link href="#" className="hover:text-blue-400 transition-colors">For Doctors</Link></li>
              <li><Link href="#" className="hover:text-blue-400 transition-colors">Login / Sign Up</Link></li>
            </ul>
          </div>

          {/* Legal / Company */}
          <div>
            <h3 className="text-white font-semibold mb-4">This is ivon shah</h3>
            <ul className="space-y-3 text-sm">
              <li><Link href="#" className="hover:text-blue-400 transition-colors">About Us</Link></li>
              <li><Link href="#" className="hover:text-blue-400 transition-colors">Contact Support</Link></li>
              <li><Link href="#" className="hover:text-blue-400 transition-colors">Privacy Policy</Link></li>
              <li><Link href="#" className="hover:text-blue-400 transition-colors">Terms of Service</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4">Contact</h3>
            <ul className="space-y-3 text-sm text-slate-400">
              <li>Kathmandu, Nepal</li>
              <li>support@sewa-setu.com</li>
              <li>+977 9800000000</li>
            </ul>
            <div className="flex gap-4 mt-6">
              <Facebook className="h-5 w-5 hover:text-white cursor-pointer" />
              <Twitter className="h-5 w-5 hover:text-white cursor-pointer" />
              <Instagram className="h-5 w-5 hover:text-white cursor-pointer" />
              <Linkedin className="h-5 w-5 hover:text-white cursor-pointer" />
            </div>
          </div>

        </div>
        
        <div className="mt-12 pt-8 border-t border-slate-800 text-center text-sm text-slate-500">
          © {new Date().getFullYear()} Sewa-Setu Health Pvt Ltd. All rights reserved.
        </div>
      </div>
    </footer>
  );
}