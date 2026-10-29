import React from 'react';
import { ChevronLeft, Bookmark, Video, AtSign, Calendar, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function CampaignDetails() {
  return (
    <div className="max-w-md mx-auto h-screen bg-gray-50 flex flex-col font-sans relative overflow-hidden shadow-2xl slide-in-right">
      
      {/* absolute positioned navbar so it floats over the hero image */}
      <div className="absolute top-0 w-full z-10 px-5 pt-12 pb-4 flex justify-between items-center bg-gradient-to-b from-black/50 to-transparent">
        <Link href="/" className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <span className="text-white font-medium text-sm">Pabuya details</span>
        <button className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white">
          <Bookmark className="w-5 h-5" />
        </button>
      </div>

      {/* wrapping the hero and content together so the 9:16 image doesn't lock the whole screen height */}
      <div className="flex-1 overflow-y-auto bg-white pb-28">
        
        {/* swapped the fixed height for full width + 9:16 aspect ratio so it scales perfectly */}
        <div className="w-full aspect-[9/16] bg-amber-800 relative shrink-0 object-cover">
          <div className="absolute top-28 left-5 bg-white/90 backdrop-blur-sm text-green-700 text-xs font-bold px-3 py-1 rounded-full">
            8 slots left
          </div>
          <div className="absolute top-28 right-5 bg-white/90 backdrop-blur-sm text-gray-700 text-xs font-medium px-3 py-1 rounded-full flex items-center">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
            0.8 km
          </div>
          <div className="absolute bottom-5 left-5 right-5">
            <p className="text-white/80 text-xs font-bold uppercase tracking-wider mb-1">KAPE TAYO • DILIMAN</p>
            <h1 className="text-3xl font-bold text-white leading-tight">Show us your cozy café moment</h1>
          </div>
        </div>

        <div className="px-5 py-6">
          <div className="bg-orange-50 rounded-xl p-4 flex justify-between items-center mb-6">
            <div>
              <p className="text-xs text-gray-500 font-medium mb-1 uppercase tracking-wider">Reward Rate</p>
              <p className="text-sm font-bold text-gray-900">₱50 / 1K views</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 font-medium mb-1">Payout cap</p>
              <p className="text-sm font-bold text-gray-900">₱1,500</p>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-bold text-gray-900 mb-2">The brief</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Share an honest video of your Kape Tayo visit. Show the drink, first sip, and cozy vibe—natural lang.
            </p>
          </div>

          <div className="mb-8">
            <h3 className="font-bold text-gray-900 mb-4">Deliverables</h3>
            
            <div className="flex gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                <Video className="w-4 h-4 text-green-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">1 vertical short-form video</p>
                <p className="text-xs text-gray-500">15–30 seconds • Instagram or TikTok</p>
              </div>
            </div>

            <div className="flex gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                <AtSign className="w-4 h-4 text-green-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Tag @kapetayo.ph</p>
                <p className="text-xs text-gray-500">Include #KapeTayoPabuya and location</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4 text-green-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Post by October 12</p>
                <p className="text-xs text-gray-500">Views tracked for 14 days after posting</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 rounded-xl p-3 flex items-start gap-3 border border-green-100">
            <CheckCircle2 className="w-5 h-5 text-green-700 shrink-0 mt-0.5" />
            <p className="text-sm text-green-800 font-medium">You're eligible: 18+, Metro Manila, 500+ local followers.</p>
          </div>

        </div>
      </div>

      <div className="absolute bottom-0 w-full bg-white border-t border-gray-100 px-5 py-4 pb-8">
        <Link href="/submit" className="w-full bg-green-700 text-white font-medium py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-sm">
          <span className="text-xl leading-none mb-1">✨</span> Apply & create
        </Link>
        <p className="text-center text-xs text-gray-500 mt-3">No exclusivity • Free to join</p>
      </div>

    </div>
  );
}