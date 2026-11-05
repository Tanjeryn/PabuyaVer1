'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, Check, XCircle, Clock, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import confetti from 'canvas-confetti';

export default function SubmitClip() {
  const [submissionName, setSubmissionName] = useState('');
  const [videoLink, setVideoLink] = useState('');
  const [status, setStatus] = useState<'idle' | 'checking' | 'success'>('idle');
  const [lastResultStatus, setLastResultStatus] = useState<
    'Approved & Tracking' | 'Pending Review' | 'Rejected'
  >('Pending Review');

  // holds error message and shake counter for invalid video prompts
  const [errorPrompt, setErrorPrompt] = useState<string | null>(null);
  const [shakeKey, setShakeKey] = useState<number>(0);

  const [campaignId, setCampaignId] = useState<number>(1);
  const [campaignTag, setCampaignTag] = useState<string>('Kape Tayo');
  const [campaignRate, setCampaignRate] = useState<number>(50);
  const [campaignCap, setCampaignCap] = useState<number>(0);

  // pull campaign info so backend gets the right rate and cap
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const idParam = searchParams.get('id');
    const parsedId = idParam ? parseInt(idParam) : 1;
    setCampaignId(parsedId);

    try {
      const savedEdited = localStorage.getItem('pabuya_edited_defaults');
      const editedMap = savedEdited ? JSON.parse(savedEdited) : {};

      const savedCustom = localStorage.getItem('pabuya_custom_campaigns');
      const list = savedCustom ? JSON.parse(savedCustom) : [];

      const found =
        editedMap[parsedId] || list.find((c: any) => Number(c.id) === parsedId);

      if (found) {
        setCampaignTag(found.tag || found.title || found.brand);
        setCampaignRate(Number(found.ratePer1k) || 50);
        setCampaignCap(found.payoutCap ? Number(found.payoutCap) : 0);
        return;
      }
    } catch (e) {
      console.error('Error reading custom campaign for submit:', e);
    }

    if (parsedId === 1) {
      setCampaignTag('Kape Tayo');
      setCampaignRate(50);
      setCampaignCap(1500);
    } else if (parsedId === 2) {
      setCampaignTag('Podcast ni Melai');
      setCampaignRate(80);
      setCampaignCap(3000);
    } else if (parsedId === 3) {
      setCampaignTag("Lola Nena's");
      setCampaignRate(60);
      setCampaignCap(2000);
    }
  }, []);

  // dev toggles for testing 30m rule and instant approval
  const [enforce30m, setEnforce30m] = useState(false);
  const [instantApprove, setInstantApprove] = useState(false);

  const isFormComplete = submissionName.trim().length > 0 && videoLink.trim().length > 0;

  const triggerErrorPrompt = (msg: string) => {
    setErrorPrompt(msg);
    setShakeKey((k) => k + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormComplete) return;

    setErrorPrompt(null);

    // quick client-side check for standard long-form youtube links before hitting backend
    const lowerUrl = videoLink.trim().toLowerCase();
    if (
      (lowerUrl.includes('youtube.com/watch') || lowerUrl.includes('youtu.be/')) &&
      !lowerUrl.includes('youtube.com/shorts/')
    ) {
      triggerErrorPrompt(
        'Invalid video: Long-form videos are not accepted. Please upload short-form videos only (YouTube Shorts or TikTok).'
      );
      return;
    }

    setStatus('checking');

    try {
      const response = await fetch('http://127.0.0.1:8000/api/track-views', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: submissionName,
          url: videoLink,
          campaignId: campaignId,
          campaignName: campaignTag,
          campaignRate: campaignRate,
          payoutCap: campaignCap,
          enforce_30m: enforce30m,
          instant_approve: instantApprove
        })
      });

      const data = await response.json();

      if (data.error) {
        triggerErrorPrompt(data.error);
        setStatus('idle');
        return;
      }

      setLastResultStatus(data.status);
      setStatus('success');

      if (data.status === 'Rejected') {
        setShakeKey((k) => k + 1);
      } else {
        triggerConfetti();
      }
    } catch (error) {
      console.error('Failed to fetch from backend:', error);
      setStatus('idle');
      triggerErrorPrompt('Error: Make sure the Python backend is running on Port 8000!');
    }
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#16a34a', '#fbbf24']
    });
  };

  const resetForm = () => {
    setSubmissionName('');
    setVideoLink('');
    setErrorPrompt(null);
    setStatus('idle');
  };

  return (
    <div className="w-full max-w-[448px] mx-auto h-screen bg-white flex flex-col font-sans relative overflow-hidden shadow-2xl slide-in-right">
      <div className="px-5 pt-12 pb-4 flex items-center justify-between bg-white border-b border-gray-50">
        <Link
          href={`/campaign?id=${campaignId}`}
          className="p-2 -ml-2 rounded-full hover:bg-gray-50 text-gray-900"
        >
          <ChevronLeft className="w-6 h-6" />
        </Link>
        <span className="font-bold text-gray-900 text-lg">Submit clip</span>

        <div className="flex flex-col items-end gap-1">
          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
            Dev Tools:
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setEnforce30m(!enforce30m)}
              className={`text-[9px] font-bold px-2 py-1 rounded-md border transition-all ${
                enforce30m
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : 'bg-gray-50 text-gray-500 border-gray-200'
              }`}
            >
              30m Rule: {enforce30m ? 'ON' : 'OFF'}
            </button>
            <button
              type="button"
              onClick={() => setInstantApprove(!instantApprove)}
              className={`text-[9px] font-bold px-2 py-1 rounded-md border transition-all ${
                instantApprove
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : 'bg-gray-50 text-gray-500 border-gray-200'
              }`}
            >
              Auto-Approve: {instantApprove ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>
      </div>

      {status === 'success' ? (
        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-32">
          {lastResultStatus === 'Rejected' && (
            <div key={shakeKey} className="flex flex-col items-center animate-shake">
              <div className="w-24 h-24 bg-red-600 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-red-200">
                <XCircle className="w-12 h-12 text-white" strokeWidth={2.5} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Clip Rejected</h2>
              <p className="text-red-600 text-center text-sm font-medium">
                Video was uploaded outside the strict 30-minute window. Logged to Supabase with ₱0.00 payout.
              </p>
            </div>
          )}

          {lastResultStatus === 'Pending Review' && (
            <>
              <div className="w-24 h-24 bg-yellow-500 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-yellow-200">
                <Clock className="w-12 h-12 text-white" strokeWidth={2.5} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Submission Pending</h2>
              <p className="text-gray-500 text-center text-sm">
                Link passed initial validation! Awaiting business owner approval to unlock payouts.
              </p>
            </>
          )}

          {lastResultStatus === 'Approved & Tracking' && (
            <>
              <div className="w-24 h-24 bg-green-700 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-green-200">
                <Check className="w-12 h-12 text-white" strokeWidth={3} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Clip Verified!</h2>
              <p className="text-gray-500 text-center text-sm">
                Saved to Supabase. Earn ₱{campaignRate} for every 1K validated views.
              </p>
            </>
          )}

          <div className="absolute bottom-0 w-full px-6 py-8 bg-white">
            <button
              onClick={resetForm}
              className="w-full bg-green-500 text-white font-bold py-4 rounded-full mb-3"
            >
              Submit Another Link
            </button>
            <Link
              href="/home"
              className="w-full block text-center text-gray-500 text-sm font-medium py-2"
            >
              Done
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col px-6 pt-6">
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
            <div className="mb-6">
              <label className="text-xs text-gray-400 mb-2 block">Submission name</label>
              <input
                type="text"
                value={submissionName}
                onChange={(e) => {
                  setSubmissionName(e.target.value);
                  setErrorPrompt(null);
                }}
                disabled={status === 'checking'}
                placeholder="Name your submission"
                className="w-full text-gray-900 font-medium placeholder-gray-300 border-b border-gray-100 pb-3 outline-none bg-transparent disabled:opacity-50"
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-2 block">Video link</label>
              <input
                type="url"
                value={videoLink}
                onChange={(e) => {
                  setVideoLink(e.target.value);
                  setErrorPrompt(null);
                }}
                disabled={status === 'checking'}
                placeholder="Paste the link of your short-form video"
                className="w-full text-gray-900 font-medium placeholder-gray-300 border-b border-gray-100 pb-3 outline-none bg-transparent disabled:opacity-50"
              />
              <p className="text-[11px] text-gray-400 mt-2">
                Short-form videos only (YouTube Shorts or TikTok).
              </p>
            </div>

            <div className="mt-auto pb-8">
              {status === 'idle' && (!submissionName || !videoLink) && (
                <div className="mb-4 pl-2">
                  {!submissionName && (
                    <p className="text-xs text-gray-400 mb-1">Submission name</p>
                  )}
                  {!videoLink && <p className="text-xs text-gray-400">Video link</p>}
                </div>
              )}

              <button
                type="submit"
                disabled={!isFormComplete || status === 'checking'}
                className={`w-full py-4 rounded-full font-bold transition-all ${
                  status === 'checking'
                    ? 'bg-gray-100 text-gray-400'
                    : isFormComplete
                      ? 'bg-green-500 text-white'
                      : 'bg-green-200 text-white opacity-70'
                }`}
              >
                {status === 'checking' ? 'Checking video details...' : 'Verify & Submit'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* shakes whenever creator uploads a long-form, duplicate, or invalid video */}
      {errorPrompt && (
        <div className="absolute inset-0 z-50 bg-black/45 flex items-center justify-center px-6 animate-in fade-in duration-150">
          <div
            key={shakeKey}
            className="w-full bg-white rounded-3xl p-6 shadow-2xl text-center animate-shake"
          >
            <div className="w-14 h-14 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-extrabold text-gray-900 mb-2">
              Invalid Video Format
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed mb-6">
              {errorPrompt}
            </p>
            <button
              type="button"
              onClick={() => setErrorPrompt(null)}
              className="w-full py-3.5 rounded-full bg-gray-900 text-white text-xs font-bold active:scale-95 transition-transform"
            >
              Upload a Short-Form Video
            </button>
          </div>
        </div>
      )}
    </div>
  );
}