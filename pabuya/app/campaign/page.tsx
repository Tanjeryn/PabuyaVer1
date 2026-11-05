'use client';
import React, { useEffect, useState } from 'react';
import {
  ChevronLeft,
  Bookmark,
  Check,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';

const SUPABASE_URL = 'https://yvbfmtomudcxdwgouqyf.supabase.co';
const SUPABASE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2YmZtdG9tdWRjeGR3Z291cXlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIzMTMxMDIsImV4cCI6MjEwNzg4OTEwMn0.lUTIQl25hjL28wGND4izzz-SLLGlGo-OnF0UWAh3OfE';

// default campaign details by id
const DEFAULT_CAMPAIGN_DETAILS: Record<number, any> = {
  1: {
    id: 1,
    brand: 'KAPE TAYO',
    tag: 'Kape Tayo',
    title: 'Show us your cozy café moment',
    budgetNum: 5000,
    baseSpent: 450,
    ratePer1k: 50,
    payoutCap: 1500,
    bgColor: 'bg-amber-900',
    coverImage: '',
    rate: '₱50 / 1K views',
    cap: '₱1,500',
    tags: ['UGC', 'Food'],
    brief:
      'Share an honest video of your Kape Tayo visit. Show the drink, first sip, and cozy vibe—natural lang.',
    reqType: 'list',
    requirements: [
      '1 vertical short-form video (15–30 seconds)',
      'Tag @kapetayo.ph and #KapeTayoPabuya',
      'Views tracked for 14 days after posting'
    ],
    driveUrl: ''
  },
  2: {
    id: 2,
    brand: 'PODCAST NI MELAI',
    tag: 'Podcast ni Melai',
    title: 'Clip our funniest interview moments',
    budgetNum: 10000,
    baseSpent: 800,
    ratePer1k: 80,
    payoutCap: 3000,
    bgColor: 'bg-[#1F5430]',
    coverImage: '',
    rate: '₱80 / 1K views',
    cap: '₱3,000',
    tags: ['Clipping', 'Entertainment'],
    brief:
      'Download the raw podcast video from our drive and edit it down to the funniest 30-60 second clips for TikTok.',
    reqType: 'list',
    requirements: [
      '1 vertical short-form clip (30–60 seconds)',
      'Tag @PodcastNiMelai and include #MelaiPodcast',
      'Must be uploaded within 30 minutes of submission'
    ],
    driveUrl: ''
  },
  3: {
    id: 3,
    brand: "LOLA NENA'S",
    tag: "Lola Nena's",
    title: 'Cheese doughnut taste test',
    budgetNum: 8000,
    baseSpent: 0,
    ratePer1k: 60,
    payoutCap: 2000,
    bgColor: 'bg-orange-800',
    coverImage: '',
    rate: '₱60 / 1K views',
    cap: '₱2,000',
    tags: ['UGC', 'Food'],
    brief:
      "Show your genuine first bite reaction trying Lola Nena's classic triple cheese doughnuts with friends or family.",
    reqType: 'list',
    requirements: [
      'Show the box and cheese pull clearly',
      'Use #LolaNenasPabuya in the caption',
      'Keep video at least 15 seconds long'
    ],
    driveUrl: ''
  }
};

export default function CampaignDetails() {
  const [campaignId, setCampaignId] = useState<number>(1);
  const [content, setContent] = useState<any>(DEFAULT_CAMPAIGN_DETAILS[1]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [bookmarked, setBookmarked] = useState(false);

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

  // check url id and load campaign details + supabase submissions for live budget bar
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const idParam = searchParams.get('id');
    const parsedId = idParam ? parseInt(idParam) : 1;
    setCampaignId(parsedId);

    try {
      const savedEdited = localStorage.getItem('pabuya_edited_defaults');
      const editedMap = savedEdited ? JSON.parse(savedEdited) : {};

      const savedCustom = localStorage.getItem('pabuya_custom_campaigns');
      const customList = savedCustom ? JSON.parse(savedCustom) : [];

      const found =
        editedMap[parsedId] ||
        customList.find((c: any) => Number(c.id) === parsedId);

      if (found) {
        setContent({
          id: found.id,
          brand: found.brand,
          tag: found.tag || found.title,
          title: found.title,
          budgetNum: Number(found.budgetNum) || 5000,
          baseSpent: Number(found.baseSpent) || 0,
          ratePer1k: Number(found.ratePer1k) || 50,
          payoutCap: found.payoutCap ? Number(found.payoutCap) : 0,
          bgColor: found.imageColor || 'bg-[#1F5430]',
          coverImage: found.coverImage || '',
          rate: `₱${found.ratePer1k} / 1K views`,
          cap: found.payoutCap
            ? `₱${Number(found.payoutCap).toLocaleString()}`
            : 'Uncapped',
          tags: Array.isArray(found.tags) ? found.tags : ['UGC'],
          brief: found.brief,
          reqType: found.reqType || 'list',
          requirements:
            found.requirements && found.requirements.length > 0
              ? found.requirements
              : ['Follow the campaign brief guidelines'],
          driveUrl: found.driveUrl || ''
        });
      } else if (DEFAULT_CAMPAIGN_DETAILS[parsedId]) {
        setContent(DEFAULT_CAMPAIGN_DETAILS[parsedId]);
      }
    } catch (e) {
      console.error('Error loading custom campaign details:', e);
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
        console.error('Error fetching submissions for campaign budget bar:', err);
      }
    };

    fetchSubmissions();
  }, []);

  const totalBudget = Number(content.budgetNum) || 5000;
  const ratePer1k = Number(content.ratePer1k) || 50;
  const payoutCap = Number(content.payoutCap) || 0;

  const approvedClaimed = submissions
    .filter((s) => s.status === 'Approved & Tracking' && belongsToCampaign(s, content))
    .reduce((sum, s) => {
      const views = parseViewsToNumber(s.views);
      let gross = Math.floor(views / 1000) * ratePer1k;
      if (payoutCap > 0 && gross > payoutCap) gross = payoutCap;
      return sum + gross;
    }, 0);

  const totalClaimed = Math.min(
    totalBudget,
    (Number(content.baseSpent) || 0) + approvedClaimed
  );
  const remainingBudget = Math.max(0, totalBudget - totalClaimed);
  const percentUsed = Math.min(100, Math.round((totalClaimed / totalBudget) * 100));

  return (
    <div className="w-full max-w-[448px] mx-auto h-screen bg-gray-50 flex flex-col font-sans relative overflow-hidden shadow-2xl slide-in-right">
      <div className="absolute top-0 w-full z-20 px-5 pt-10 pb-3 flex justify-between items-center bg-gradient-to-b from-black/70 to-transparent">
        <Link
          href="/"
          className="p-2 bg-black/40 backdrop-blur-md rounded-full text-white border border-white/15"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <span className="text-white font-bold text-sm drop-shadow-xs">
          Pabuya details
        </span>
        <button
          type="button"
          onClick={() => setBookmarked(!bookmarked)}
          className={`p-2 backdrop-blur-md rounded-full border border-white/15 ${
            bookmarked ? 'bg-green-600 text-white' : 'bg-black/40 text-white'
          }`}
        >
          <Bookmark className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto bg-white pb-28">
        {/* decluttered hero banner with flush bottom progress bar */}
        <div
          className={`w-full min-h-[275px] ${content.bgColor} relative shrink-0 overflow-hidden flex flex-col justify-end p-5 pb-4 pt-24`}
        >
          {content.coverImage && (
            <img
              src={content.coverImage}
              alt={content.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/20" />

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-emerald-300 text-xs font-extrabold uppercase tracking-wider">
                {content.brand}
              </p>
              <span className="text-[11px] font-medium text-white/80">
                {(content.tags || []).join(' • ')}
              </span>
            </div>

            <h1 className="text-2xl font-extrabold text-white leading-tight drop-shadow-xs mb-2.5">
              {content.title}
            </h1>

            <div className="flex justify-between items-center text-xs font-medium text-white/85">
              <span>
                <strong className="text-emerald-300 font-bold">
                  ₱{remainingBudget.toLocaleString()}
                </strong>{' '}
                left of ₱{totalBudget.toLocaleString()}
              </span>
              <span className="text-white/75">{percentUsed}% claimed</span>
            </div>
          </div>

          {/* flush edge-to-edge budget bar along the bottom of the hero image */}
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/20 z-10">
            <div
              className="h-full bg-emerald-400 transition-all duration-500"
              style={{ width: `${Math.max(percentUsed, 4)}%` }}
            />
          </div>
        </div>

        <div className="px-5 py-6">
          <div className="bg-orange-50 rounded-xl p-4 flex justify-between items-center mb-6">
            <div>
              <p className="text-xs text-gray-500 font-medium mb-1 uppercase tracking-wider">
                Reward Rate
              </p>
              <p className="text-sm font-bold text-gray-900">{content.rate}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 font-medium mb-1">Payout cap</p>
              <p className="text-sm font-bold text-green-700">{content.cap}</p>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-bold text-gray-900 mb-2">The brief</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{content.brief}</p>
          </div>

          {/* either drive link button or requirement lines */}
          <div className="mb-8">
            <h3 className="font-bold text-gray-900 mb-3">What to include</h3>

            {content.reqType === 'link' && content.driveUrl ? (
              <a
                href={content.driveUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full p-3.5 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between text-xs font-bold text-green-700 hover:bg-green-50 transition-colors"
              >
                <span>Open Google Drive Raw Footage / Brief</span>
                <ExternalLink className="w-4 h-4 shrink-0" />
              </a>
            ) : (
              <div className="flex flex-col gap-3">
                {(content.requirements || []).map((req: string, index: number) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-50 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5 text-green-700" strokeWidth={3} />
                    </div>
                    <p className="text-sm text-gray-800 font-medium">{req}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-green-50 rounded-xl p-3 flex items-start gap-3 border border-green-100">
            <CheckCircle2 className="w-5 h-5 text-green-700 shrink-0 mt-0.5" />
            <p className="text-sm text-green-800 font-medium">
              Open reward pool: Earn per 1,000 validated views until budget runs out.
            </p>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 w-full bg-white border-t border-gray-100 px-5 py-4 pb-8 z-20">
        <Link
          href={`/submit?id=${campaignId}`}
          className="w-full bg-green-700 text-white font-medium py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-sm"
        >
          <span className="text-xl leading-none mb-1">✨</span> Apply & create
        </Link>
        <p className="text-center text-xs text-gray-500 mt-3">
          No exclusivity • Free to join
        </p>
      </div>
    </div>
  );
}