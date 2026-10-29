'use client';
import React from 'react';
import Link from 'next/link';
import { Map as MapIcon, SlidersHorizontal, Navigation, Home, Search as SearchIcon, PlusCircle, Mail, User } from 'lucide-react';

export default function MarketplaceFeed() {
  // hardcoded campaigns just to show the feed works for the demo
  const campaigns = [
    {
      id: 1,
      brand: "KAPE TAYO",
      distance: "0.8 km",
      title: "Show us your cozy café moment",
      reward: "₱50 per 1K views",
      slots: 8,
      format: "Reel • 15-30s",
      imageColor: "bg-amber-800" 
    },
    {
      id: 2,
      brand: "HABI LOCAL",
      distance: "1.6 km",
      title: "Style a handwoven everyday bag",
      reward: "₱80 per 1K views",
      slots: 3,
      format: "Reel • 20-45s",
      imageColor: "bg-stone-500" 
    },
    {
      id: 3,
      brand: "LOLA NENA'S",
      distance: "2.4 km",
      title: "Cheese doughnut taste test",
      reward: "₱60 per 1K views",
      slots: 12,
      format: "Video • 15s+",
      imageColor: "bg-orange-300" 
    }
  ];

  return (
    <div className="max-w-md mx-auto h-screen bg-gray-50 flex flex-col font-sans relative overflow-hidden shadow-2xl">
      
      <div className="px-5 pt-12 pb-4 bg-white">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Pabuyas near you</h1>
            <p className="text-sm text-gray-500">Earn by sharing local finds</p>
          </div>
          <button className="p-2 bg-gray-100 rounded-full">
            <MapIcon className="w-5 h-5 text-gray-700" />
          </button>
        </div>

        <div className="flex gap-2 mb-4">
          <div className="flex-1 flex items-center bg-gray-100 rounded-full px-4 py-2.5">
            <SearchIcon className="w-5 h-5 text-gray-400 mr-2" />
            <input 
              type="text" 
              placeholder="Search" 
              className="bg-transparent border-none outline-none w-full text-gray-700 placeholder-gray-500"
            />
          </div>
          <button className="p-2.5 bg-green-700 rounded-full flex items-center justify-center">
            <SlidersHorizontal className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* filter pills - hiding the scrollbar so it looks cleaner on mobile */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button className="flex items-center whitespace-nowrap bg-green-50 text-green-700 px-4 py-1.5 rounded-full text-sm font-medium border border-green-200">
            <Navigation className="w-3.5 h-3.5 mr-1.5" /> Nearest
          </button>
          <button className="flex items-center whitespace-nowrap bg-gray-100 text-gray-600 px-4 py-1.5 rounded-full text-sm font-medium">
            Food
          </button>
          <button className="flex items-center whitespace-nowrap bg-gray-100 text-gray-600 px-4 py-1.5 rounded-full text-sm font-medium">
            ₱50+/1K
          </button>
          <button className="flex items-center whitespace-nowrap bg-gray-100 text-gray-600 px-4 py-1.5 rounded-full text-sm font-medium">
            Open
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-24">
        <div className="flex justify-between items-center py-4">
          <span className="text-sm text-gray-500">24 open Pabuyas within 5 km</span>
          <span className="text-sm font-medium text-green-700">Best match</span>
        </div>

        <div className="flex flex-col gap-4">
          {campaigns.map((campaign) => (
            <Link className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex gap-4" href="/campaign" key={campaign.id}>
              
              {/* forced 9:16 ratio so it looks like tiktok thumbnails instead of weird squares */}
              <div className={`w-[90px] aspect-[9/16] rounded-xl shrink-0 object-cover ${campaign.imageColor}`}></div>
              
              <div className="flex flex-col justify-between flex-1 py-1">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-green-700 uppercase tracking-wider">{campaign.brand}</span>
                    <span className="text-xs text-gray-400">{campaign.distance}</span>
                  </div>
                  <h3 className="font-bold text-gray-900 leading-tight text-sm mb-2">{campaign.title}</h3>
                  <div className="flex items-center text-xs font-medium text-gray-700 mb-2">
                    <span className="bg-yellow-100 text-yellow-800 rounded-full w-4 h-4 flex items-center justify-center mr-1.5 text-[10px]">₱</span>
                    {campaign.reward}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="bg-green-50 text-green-700 text-xs font-medium px-2 py-0.5 rounded-full">
                    {campaign.slots} slots
                  </span>
                  <span className="text-xs text-gray-500">{campaign.format}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="absolute bottom-0 w-full bg-white border-t border-gray-100 px-6 py-3 flex justify-between items-center pb-8">
        <Link href="/home" className="flex flex-col items-center text-gray-400">
          <Home className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-medium">Home</span>
        </Link>
        <button className="flex flex-col items-center text-green-700">
          <SearchIcon className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-bold">Pabuyas</span>
        </button>
        <button className="flex flex-col items-center text-gray-400">
          <PlusCircle className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-medium">Create</span>
        </button>
        <button className="flex flex-col items-center text-gray-400">
          <Mail className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-medium">Earnings</span>
        </button>
        <button className="flex flex-col items-center text-gray-400">
          <User className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-medium">Profile</span>
        </button>
      </div>
      
    </div>
  );
}