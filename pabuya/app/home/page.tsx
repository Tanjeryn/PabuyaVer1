'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Bell,
  Home,
  PlusCircle,
  Mail,
  User,
  Landmark,
  Eye,
  ChevronDown,
  ChevronUp,
  Search as SearchIcon,
  Trash2,
  Pencil
} from 'lucide-react';

const SUPABASE_URL = 'https://yvbfmtomudcxdwgouqyf.supabase.co';
const SUPABASE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2YmZtdG9tdWRjeGR3Z291cXlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIzMTMxMDIsImV4cCI6MjEwNzg4OTEwMn0.lUTIQl25hjL28wGND4izzz-SLLGlGo-OnF0UWAh3OfE';

// official pabuya hand-and-coin logo svg
function PabuyaLogo() {
  return (
    <svg
      viewBox="0 0 100 100"
      className="w-10 h-10 shrink-0 -ml-1"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Pabuya Logo"
    >
      {/* top knuckle ridge */}
      <path
        d="M36 24 L50 14 C53 12 56 12 59 15 L63 18 L36 24 Z"
        fill="#347B3F"
      />
      {/* main P hand silhouette */}
      <path
        d="M27 89 V40 C27 29 34 24 44 21 L57 18 C67 16 77 21 81 28 C82 30 80 32 77 32 C70 32 65 27 56 27 C46 27 40 34 40 43 C40 52 46 58 56 58 C65 58 70 53 77 53 C80 53 82 55 81 57 C77 65 66 70 53 70 H45 V89 H27 Z"
        fill="#347B3F"
      />
      {/* fingernail arcs */}
      <path
        d="M74 25 C73 28 75 30 78 31"
        stroke="#FFFFFF"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M74 60 C73 57 75 55 78 54"
        stroke="#FFFFFF"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      {/* gold coin pinched between fingers */}
      <circle
        cx="71"
        cy="42.5"
        r="9.5"
        fill="#D69E2E"
        stroke="#BD841B"
        strokeWidth="1.8"
      />
      <circle cx="71" cy="42.5" r="6.5" stroke="#EAB84B" strokeWidth="1" />
      <circle cx="71" cy="42.5" r="1" fill="#BD841B" />
    </svg>
  );
}

const DEFAULT_CAMPAIGNS = [
  {
    id: 1,
    brand: 'KAPE TAYO',
    tag: 'Kape Tayo',
    title: 'Show us your cozy café moment',
    reward: '₱50 per 1K views',
    ratePer1k: 50,
    budgetNum: 5000,
    baseSpent: 450,
    payoutCap: 1500,
    funded: '₱5,000',
    remaining: '₱4,550',
    imageColor: 'bg-amber-900',
    coverImage: ''
  },
  {
    id: 2,
    brand: 'PODCAST NI MELAI',
    tag: 'Podcast ni Melai',
    title: 'Clip our funniest interview moments',
    reward: '₱80 per 1K views',
    ratePer1k: 80,
    budgetNum: 10000,
    baseSpent: 800,
    payoutCap: 3000,
    funded: '₱10,000',
    remaining: '₱9,200',
    imageColor: 'bg-[#1F5430]',
    coverImage: ''
  },
  {
    id: 3,
    brand: "LOLA NENA'S",
    tag: "Lola Nena's",
    title: 'Cheese doughnut taste test',
    reward: '₱60 per 1K views',
    ratePer1k: 60,
    budgetNum: 8000,
    baseSpent: 0,
    payoutCap: 2000,
    funded: '₱8,000',
    remaining: '₱8,000',
    imageColor: 'bg-orange-800',
    coverImage: ''
  }
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'submissions' | 'pabuyas'>('submissions');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [expandedCampaignId, setExpandedCampaignId] = useState<number | null>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>(DEFAULT_CAMPAIGNS);
  const [loading, setLoading] = useState(true);

  // convert formatted strings like 21.1M or 53.5K back into raw numbers for payout math
  const parseViewsToNumber = (viewsStr: string): number => {
    if (!viewsStr) return 0;
    const clean = viewsStr.toString().trim().toUpperCase();
    if (clean.endsWith('M')) {
      return parseFloat(clean.replace('M', '')) * 1000000;
    }
    if (clean.endsWith('K')) {
      return parseFloat(clean.replace('K', '')) * 1000;
    }
    return parseFloat(clean) || 0;
  };

  // match submission to its campaign using the tag inside platform string
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

  const findCampaignForSub = (sub: any, campList: any[]) => {
    return campList.find((c) => belongsToCampaign(sub, c)) || campList[0];
  };

  // compute gross, 10% platform fee, and net payout
  const calculatePayoutStrings = (sub: any, campList: any[]) => {
    const rawViews = parseViewsToNumber(sub.views);
    const matchedCamp = findCampaignForSub(sub, campList);
    const rate = matchedCamp?.ratePer1k || 50;
    let grossVal = Math.floor(rawViews / 1000) * rate;

    if (matchedCamp?.payoutCap && grossVal > matchedCamp.payoutCap) {
      grossVal = matchedCamp.payoutCap;
    }

    const deductionVal = grossVal * 0.1;
    const netVal = grossVal * 0.9;

    return {
      gross: `₱${grossVal.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}`,
      deduction: `-₱${deductionVal.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}`,
      net: `₱${netVal.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}`
    };
  };

  // live budget calculation for the status bar on each business campaign card
  const getCampaignBudgetStats = (camp: any) => {
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

    return { total, remaining, totalClaimed, percentUsed };
  };

  useEffect(() => {
    // switch to my pabuyas tab if redirected from create/edit flow
    const params = new URLSearchParams(window.location.search);
    if (params.get('tab') === 'pabuyas') {
      setActiveTab('pabuyas');
    }

    let combinedCampaigns = [...DEFAULT_CAMPAIGNS];
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

      combinedCampaigns = [...customList, ...mergedDefaults].filter(
        (c) => !deletedIds.includes(Number(c.id))
      );
      setCampaigns(combinedCampaigns);
    } catch (e) {
      console.error('Error loading custom campaigns in Home:', e);
    }

    const fetchFromSupabase = async () => {
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
          const fixedData = data.map((sub: any) => {
            if (
              sub.status === 'Approved & Tracking' &&
              (sub.gross === '₱0.00' || !sub.gross)
            ) {
              const math = calculatePayoutStrings(sub, combinedCampaigns);
              return { ...sub, ...math };
            }
            return sub;
          });
          setSubmissions(fixedData);
        }
      } catch (err) {
        console.error('Error loading from Supabase:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFromSupabase();
  }, []);

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const toggleCampaignExpand = (id: number) => {
    setExpandedCampaignId(expandedCampaignId === id ? null : id);
  };

  // update status and recalculate money when business owner clicks approve/reject
  const updateSubmissionStatus = async (id: number, newStatus: string) => {
    const targetSub = submissions.find((sub) => sub.id === id);
    if (!targetSub) return;

    const isApproved = newStatus === 'Approved & Tracking';
    const statusColor = isApproved
      ? 'text-green-700 bg-green-50'
      : 'text-red-700 bg-red-50';
    const reason = isApproved ? 'Milestones active.' : 'Rejected by business owner.';

    const moneyUpdate = isApproved
      ? calculatePayoutStrings(targetSub, campaigns)
      : { gross: '₱0.00', deduction: '-₱0.00', net: '₱0.00' };

    setSubmissions((prev) =>
      prev.map((sub) =>
        sub.id === id
          ? { ...sub, status: newStatus, statusColor, reason, ...moneyUpdate }
          : sub
      )
    );

    try {
      await fetch(`${SUPABASE_URL}/rest/v1/submissions?id=eq.${id}`, {
        method: 'PATCH',
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: newStatus,
          statusColor: statusColor,
          reason: reason,
          gross: moneyUpdate.gross,
          deduction: moneyUpdate.deduction,
          net: moneyUpdate.net
        })
      });
    } catch (err) {
      console.error('Failed to update status in Supabase:', err);
    }
  };

  const deleteSubmission = async (idToRemove: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedSubmissions = submissions.filter((sub) => sub.id !== idToRemove);
    setSubmissions(updatedSubmissions);

    try {
      await fetch(`${SUPABASE_URL}/rest/v1/submissions?id=eq.${idToRemove}`, {
        method: 'DELETE',
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`
        }
      });
    } catch (err) {
      console.error('Failed to delete from Supabase:', err);
    }
  };

  return (
    <div className="w-full max-w-[448px] mx-auto h-screen bg-gray-50 flex flex-col font-sans relative overflow-hidden shadow-2xl">
      <div className="px-5 pt-12 pb-4 bg-white">
        <div className="flex justify-between items-center mb-6">
          {/* official pabuya logo on top left */}
          <PabuyaLogo />

          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-green-700 flex items-center">
              <span className="w-2 h-2 rounded-full bg-green-500 mr-1.5" /> Active
            </span>
            <Bell className="w-5 h-5 text-gray-700" />
          </div>
        </div>

        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-gray-900">Active workspace</h2>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-orange-100 text-orange-800">
            {activeTab === 'submissions' ? 'Creator view' : 'Business view'}
          </span>
        </div>

        <div className="flex bg-gray-100 p-1 rounded-full mb-2">
          <button
            onClick={() => setActiveTab('submissions')}
            className={`flex-1 text-sm font-medium py-2 rounded-full transition-all ${
              activeTab === 'submissions'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500'
            }`}
          >
            My Submissions
          </button>
          <button
            onClick={() => setActiveTab('pabuyas')}
            className={`flex-1 text-sm font-medium py-2 rounded-full transition-all ${
              activeTab === 'pabuyas'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500'
            }`}
          >
            My Pabuyas
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pt-4 pb-28">
        {/* creator submissions tab */}
        {activeTab === 'submissions' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-900 text-lg">My active submissions</h3>
              {loading ? (
                <div className="h-4 w-16 bg-gray-200 rounded-full animate-pulse" />
              ) : (
                <span className="text-sm font-medium text-green-700">
                  {submissions.length} tracking
                </span>
              )}
            </div>

            <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex flex-col gap-2 min-h-[300px]">
              {loading ? (
                // pulsing skeleton rows while fetching submissions
                <div className="flex flex-col gap-2 py-1">
                  {[1, 2, 3, 4].map((n) => (
                    <div
                      key={n}
                      className="flex items-center gap-3 py-2.5 border-b border-gray-100 last:border-0 animate-pulse"
                    >
                      <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0" />
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="h-3.5 bg-gray-200 rounded-full w-3/5" />
                        <div className="h-2.5 bg-gray-100 rounded-full w-4/5" />
                      </div>
                      <div className="flex flex-col items-end shrink-0 space-y-2">
                        <div className="h-3 bg-gray-200 rounded-full w-14" />
                        <div className="h-4 bg-gray-100 rounded-full w-20" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : submissions.length > 0 ? (
                submissions.map((sub) => (
                  <div
                    key={sub.id}
                    className="border-b border-gray-100 last:border-0 pb-3 mb-1 last:mb-0 last:pb-0"
                  >
                    <div
                      onClick={() => toggleExpand(sub.id)}
                      className="flex items-center gap-3 cursor-pointer py-1"
                    >
                      <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                        <Landmark className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-gray-900 truncate">
                          {sub.title}
                        </h4>
                        <p className="text-xs text-gray-500 truncate flex items-center mt-0.5">
                          {(sub.platform || '').replace(/\[ID:\d+\]\s*/, '')}
                        </p>
                      </div>

                      <div className="flex flex-col items-end shrink-0">
                        <div className="flex items-center text-xs font-bold text-gray-900">
                          <Eye className="w-3.5 h-3.5 mr-1" /> {sub.views} views
                          {expandedId === sub.id ? (
                            <ChevronUp className="w-4 h-4 ml-1 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 ml-1 text-gray-400" />
                          )}
                        </div>
                        <div
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-full mt-1.5 ${sub.statusColor}`}
                        >
                          {sub.status}
                        </div>
                      </div>
                    </div>

                    {expandedId === sub.id && (
                      <div className="mt-3 bg-gray-50 rounded-xl p-4 animate-in slide-in-from-top-2 fade-in duration-200">
                        <div className="mb-4">
                          <p className="text-[11px] text-gray-500 mb-1">
                            Submitted: {sub.date}
                          </p>
                          <p className="text-[11px] font-bold text-gray-900 mb-0.5">
                            Status: {sub.status}
                          </p>
                          <p
                            className={`text-[11px] ${
                              sub.status === 'Rejected'
                                ? 'text-red-600 font-bold'
                                : 'text-gray-500'
                            }`}
                          >
                            Status reason: {sub.reason}
                          </p>
                        </div>

                        <div className="border-t border-gray-200 pt-3 mb-3">
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-[11px] text-gray-600">
                              Gross Earnings ({sub.views} views)
                            </span>
                            <span className="text-[11px] font-medium text-gray-900">
                              {sub.gross}
                            </span>
                          </div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-[11px] text-gray-600">
                              Platform Deduction (10%)
                            </span>
                            <span className="text-[11px] font-medium text-gray-900">
                              {sub.deduction}
                            </span>
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                            <span className="text-[12px] font-bold text-gray-900">
                              Net Payout
                            </span>
                            <span className="text-[12px] font-bold text-green-700">
                              {sub.net}
                            </span>
                          </div>
                        </div>

                        <div className="flex justify-between items-center mt-4">
                          <button
                            onClick={(e) => deleteSubmission(sub.id, e)}
                            className="flex items-center text-[10px] text-red-500 hover:text-red-700 font-medium bg-red-50 px-2 py-1 rounded"
                          >
                            <Trash2 className="w-3 h-3 mr-1" /> Dev: Remove
                          </button>
                          <p className="text-[10px] text-gray-400">
                            Reflects to wallet on Oct 18.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full py-12 px-4 text-center">
                  <p className="text-gray-500 text-sm font-medium mb-6">
                    Oops, looks like you dont have any submissions yet!
                  </p>
                  <Link
                    href="/"
                    className="bg-[#2E6F40] text-white px-6 py-2.5 rounded-full text-sm font-bold shadow-sm active:scale-95 transition-transform"
                  >
                    Find Pabuyas
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* business campaigns tab */}
        {activeTab === 'pabuyas' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex justify-between items-center mb-1">
              <h3 className="font-bold text-gray-900 text-lg">My active campaigns</h3>
              <span className="text-sm font-medium text-green-700">
                {campaigns.length} live
              </span>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Review creator submissions to unlock their payouts.
            </p>

            <div className="flex flex-col gap-4">
              {campaigns.map((camp) => {
                const campaignSubmissions = submissions.filter((sub) =>
                  belongsToCampaign(sub, camp)
                );
                const pendingCount = campaignSubmissions.filter(
                  (sub) => sub.status === 'Pending Review'
                ).length;

                const { total, remaining, percentUsed } = getCampaignBudgetStats(camp);

                return (
                  <div
                    key={camp.id}
                    className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 transition-all"
                  >
                    {/* decluttered 16:9 banner with flush bottom progress bar */}
                    <div
                      className={`relative w-full aspect-[16/9] rounded-xl overflow-hidden mb-3 flex flex-col justify-between p-3.5 pb-3 ${
                        camp.imageColor || 'bg-[#1F5430]'
                      }`}
                    >
                      {camp.coverImage && (
                        <img
                          src={camp.coverImage}
                          alt={camp.title}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/15" />

                      <div className="relative z-10 flex justify-between items-center gap-2">
                        {pendingCount > 0 ? (
                          <span className="bg-orange-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-xs">
                            {pendingCount} clips pending
                          </span>
                        ) : (
                          <span className="bg-black/45 backdrop-blur-md text-emerald-300 text-[10px] font-bold px-2.5 py-1 rounded-full border border-white/15">
                            Active · Locked
                          </span>
                        )}

                        <span className="bg-amber-400 text-gray-950 text-[11px] font-extrabold px-2.5 py-1 rounded-full shadow-xs">
                          ₱{camp.ratePer1k || 50} / 1K views
                        </span>
                      </div>

                      <div className="relative z-10">
                        <p className="text-emerald-300 text-[10px] font-extrabold uppercase tracking-wider mb-0.5">
                          {camp.brand}
                        </p>
                        <h4 className="font-extrabold text-white leading-snug text-base mb-1 drop-shadow-xs line-clamp-1">
                          {camp.title}
                        </h4>
                        <div className="flex justify-between items-center text-[11px] text-white/85">
                          <span>
                            <strong className="text-emerald-300">
                              ₱{remaining.toLocaleString()}
                            </strong>{' '}
                            left of ₱{total.toLocaleString()}
                          </span>
                          <span className="text-white/75">{percentUsed}% claimed</span>
                        </div>
                      </div>

                      {/* flush edge-to-edge budget bar at the bottom of the banner */}
                      <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/20 z-10">
                        <div
                          className="h-full bg-emerald-400 transition-all duration-500"
                          style={{ width: `${Math.max(percentUsed, 4)}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-center px-1">
                      <div>
                        <p className="text-[10px] text-gray-400">
                          ₱{total.toLocaleString()} funded
                        </p>
                        <p className="text-xs font-bold text-gray-900">
                          ₱{remaining.toLocaleString()} remaining
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link
                          href={`/create?edit=${camp.id}`}
                          className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold px-3.5 py-2 rounded-full flex items-center gap-1 active:scale-95 transition-all"
                        >
                          <Pencil className="w-3 h-3" /> Edit
                        </Link>
                        <button
                          onClick={() => toggleCampaignExpand(camp.id)}
                          className="bg-green-700 text-white text-xs font-medium px-4 py-2 rounded-full active:scale-95 transition-transform"
                        >
                          {expandedCampaignId === camp.id ? 'Close Inbox' : 'Review Clips'}
                        </button>
                      </div>
                    </div>

                    {/* clip review drawer */}
                    {expandedCampaignId === camp.id && (
                      <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col gap-3 animate-in slide-in-from-top-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                          Creator Submissions
                        </p>

                        {loading && (
                          <div className="flex flex-col gap-2.5">
                            {[1, 2].map((n) => (
                              <div
                                key={n}
                                className="bg-gray-50 rounded-xl p-3 border border-gray-200/70 animate-pulse space-y-2"
                              >
                                <div className="flex justify-between items-start">
                                  <div className="space-y-1.5 flex-1 pr-4">
                                    <div className="h-2.5 bg-gray-200 rounded-full w-20" />
                                    <div className="h-3.5 bg-gray-200 rounded-full w-3/4" />
                                    <div className="h-2.5 bg-gray-200 rounded-full w-1/2" />
                                  </div>
                                  <div className="h-4 bg-gray-200 rounded-full w-16 shrink-0" />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {!loading && campaignSubmissions.length === 0 && (
                          <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                            <p className="text-xs font-medium text-gray-500">
                              No clips submitted yet.
                            </p>
                          </div>
                        )}

                        {campaignSubmissions.map((sub) => (
                          <div
                            key={sub.id}
                            className="bg-gray-50 rounded-xl p-3 border border-gray-200 shadow-sm"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div className="pr-2">
                                <p className="text-[10px] font-bold text-gray-400 mb-0.5">
                                  USER: ID-{sub.id.toString().slice(-4)}
                                </p>
                                <p className="text-sm font-bold text-gray-900 leading-tight mb-1">
                                  {sub.title}
                                </p>
                                <a
                                  href={sub.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[11px] text-blue-600 underline font-medium truncate block max-w-[200px]"
                                >
                                  {sub.url}
                                </a>
                              </div>
                              <span
                                className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 border ${
                                  sub.statusColor === 'text-yellow-700 bg-yellow-50'
                                    ? 'border-yellow-200'
                                    : sub.statusColor === 'text-green-700 bg-green-50'
                                      ? 'border-green-200'
                                      : 'border-red-200'
                                } ${sub.statusColor}`}
                              >
                                {sub.status}
                              </span>
                            </div>

                            {sub.status === 'Pending Review' && (
                              <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200/60">
                                <button
                                  onClick={() =>
                                    updateSubmissionStatus(sub.id, 'Approved & Tracking')
                                  }
                                  className="flex-1 bg-white border border-green-200 text-green-700 text-xs font-bold py-2 rounded-lg shadow-sm active:bg-green-50 transition-colors"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() =>
                                    updateSubmissionStatus(sub.id, 'Rejected')
                                  }
                                  className="flex-1 bg-white border border-red-200 text-red-700 text-xs font-bold py-2 rounded-lg shadow-sm active:bg-red-50 transition-colors"
                                >
                                  Reject
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* bottom nav */}
      <div className="absolute bottom-0 w-full bg-white border-t border-gray-100 px-6 py-3 flex justify-between items-center pb-8 z-20">
        <button className="flex flex-col items-center text-green-700">
          <Home className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-bold">Home</span>
        </button>
        <Link href="/" className="flex flex-col items-center text-gray-400">
          <SearchIcon className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-medium">Pabuyas</span>
        </Link>
        <Link href="/create" className="flex flex-col items-center text-gray-400">
          <PlusCircle className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-medium">Create</span>
        </Link>
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