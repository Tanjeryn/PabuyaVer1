'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  SlidersHorizontal,
  Home,
  Search as SearchIcon,
  PlusCircle,
  Mail,
  User
} from 'lucide-react';

const SUPABASE_URL = 'https://yvbfmtomudcxdwgouqyf.supabase.co';
const SUPABASE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2YmZtdG9tdWRjeGR3Z291cXlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIzMTMxMDIsImV4cCI6MjEwNzg4OTEwMn0.lUTIQl25hjL28wGND4izzz-SLLGlGo-OnF0UWAh3OfE';

// starter campaigns with baseline spent so progress bars show activity right away
const DEFAULT_CAMPAIGNS = [
  {
    id: 1,
    brand: 'KAPE TAYO',
    tag: 'Kape Tayo',
    title: 'Show us your cozy café moment',
    reward: '₱50 / 1K views',
    ratePer1k: 50,
    budgetNum: 5000,
    baseSpent: 450,
    payoutCap: 1500,
    funded: '₱5,000',
    remaining: '₱4,550',
    capText: '₱1,500 cap',
    format: 'Reel • 15-30s',
    tags: ['UGC', 'Food'],
    imageColor: 'bg-amber-900',
    coverImage: ''
  },
  {
    id: 2,
    brand: 'PODCAST NI MELAI',
    tag: 'Podcast ni Melai',
    title: 'Clip our funniest interview moments',
    reward: '₱80 / 1K views',
    ratePer1k: 80,
    budgetNum: 10000,
    baseSpent: 800,
    payoutCap: 3000,
    funded: '₱10,000',
    remaining: '₱9,200',
    capText: '₱3,000 cap',
    format: 'Reel/TikTok • 30-60s',
    tags: ['Clipping', 'Entertainment'],
    imageColor: 'bg-[#1F5430]',
    coverImage: ''
  },
  {
    id: 3,
    brand: "LOLA NENA'S",
    tag: "Lola Nena's",
    title: 'Cheese doughnut taste test',
    reward: '₱60 / 1K views',
    ratePer1k: 60,
    budgetNum: 8000,
    baseSpent: 0,
    payoutCap: 2000,
    funded: '₱8,000',
    remaining: '₱8,000',
    capText: '₱2,000 cap',
    format: 'Video • 15s+',
    tags: ['UGC', 'Food'],
    imageColor: 'bg-orange-800',
    coverImage: ''
  }
];

const FILTER_PILLS = ['All', 'UGC', 'Clipping', 'Food', 'Entertainment'] as const;

export default function MarketplaceFeed() {
  const [campaigns, setCampaigns] = useState<any[]>(DEFAULT_CAMPAIGNS);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'match' | 'rate' | 'budget'>('match');

  const parseViewsToNumber = (viewsStr: string): number => {
    if (!viewsStr) return 0;
    const clean = viewsStr.toString().trim().toUpperCase();
    if (clean.endsWith('M')) return parseFloat(clean.replace('M', '')) * 1000000;
    if (clean.endsWith('K')) return parseFloat(clean.replace('K', '')) * 1000;
    return parseFloat(clean) || 0;
  };

  const belongsToCampaign = (sub: any, camp: any) => {
    const plat = sub.platform || '';
    if (plat.includes(`[ID:${camp.id}]`)) return true;
    if (camp.tag && plat.includes(camp.tag)) return true;
    if (camp.title && plat.includes(camp.title)) return true;
    if (camp.id === 2) return plat.includes('Podcast ni Melai');
    if (camp.id === 3) return plat.includes("Lola Nena's");
    if (camp.id === 1) {
      return (
        plat.includes('Kape Tayo') ||
        (!plat.includes('Podcast ni Melai') &&
          !plat.includes("Lola Nena's") &&
          !plat.includes('[ID:'))
      );
    }
    return false;
  };

  // calculate live budget progress for the bottom rim bar
  const getBudgetProgress = (camp: any) => {
    const total = Number(camp.budgetNum) || 5000;
    const rate = Number(camp.ratePer1k) || 50;
    const cap = camp.payoutCap ? Number(camp.payoutCap) : 0;

    const approvedSubs = submissions.filter(
      (s) => s.status === 'Approved & Tracking' && belongsToCampaign(s, camp)
    );

    const dynamicClaimed = approvedSubs.reduce((sum, s) => {
      const views = parseViewsToNumber(s.views);
      let gross = Math.floor(views / 1000) * rate;
      if (cap > 0 && gross > cap) gross = cap;
      return sum + gross;
    }, 0);

    const totalClaimed = Math.min(total, (Number(camp.baseSpent) || 0) + dynamicClaimed);
    const remaining = Math.max(0, total - totalClaimed);
    const percentUsed = Math.min(100, Math.round((totalClaimed / total) * 100));

    return { total, remaining, percentUsed };
  };

  // load custom campaigns + pull supabase submissions so banner status bars reflect real approvals
  useEffect(() => {
    try {
      const savedCustom = localStorage.getItem('pabuya_custom_campaigns');
      const customList = savedCustom ? JSON.parse(savedCustom) : [];

      const savedEdited = localStorage.getItem('pabuya_edited_defaults');
      const editedMap = savedEdited ? JSON.parse(savedEdited) : {};

      const savedDeleted = localStorage.getItem('pabuya_deleted_ids');
      const deletedIds: number[] = savedDeleted ? JSON.parse(savedDeleted) : [];

      const mergedDefaults = DEFAULT_CAMPAIGNS.map((def) =>
        editedMap[def.id] ? { ...def, ...editedMap[def.id] } : def
      );

      const all = [...customList, ...mergedDefaults].filter(
        (c) => !deletedIds.includes(Number(c.id))
      );
      setCampaigns(all);
    } catch (e) {
      console.error('Failed to load custom campaigns:', e);
    }

    const fetchSubmissions = async () => {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/rest/v1/submissions?select=*&order=id.desc`,
          {
            cache: 'no-store',
            headers: {
              apikey: SUPABASE_KEY,
              Authorization: `Bearer ${SUPABASE_KEY}`
            }
          }
        );
        if (res.ok) {
          const data = await res.json();
          setSubmissions(data);
        }
      } catch (err) {
        console.error('Error loading submissions for budget bar:', err);
      }
    };

    fetchSubmissions();
  }, []);

  // allow pc scrollwheel to scroll the filter pills left and right without a scrollbar
  const handleWheelScroll = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.deltaY !== 0) {
      e.currentTarget.scrollLeft += e.deltaY;
    }
  };

  // filter by search text and selected tag pill
  const filteredCampaigns = campaigns
    .filter((c) => {
      const campTags: string[] = Array.isArray(c.tags)
        ? c.tags
        : c.category
          ? [c.category]
          : [];

      const q = searchQuery.toLowerCase();
      const matchesSearch =
        c.title.toLowerCase().includes(q) ||
        c.brand.toLowerCase().includes(q) ||
        campTags.some((t) => t.toLowerCase().includes(q));

      if (!matchesSearch) return false;
      if (activeFilter === 'All') return true;

      return campTags.some((t) => t.toLowerCase() === activeFilter.toLowerCase());
    })
    .sort((a, b) => {
      if (sortBy === 'rate') return (b.ratePer1k || 0) - (a.ratePer1k || 0);
      if (sortBy === 'budget') return (b.budgetNum || 0) - (a.budgetNum || 0);
      return 0;
    });

  const cycleSort = () => {
    if (sortBy === 'match') setSortBy('rate');
    else if (sortBy === 'rate') setSortBy('budget');
    else setSortBy('match');
  };

  return (
    <div className="w-full max-w-[448px] mx-auto h-screen bg-gray-50 flex flex-col font-sans relative overflow-hidden shadow-2xl">
      {/* hide both horizontal and vertical scrollbars on the pabuyas tab */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      <div className="px-5 pt-12 pb-4 bg-white">
        <div className="mb-4">
          <h1 className="text-xl font-bold text-gray-900">Explore Pabuyas</h1>
          <p className="text-sm text-gray-500">Earn by creating & clipping short-form videos</p>
        </div>

        <div className="flex gap-2 mb-4">
          <div className="flex-1 flex items-center bg-gray-100 rounded-full px-4 py-2.5">
            <SearchIcon className="w-5 h-5 text-gray-400 mr-2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Pabuyas or tags"
              className="bg-transparent border-none outline-none w-full text-gray-700 placeholder-gray-500 text-sm"
            />
          </div>
          <button
            type="button"
            onClick={cycleSort}
            title="Change sort order"
            className="p-2.5 bg-green-700 rounded-full flex items-center justify-center active:scale-95 transition-transform"
          >
            <SlidersHorizontal className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* tag filter pills with hidden scrollbar + pc wheel scroll */}
        <div
          onWheel={handleWheelScroll}
          className="no-scrollbar flex gap-2 overflow-x-auto pb-1"
        >
          {FILTER_PILLS.map((pill) => (
            <button
              key={pill}
              type="button"
              onClick={() => setActiveFilter(pill)}
              className={`flex items-center whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeFilter === pill
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {pill}
            </button>
          ))}
        </div>
      </div>

      {/* main feed list with vertical scrollbar hidden */}
      <div className="no-scrollbar flex-1 overflow-y-auto px-5 pb-28">
        <div className="flex justify-between items-center py-4">
          <span className="text-sm text-gray-500">
            {filteredCampaigns.length} open Pabuyas
          </span>
          <button
            type="button"
            onClick={cycleSort}
            className="text-sm font-medium text-green-700"
          >
            {sortBy === 'match'
              ? 'Best match'
              : sortBy === 'rate'
                ? 'Highest rate'
                : 'Highest budget'}
          </button>
        </div>

        {/* decluttered 16:9 cards: clean top badges, unboxed bottom text, and flush bottom-edge progress bar */}
        <div className="flex flex-col gap-4">
          {filteredCampaigns.map((campaign) => {
            const campTags: string[] = Array.isArray(campaign.tags)
              ? campaign.tags
              : campaign.category
                ? [campaign.category]
                : ['UGC'];

            const { total, remaining, percentUsed } = getBudgetProgress(campaign);

            return (
              <Link
                href={`/campaign?id=${campaign.id}`}
                key={campaign.id}
                className={`relative w-full aspect-[16/9] rounded-2xl overflow-hidden shadow-sm border border-gray-200/60 flex flex-col justify-between p-4 pb-3.5 group ${
                  campaign.imageColor || 'bg-[#1F5430]'
                }`}
              >
                {campaign.coverImage && (
                  <img
                    src={campaign.coverImage}
                    alt={campaign.title}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                )}

                {/* smooth bottom-weighted gradient so the center/top of the photo stays clear */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/15" />

                {/* top row: single tag pill on left, high-contrast rate pill on right */}
                <div className="relative z-10 flex justify-between items-center gap-2">
                  <span className="bg-black/45 backdrop-blur-md text-white/95 text-[10px] font-bold px-2.5 py-1 rounded-full border border-white/15">
                    {campTags.join(' • ')}
                  </span>
                  <span className="bg-amber-400 text-gray-950 text-xs font-extrabold px-3 py-1 rounded-full shadow-xs">
                    ₱{campaign.ratePer1k || 50} / 1K views
                  </span>
                </div>

                {/* bottom row: clean unboxed typography */}
                <div className="relative z-10">
                  <p className="text-emerald-300 text-[10px] font-extrabold uppercase tracking-wider mb-0.5 drop-shadow-xs">
                    {campaign.brand}
                  </p>
                  <h3 className="font-extrabold text-white text-base leading-snug mb-1.5 drop-shadow-xs line-clamp-1">
                    {campaign.title}
                  </h3>

                  <div className="flex items-center justify-between text-[11px] font-medium text-white/85">
                    <span>
                      <strong className="text-emerald-300 font-bold">
                        ₱{remaining.toLocaleString()}
                      </strong>{' '}
                      left of ₱{total.toLocaleString()}
                    </span>
                    <span className="text-white/75">
                      {campaign.capText || 'Uncapped'} · {percentUsed}%
                    </span>
                  </div>
                </div>

                {/* flush edge-to-edge budget bar along the very bottom rim */}
                <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/20 z-10">
                  <div
                    className="h-full bg-emerald-400 transition-all duration-500"
                    style={{ width: `${Math.max(percentUsed, 4)}%` }}
                  />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* bottom nav */}
      <div className="absolute bottom-0 w-full bg-white border-t border-gray-100 px-6 py-3 flex justify-between items-center pb-8 z-20">
        <Link href="/home" className="flex flex-col items-center text-gray-400">
          <Home className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-medium">Home</span>
        </Link>
        <button type="button" className="flex flex-col items-center text-green-700">
          <SearchIcon className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-bold">Pabuyas</span>
        </button>
        <Link href="/create" className="flex flex-col items-center text-gray-400">
          <PlusCircle className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-medium">Create</span>
        </Link>
        <Link href="/home" className="flex flex-col items-center text-gray-400">
          <Mail className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-medium">Earnings</span>
        </Link>
        <Link href="/home" className="flex flex-col items-center text-gray-400">
          <User className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-medium">Profile</span>
        </Link>
      </div>
    </div>
  );
}