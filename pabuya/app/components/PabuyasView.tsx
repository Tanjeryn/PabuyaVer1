'use client';
import React, { useState } from 'react';
import { Search, Map as MapIcon, SlidersHorizontal, ChevronLeft, CheckCircle2, Loader2, Check, AlertCircle, Image as ImageIcon, Lock } from 'lucide-react';

// ==========================================
// 1. MOCK DATABASE (Matches your Figma exactly)
// ==========================================
const CAMPAIGNS = [
  { 
    id: 1, 
    brand: 'KAPE TAYO', 
    distance: '0.8 km', 
    title: 'Clip 15s TikTok reels from our live stream', 
    rate: 50, 
    budgetLeft: 17500,
    progressPercent: 65,
    tags: ['Clipping', 'TikTok', '15-30s'], 
    cap: 5000, 
    brief: 'Turn our live stream into short-form clips for TikTok and YouTube Shorts. We pay only for real views, so make it engaging!' 
  },
  { 
    id: 2, 
    brand: 'HABI LOCAL', 
    distance: '1.6 km', 
    title: 'Promote woven bags to local shoppers', 
    rate: 80, 
    budgetLeft: 35000,
    progressPercent: 12,
    tags: ['Local', 'Reels', '20-45s'], 
    cap: 2000, 
    brief: 'Showcase our locally sourced woven bags to the community.' 
  },
  { 
    id: 3, 
    brand: "LOLA NENA'S", 
    distance: '2.4 km', 
    title: 'Clip short taste-test clips for TikTok', 
    rate: 80, 
    budgetLeft: 4200,
    progressPercent: 88,
    tags: ['Clipping', 'TikTok', '15s+'], 
    cap: 3000, 
    brief: 'Post a taste test of our classic donuts and tag our main account.' 
  }
];

export default function PabuyasView() {
  // Navigation & UI States
  const [viewState, setViewState] = useState<'feed' | 'detail' | 'submit' | 'checking' | 'success' | 'error_time' | 'error_dup'>('feed');
  const [activeCampaign, setActiveCampaign] = useState(CAMPAIGNS[0]);
  
  // Submission Form State
  const [subName, setSubName] = useState('');
  const [videoLink, setVideoLink] = useState('');
  
  // Developer Presentation Tools (To show the panel the error logic)
  const [forceError, setForceError] = useState<'none' | 'time' | 'dup'>('none');

  // The Submission Handler (Simulating the FastAPI API call)
  const handleSubmit = () => {
    setViewState('checking');
    
    // Simulate the 1.5s - 2.5s yt-dlp scraping delay
    setTimeout(() => {
      if (forceError === 'time') setViewState('error_time');
      else if (forceError === 'dup') setViewState('error_dup');
      else setViewState('success');
    }, 2000);
  };

  const resetForm = () => {
    setSubName('');
    setVideoLink('');
    setViewState('feed');
  };

  return (
    <div className="bg-[#F7F7F2] min-h-screen pb-24 font-sans relative overflow-hidden">
      
      {/* ==========================================
          STATE 1: THE DISCOVERY FEED
          ========================================== */}
      {viewState === 'feed' && (
        <div className="p-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-2xl font-bold text-gray-900">Performance bounties</h1>
            <button className="p-2 bg-white rounded-full border border-gray-200 shadow-sm">
              <MapIcon className="w-5 h-5 text-gray-700" />
            </button>
          </div>
          <p className="text-sm text-gray-500 mb-4">Earn from clippers and local reach with view-based payouts</p>
          
          {/* Search Bar */}
          <div className="flex gap-2 mb-4">
            <div className="flex-1 bg-white rounded-2xl border border-[#ECECE6] px-4 py-3 flex items-center shadow-sm">
              <Search className="w-4 h-4 text-gray-400 mr-2" />
              <input type="text" placeholder="Search" className="bg-transparent outline-none w-full text-sm font-medium placeholder-gray-400" />
            </div>
            <button className="bg-[#2E6F40] p-3 rounded-2xl text-white shadow-md">
              <SlidersHorizontal className="w-5 h-5" />
            </button>
          </div>

          {/* Filter Pills */}
          <div className="flex gap-2 overflow-x-auto mb-6 scrollbar-hide pb-1">
            <span className="px-4 py-1.5 bg-[#E4F3E8] text-[#1E6032] font-semibold text-sm rounded-full whitespace-nowrap border border-green-200">All bounties</span>
            <span className="px-4 py-1.5 bg-white border border-[#ECECE6] text-gray-600 font-medium text-sm rounded-full whitespace-nowrap">Clipping</span>
            <span className="px-4 py-1.5 bg-white border border-[#ECECE6] text-gray-600 font-medium text-sm rounded-full whitespace-nowrap">Local reach</span>
          </div>

          <div className="flex justify-between items-center mb-4 px-1">
            <span className="text-xs font-semibold text-gray-500">24 bounties with view-based payouts</span>
            <span className="text-xs font-semibold text-[#2E6F40]">Best match</span>
          </div>

          {/* Campaign Cards */}
          <div className="space-y-4">
            {CAMPAIGNS.map(camp => (
              <div 
                key={camp.id} 
                onClick={() => { setActiveCampaign(camp); setViewState('detail'); }} 
                className="bg-white p-4 rounded-[16px] border border-[#ECECE6] flex gap-4 cursor-pointer shadow-sm active:scale-[0.98] transition-transform"
              >
                <div className="w-20 h-20 bg-gray-100 rounded-xl shrink-0 flex items-center justify-center border border-gray-100">
                  <ImageIcon className="w-8 h-8 text-gray-300" />
                </div>
                <div className="flex flex-col justify-center w-full">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold text-[#2E6F40] uppercase tracking-wider">{camp.brand}</span>
                    <span className="text-[10px] font-medium text-gray-400">{camp.distance}</span>
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 leading-tight mb-2">{camp.title}</h3>
                  <div className="flex items-center text-xs text-gray-600 mb-3">
                    <span className="font-bold text-gray-900">₱{camp.rate}</span>&nbsp;per 1K views
                  </div>
                  
                  {/* The New Progress & Budget Pill Row */}
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                       <span className="text-[10px] font-bold bg-[#E4F3E8] text-[#1E6032] px-2.5 py-1 rounded-full">
                         ₱{camp.budgetLeft.toLocaleString()} left
                       </span>
                       <span className="text-[10px] font-medium text-gray-400">{camp.progressPercent}% done</span>
                    </div>
                    <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-[#2E6F40] h-full rounded-full" style={{ width: `${camp.progressPercent}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==========================================
          STATE 2: CAMPAIGN BRIEF
          ========================================== */}
      {viewState === 'detail' && (
        <div className="bg-white min-h-screen animate-in slide-in-from-right-4 duration-300">
          <div className="relative h-56 bg-gray-100 flex items-center justify-center">
            <button onClick={() => setViewState('feed')} className="absolute top-4 left-4 bg-white p-2.5 rounded-full shadow-md">
              <ChevronLeft className="w-5 h-5 text-gray-700" />
            </button>
            <ImageIcon className="w-12 h-12 text-gray-300" />
            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-bold text-[#2E6F40] shadow-sm">
              7-Day Budget Lock
            </div>
          </div>
          
          <div className="p-5">
            <p className="text-[10px] font-bold text-gray-400 tracking-wider mb-2 uppercase">{activeCampaign.brand} • CLIPPING BOUNTY</p>
            <h1 className="text-2xl font-bold text-gray-900 mb-5 leading-tight">{activeCampaign.title}</h1>
            
            {/* Custom Payout Card */}
            <div className="bg-[#FDF4DC] border border-[#E8DDB8] p-4 rounded-xl flex justify-between items-center mb-6 shadow-sm">
              <div>
                <p className="text-[10px] font-bold text-[#9A6B13] mb-1 uppercase tracking-wider">View-Based Bounty</p>
                <p className="text-lg font-black text-gray-900">₱{activeCampaign.rate} <span className="text-sm font-semibold text-gray-600">/ 1K views</span></p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-semibold text-gray-500 mb-1">Payout cap</p>
                <p className="text-sm font-bold text-gray-900">₱{activeCampaign.cap.toLocaleString()}</p>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-6 leading-relaxed">{activeCampaign.brief}</p>
            
            <h3 className="font-bold text-gray-900 mb-3 text-sm">Requirements</h3>
            <ul className="text-sm text-gray-600 mb-6 space-y-2">
              <li className="flex items-start gap-2"><Check className="w-4 h-4 text-[#2E6F40] mt-0.5 shrink-0" /> Use #creatorname</li>
              <li className="flex items-start gap-2"><Check className="w-4 h-4 text-[#2E6F40] mt-0.5 shrink-0" /> Download raw assets from <span className="text-[#2E6F40] underline font-medium ml-1">Google Drive</span></li>
            </ul>

            <div className="bg-[#E4F3E8] border border-green-100 p-4 rounded-xl flex items-start gap-3 mb-24">
              <CheckCircle2 className="w-5 h-5 text-[#2E6F40] shrink-0 mt-0.5" />
              <p className="text-xs text-[#1E6032] font-medium leading-relaxed">You're eligible: 18+, Metro Manila, 500+ local followers.</p>
            </div>
          </div>

          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#ECECE6] p-4 pb-8 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
            <button onClick={() => setViewState('submit')} className="w-full bg-[#2E6F40] text-white font-bold py-4 rounded-xl text-sm shadow-md active:bg-[#1E6032] transition-colors">
              Submit clip
            </button>
            <p className="text-center text-[10px] font-medium text-gray-400 mt-3">No exclusivity • Free to join</p>
          </div>
        </div>
      )}

      {/* ==========================================
          STATE 3: SUBMISSION & VALIDATION
          ========================================== */}
      {['submit', 'checking', 'error_time', 'error_dup'].includes(viewState) && (
        <div className="bg-white min-h-screen animate-in slide-in-from-bottom-full duration-300">
          <div className="flex items-center p-4 border-b border-[#ECECE6]">
            <button onClick={() => setViewState('detail')} className="p-2"><ChevronLeft className="w-5 h-5 text-gray-700" /></button>
            <h1 className="text-sm font-bold text-gray-900 mx-auto pr-8">Submit clip</h1>
          </div>
          
          <div className="p-5">
            <label className="text-xs font-semibold text-gray-500 mb-2 block">Submission name</label>
            <input 
              type="text" 
              placeholder="Name your submission" 
              value={subName} 
              onChange={(e) => setSubName(e.target.value)} 
              className="w-full border-b border-[#ECECE6] pb-3 mb-8 outline-none text-sm font-bold text-gray-900 placeholder-gray-300 focus:border-[#2E6F40] transition-colors" 
              disabled={viewState === 'checking'}
            />
            
            <label className="text-xs font-semibold text-gray-500 mb-2 block">Video link</label>
            <input 
              type="text" 
              placeholder="Paste your TikTok or YouTube Shorts link" 
              value={videoLink} 
              onChange={(e) => setVideoLink(e.target.value)} 
              className="w-full border-b border-[#ECECE6] pb-3 outline-none text-sm text-gray-900 placeholder-gray-300 focus:border-[#2E6F40] transition-colors" 
              disabled={viewState === 'checking'}
            />

            {/* Error Messages Mapping (Identical to Figma constraints) */}
            {viewState === 'error_time' && (
              <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                <p className="text-xs text-red-700 font-medium leading-relaxed">Video is too old. It must be uploaded within the last 30 minutes to prove authenticity.</p>
              </div>
            )}
            
            {viewState === 'error_dup' && (
              <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                <p className="text-xs text-red-700 font-medium leading-relaxed">Duplicate Link Detected: This URL already exists in our database.</p>
              </div>
            )}
            
            {/* Developer Test Tools (Hidden from Real Users, Vital for Defense) */}
            {viewState === 'submit' && (
              <div className="mt-12 p-4 border border-dashed border-gray-300 rounded-xl bg-gray-50">
                <p className="text-[10px] font-black text-gray-500 mb-3 uppercase tracking-wider flex items-center gap-2">
                  <Lock className="w-3 h-3" /> Panel Defense Tools
                </p>
                <div className="flex flex-col gap-2">
                  <button onClick={() => setForceError('none')} className={`text-xs font-bold px-3 py-2 rounded-lg transition-colors ${forceError === 'none' ? 'bg-[#2E6F40] text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600'}`}>1. Simulate Happy Path</button>
                  <button onClick={() => setForceError('time')} className={`text-xs font-bold px-3 py-2 rounded-lg transition-colors ${forceError === 'time' ? 'bg-red-600 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600'}`}>2. Force 30m Timestamp Error</button>
                  <button onClick={() => setForceError('dup')} className={`text-xs font-bold px-3 py-2 rounded-lg transition-colors ${forceError === 'dup' ? 'bg-red-600 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600'}`}>3. Force Duplicate URL Error</button>
                </div>
              </div>
            )}
          </div>

          <div className="fixed bottom-0 left-0 right-0 p-4 pb-8 bg-white border-t border-[#ECECE6]">
            {viewState === 'submit' && (
              <button 
                onClick={handleSubmit} 
                disabled={!subName || !videoLink}
                className={`w-full py-4 rounded-xl font-bold text-sm transition-all ${subName && videoLink ? 'bg-[#2E6F40] text-white shadow-md' : 'bg-[#E4F3E8] text-[#2E6F40]/50'}`}>
                Verify & Submit
              </button>
            )}
            
            {viewState === 'checking' && (
              <button disabled className="w-full bg-[#F7F7F2] text-gray-500 font-bold py-4 rounded-xl text-sm flex justify-center items-center gap-2 border border-[#ECECE6]">
                <Loader2 className="w-4 h-4 animate-spin" /> Checking yt-dlp metadata...
              </button>
            )}

            {(viewState === 'error_time' || viewState === 'error_dup') && (
              <button onClick={() => setViewState('submit')} className="w-full bg-[#2E6F40] text-white font-bold py-4 rounded-xl text-sm shadow-md">
                Try Another Link
              </button>
            )}
          </div>
        </div>
      )}

      {/* ==========================================
          STATE 4: SUCCESS CONFETTI
          ========================================== */}
      {viewState === 'success' && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center p-6 animate-in zoom-in-95 duration-300">
          <div className="absolute top-4 left-4">
            <button onClick={() => setViewState('feed')} className="p-2"><ChevronLeft className="w-5 h-5 text-gray-700" /></button>
          </div>
          
          <div className="w-28 h-28 bg-[#2E6F40] rounded-full flex items-center justify-center mb-8 relative shadow-xl">
            <Check className="w-14 h-14 text-white" strokeWidth={3} />
            <div className="absolute inset-0 border-4 border-dashed border-[#FDF4DC] rounded-full animate-spin-slow scale-[1.3] opacity-60"></div>
          </div>
          
          <h2 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">Clip Verified!</h2>
          <p className="text-center text-sm text-gray-600 mb-12 max-w-[260px] leading-relaxed">
            View tracking has securely started. Earn <span className="font-bold text-gray-900">₱{activeCampaign.rate}</span> for every 1K validated views you pull.
          </p>
          
          <div className="w-full absolute bottom-8 px-5">
            <button onClick={() => setViewState('submit')} className="w-full bg-[#2E6F40] text-white font-bold py-4 rounded-xl text-sm shadow-md mb-3 active:bg-[#1E6032] transition-colors">
              Submit Another Link
            </button>
            <button onClick={resetForm} className="w-full text-gray-500 font-bold py-4 text-sm active:text-gray-900 transition-colors">
              Go to Dashboard
            </button>
          </div>
        </div>
      )}

    </div>
  );
}