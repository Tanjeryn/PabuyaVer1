'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  Camera,
  Plus,
  Check,
  Lock,
  Unlock,
  Loader2,
  X,
  AlertCircle,
  Trash2,
  Home,
  Search as SearchIcon,
  PlusCircle,
  Mail,
  User
} from 'lucide-react';
import confetti from 'canvas-confetti';

const AVAILABLE_TAGS = ['UGC', 'Clipping', 'Food', 'Entertainment'] as const;

// default campaigns fallback so we can also edit or delete starter campaigns
const DEFAULT_CAMPAIGNS_DATA: Record<number, any> = {
  1: {
    id: 1,
    brand: 'KAPE TAYO',
    tag: 'Kape Tayo',
    title: 'Show us your cozy café moment',
    brief:
      'Share an honest video of your Kape Tayo visit. Show the drink, first sip, and cozy vibe—natural lang.',
    ratePer1k: 50,
    budgetNum: 5000,
    payoutCap: 1500,
    tags: ['UGC', 'Food'],
    reqType: 'list',
    requirementsText:
      '- 1 vertical short-form video (15–30 seconds)\n- Tag @kapetayo.ph and #KapeTayoPabuya\n- Views tracked for 14 days after posting',
    driveUrl: '',
    coverImage: '',
    imageColor: 'bg-amber-900',
    paymentMethod: 'GCash',
    createdAt: Date.now()
  },
  2: {
    id: 2,
    brand: 'PODCAST NI MELAI',
    tag: 'Podcast ni Melai',
    title: 'Clip our funniest interview moments',
    brief:
      'Download the raw podcast video from our drive and edit it down to the funniest 30-60 second clips for TikTok.',
    ratePer1k: 80,
    budgetNum: 10000,
    payoutCap: 3000,
    tags: ['Clipping', 'Entertainment'],
    reqType: 'list',
    requirementsText:
      '- 1 vertical short-form clip (30–60 seconds)\n- Tag @PodcastNiMelai and include #MelaiPodcast\n- Must be uploaded within 30 minutes of submission',
    driveUrl: '',
    coverImage: '',
    imageColor: 'bg-[#1F5430]',
    paymentMethod: 'GCash',
    createdAt: Date.now()
  },
  3: {
    id: 3,
    brand: "LOLA NENA'S",
    tag: "Lola Nena's",
    title: 'Cheese doughnut taste test',
    brief:
      "Show your genuine first bite reaction trying Lola Nena's classic triple cheese doughnuts with friends or family.",
    ratePer1k: 60,
    budgetNum: 8000,
    payoutCap: 2000,
    tags: ['UGC', 'Food'],
    reqType: 'list',
    requirementsText:
      '- Show the box and cheese pull clearly\n- Use #LolaNenasPabuya in the caption\n- Keep video at least 15 seconds long',
    driveUrl: '',
    coverImage: '',
    imageColor: 'bg-orange-800',
    paymentMethod: 'GCash',
    createdAt: Date.now()
  }
};

export default function CreatePabuya() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 1-3 are form steps, 4 is the live screen
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // increments every time an invalid action happens so the shake animation replays
  const [shakeKey, setShakeKey] = useState<number>(0);
  const [deleteLockShake, setDeleteLockShake] = useState<number>(0);
  const [paymentLockShake, setPaymentLockShake] = useState<number>(0);

  // edit mode tracking + dev toggle to bypass the 7-day lock
  const [editId, setEditId] = useState<number | null>(null);
  const [createdAt, setCreatedAt] = useState<number>(Date.now());
  const [enforce7dLock, setEnforce7dLock] = useState<boolean>(true);
  const [existingImageColor, setExistingImageColor] = useState<string>('bg-[#1F5430]');

  // step 1 state
  const [coverPhoto, setCoverPhoto] = useState<string>('');
  const [brandName, setBrandName] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [brief, setBrief] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>(['Food']);
  const [reqType, setReqType] = useState<'list' | 'link'>('list');
  const [requirementsText, setRequirementsText] = useState<string>(
    '- Use #KapeTayo\n- Show the ube latte in your video\n- Keep it 15–30 seconds'
  );
  const [driveUrl, setDriveUrl] = useState<string>('');
  const [step1Error, setStep1Error] = useState<string>('');

  // step 2 state
  const [rateInput, setRateInput] = useState<string>('50');
  const [budgetInput, setBudgetInput] = useState<string>('100000');
  const [noPayoutCap, setNoPayoutCap] = useState<boolean>(true);
  const [payoutCapInput, setPayoutCapInput] = useState<string>('5000');
  const [step2Error, setStep2Error] = useState<string>('');

  // step 3 state
  const [paymentMethod, setPaymentMethod] = useState<'GCash' | 'QR Ph' | 'Card'>('GCash');
  const [showPayMongoSheet, setShowPayMongoSheet] = useState<boolean>(false);

  // if ?edit=ID is in the URL, load that campaign's fields into the form
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const editParam = params.get('edit');
    if (!editParam) return;

    const targetId = Number(editParam);
    setEditId(targetId);

    try {
      const customRaw = localStorage.getItem('pabuya_custom_campaigns');
      const customList = customRaw ? JSON.parse(customRaw) : [];
      const editedDefaultsRaw = localStorage.getItem('pabuya_edited_defaults');
      const editedDefaults = editedDefaultsRaw ? JSON.parse(editedDefaultsRaw) : {};

      const foundCustom = customList.find((c: any) => Number(c.id) === targetId);
      const foundDefault = editedDefaults[targetId] || DEFAULT_CAMPAIGNS_DATA[targetId];
      const source = foundCustom || foundDefault;

      if (source) {
        setCoverPhoto(source.coverImage || '');
        setBrandName(source.brand || '');
        setTitle(source.title || '');
        setBrief(source.brief || '');
        setSelectedTags(
          Array.isArray(source.tags) && source.tags.length > 0
            ? source.tags
            : [source.category || 'Food']
        );
        setReqType(source.reqType || 'list');
        if (source.requirementsText) {
          setRequirementsText(source.requirementsText);
        } else if (Array.isArray(source.requirements)) {
          setRequirementsText(source.requirements.map((r: string) => `- ${r}`).join('\n'));
        }
        setDriveUrl(source.driveUrl || '');
        setRateInput(String(source.ratePer1k || 50));
        setBudgetInput(String(source.budgetNum || 5000));
        if (source.payoutCap && Number(source.payoutCap) > 0) {
          setNoPayoutCap(false);
          setPayoutCapInput(String(source.payoutCap));
        } else {
          setNoPayoutCap(true);
        }
        setPaymentMethod(source.paymentMethod || 'GCash');
        setCreatedAt(source.createdAt || targetId || Date.now());
        setExistingImageColor(source.imageColor || 'bg-[#1F5430]');
      }
    } catch (e) {
      console.error('Error loading campaign to edit:', e);
    }
  }, []);

  // check if 7 days have passed or if dev unlocked the 7-day lock
  const daysElapsed = (Date.now() - createdAt) / (1000 * 60 * 60 * 24);
  const is7dUnlocked = !enforce7dLock || daysElapsed >= 7;
  const isPaymentLocked = Boolean(editId) && !is7dUnlocked;

  // delete campaign if unlocked, otherwise shake the lock card and show error
  const handleDeleteCampaign = () => {
    if (!editId) return;
    if (!is7dUnlocked) {
      setDeleteLockShake((k) => k + 1);
      setStep1Error('Campaign is still locked! You can only delete a Pabuya 7 days after launch.');
      setShakeKey((k) => k + 1);
      return;
    }

    try {
      const customRaw = localStorage.getItem('pabuya_custom_campaigns');
      if (customRaw) {
        const list = JSON.parse(customRaw);
        const filtered = list.filter((c: any) => Number(c.id) !== editId);
        localStorage.setItem('pabuya_custom_campaigns', JSON.stringify(filtered));
      }

      const deletedRaw = localStorage.getItem('pabuya_deleted_ids');
      const deletedIds = deletedRaw ? JSON.parse(deletedRaw) : [];
      if (!deletedIds.includes(editId)) {
        localStorage.setItem(
          'pabuya_deleted_ids',
          JSON.stringify([...deletedIds, editId])
        );
      }
    } catch (err) {
      console.error('Failed to delete campaign:', err);
    }

    router.push('/home?tab=pabuyas');
  };

  // shrink uploaded image on canvas so localStorage doesn't choke
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 700;
        let width = img.width;
        let height = img.height;

        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        setCoverPhoto(canvas.toDataURL('image/jpeg', 0.78));
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // toggle tag selection
  const toggleTag = (tag: string) => {
    setStep1Error('');
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  // parsed values for the preview card math
  const numericRate = Math.max(1, parseFloat(rateInput) || 0);
  const numericBudget = Math.max(0, parseFloat(budgetInput) || 0);
  const numericCap = Math.max(0, parseFloat(payoutCapInput) || 0);
  const maxViewsForCap = numericRate > 0 ? Math.round((numericCap / numericRate) * 1000) : 0;

  const formatViewsShort = (views: number) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1).replace(/\.0$/, '')}K`;
    return views.toString();
  };

  // check step 1 fields before moving to step 2 and shake on invalid input
  const handleStep1Next = () => {
    if (!title.trim() || !brief.trim()) {
      setStep1Error('Please fill in both the pitch title and the brief before proceeding.');
      setShakeKey((k) => k + 1);
      return;
    }
    if (selectedTags.length === 0) {
      setStep1Error('Please select at least 1 tag (UGC, Clipping, Food, or Entertainment).');
      setShakeKey((k) => k + 1);
      return;
    }
    if (reqType === 'list' && !requirementsText.trim()) {
      setStep1Error('Please write the requirements creators need to follow.');
      setShakeKey((k) => k + 1);
      return;
    }
    if (reqType === 'link' && !driveUrl.trim()) {
      setStep1Error('Please paste a valid Google Drive link for creators.');
      setShakeKey((k) => k + 1);
      return;
    }
    setStep1Error('');
    setStep(2);
  };

  // check step 2 math and shake if payout cap is higher than campaign budget
  const handleStep2Next = () => {
    if (!isPaymentLocked) {
      if (numericRate <= 0 || numericBudget <= 0) {
        setStep2Error('Please enter a valid payout rate and total campaign budget.');
        setShakeKey((k) => k + 1);
        return;
      }
      if (!noPayoutCap && numericCap <= 0) {
        setStep2Error('Please enter a valid payout cap or turn on "No payout cap per creator".');
        setShakeKey((k) => k + 1);
        return;
      }
      if (!noPayoutCap && numericCap > numericBudget) {
        setStep2Error(
          'You cannot proceed to the next step because the payout cap cannot be higher than the campaign budget.'
        );
        setShakeKey((k) => k + 1);
        return;
      }
    }
    setStep2Error('');
    setStep(3);
  };

  // split textbox lines into clean array items for the details screen
  const parsedRequirements = requirementsText
    .split('\n')
    .map((line) => line.replace(/^[-•*✓]\s*/, '').trim())
    .filter((line) => line.length > 0);

  // save new or edited campaign
  const handleConfirmPayment = () => {
    setShowPayMongoSheet(true);

    setTimeout(() => {
      const campaignPayload = {
        id: editId ? editId : Date.now(),
        createdAt: editId ? createdAt : Date.now(),
        brand: (brandName.trim() || title.trim().split(' ')[0] || 'LOCAL BRAND').toUpperCase(),
        tag: title.trim(),
        title: title.trim(),
        brief: brief.trim(),
        reward: `₱${numericRate} per 1K views`,
        ratePer1k: numericRate,
        budgetNum: numericBudget,
        funded: `₱${numericBudget.toLocaleString()}`,
        remaining: `₱${numericBudget.toLocaleString()}`,
        payoutCap: noPayoutCap ? null : numericCap,
        capText: noPayoutCap ? 'Uncapped' : `₱${numericCap.toLocaleString()} cap`,
        reqType,
        requirementsText: requirementsText.trim(),
        requirements:
          parsedRequirements.length > 0 ? parsedRequirements : [requirementsText.trim()],
        driveUrl: driveUrl.trim(),
        coverImage: coverPhoto || '',
        imageColor: existingImageColor || 'bg-[#1F5430]',
        format: 'Reel/TikTok • 15-60s',
        tags: selectedTags,
        category: selectedTags[0] || 'Food',
        paymentMethod
      };

      try {
        if (editId && DEFAULT_CAMPAIGNS_DATA[editId]) {
          const rawDefaults = localStorage.getItem('pabuya_edited_defaults');
          const editedDefaults = rawDefaults ? JSON.parse(rawDefaults) : {};
          editedDefaults[editId] = campaignPayload;
          localStorage.setItem('pabuya_edited_defaults', JSON.stringify(editedDefaults));
        } else {
          const existingRaw = localStorage.getItem('pabuya_custom_campaigns');
          const existing = existingRaw ? JSON.parse(existingRaw) : [];
          if (editId) {
            const updatedList = existing.map((c: any) =>
              Number(c.id) === editId ? campaignPayload : c
            );
            localStorage.setItem('pabuya_custom_campaigns', JSON.stringify(updatedList));
          } else {
            localStorage.setItem(
              'pabuya_custom_campaigns',
              JSON.stringify([campaignPayload, ...existing])
            );
          }
        }
      } catch (err) {
        console.error('Could not save campaign:', err);
      }

      setShowPayMongoSheet(false);
      setStep(4);

      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.55 },
        colors: ['#1F6338', '#fbbf24']
      });
    }, 1500);
  };

  return (
    <div className="w-full max-w-[448px] mx-auto h-screen bg-[#FAF9F5] flex flex-col font-sans relative overflow-hidden shadow-2xl">
      {/* top bar with dev 7d lock button at the very top right when editing */}
      <div className="px-5 pt-12 pb-3 flex items-center justify-between bg-[#FAF9F5]">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (step === 1 || step === 4) {
                router.push(editId ? '/home?tab=pabuyas' : '/');
              } else {
                setStep((prev) => (prev - 1) as 1 | 2 | 3);
              }
            }}
            className="p-1.5 -ml-1.5 rounded-full text-gray-900 hover:bg-gray-200/60"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <span className="font-bold text-gray-900 text-sm">
            {editId ? 'Edit Pabuya' : 'Create Pabuya'}
          </span>

          {step < 4 && (
            <span className="text-xs font-medium text-gray-400 ml-1">
              ({step}/3)
            </span>
          )}
        </div>

        {/* dev toggle button pinned to the very top right */}
        {editId && step < 4 ? (
          <button
            type="button"
            onClick={() => {
              setEnforce7dLock(!enforce7dLock);
              setStep1Error('');
              setStep2Error('');
            }}
            className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border flex items-center gap-1 transition-all shadow-2xs ${
              enforce7dLock
                ? 'bg-gray-200/80 text-gray-700 border-gray-300'
                : 'bg-emerald-50 text-emerald-800 border-emerald-300'
            }`}
          >
            {enforce7dLock ? (
              <>
                <Lock className="w-3 h-3" /> Dev 7d Lock: ON
              </>
            ) : (
              <>
                <Unlock className="w-3 h-3" /> Dev 7d Lock: OFF
              </>
            )}
          </button>
        ) : (
          <span className="w-8" />
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-28 flex flex-col">
        {/* step 1: pitch, tags, & requirements textbox */}
        {step === 1 && (
          <div className="flex-1 flex flex-col pt-2 animate-in fade-in duration-200">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />

            {/* cover photo upload */}
            <div className="mb-4">
              {coverPhoto ? (
                <div className="relative w-full h-36 rounded-2xl overflow-hidden border border-gray-200 shadow-xs">
                  <img
                    src={coverPhoto}
                    alt="Campaign cover"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-2.5 left-2.5 bg-black/60 backdrop-blur-xs text-white text-[11px] font-bold px-3 py-1 rounded-full"
                  >
                    Change photo
                  </button>
                  <button
                    type="button"
                    onClick={() => setCoverPhoto('')}
                    className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-28 rounded-2xl border border-dashed border-gray-300 bg-[#F2F2F5] hover:bg-gray-200/70 transition-colors flex flex-col items-center justify-center gap-1.5"
                >
                  <div className="flex items-center gap-1.5 text-gray-400">
                    <Plus className="w-4 h-4" />
                    <Camera className="w-4 h-4" />
                  </div>
                  <span className="text-xs text-gray-400 font-medium">
                    Add campaign cover photo
                  </span>
                </button>
              )}
            </div>

            {/* brand name */}
            <div className="mb-3">
              <label className="text-[11px] text-gray-400 block mb-1">Brand or creator name</label>
              <input
                type="text"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="e.g., Kape Tayo, Podcast ni Melai"
                className="w-full bg-transparent text-xs font-bold uppercase tracking-wider text-[#1F6338] placeholder-gray-300 outline-none border-b border-gray-200/70 pb-2"
              />
            </div>

            {/* pitch title */}
            <div className="mb-3">
              <label className="text-xs text-gray-400 block mb-1">The pitch</label>
              <textarea
                rows={2}
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setStep1Error('');
                }}
                placeholder="Write a catchy title, like 'Ube Latte Taste Test'"
                className="w-full bg-transparent text-xl font-extrabold text-gray-900 placeholder-gray-400/70 outline-none resize-none leading-tight"
              />
            </div>

            {/* brief description */}
            <div className="mb-4 pb-3 border-b border-gray-200/80">
              <label className="text-xs text-gray-400 block mb-1">The brief</label>
              <textarea
                rows={2}
                value={brief}
                onChange={(e) => {
                  setBrief(e.target.value);
                  setStep1Error('');
                }}
                placeholder="Tell creators what to make, what to highlight, and why people should try it."
                className="w-full bg-transparent text-xs text-gray-700 placeholder-gray-400/80 outline-none resize-none leading-relaxed"
              />
            </div>

            {/* campaign tags selector - at least 1 required */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-extrabold text-gray-900">Campaign tags</h3>
                <span className="text-[10px] text-gray-400 font-medium">
                  Select at least 1
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_TAGS.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all ${
                        isSelected
                          ? 'bg-[#E4F3E8] text-[#1E6032] border-[#26683B]'
                          : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* deliverables toggle with freeform textbox */}
            <div className="mb-5">
              <h3 className="text-xs font-extrabold text-gray-900 mb-2.5">
                What should creators include?
              </h3>

              <div className="flex bg-[#EBEAE4] p-1 rounded-full mb-3.5">
                <button
                  type="button"
                  onClick={() => {
                    setReqType('list');
                    setStep1Error('');
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-full transition-all ${
                    reqType === 'list'
                      ? 'bg-white text-gray-900 shadow-xs'
                      : 'text-gray-500'
                  }`}
                >
                  List Requirements
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setReqType('link');
                    setStep1Error('');
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-full transition-all ${
                    reqType === 'link'
                      ? 'bg-white text-gray-900 shadow-xs'
                      : 'text-gray-500'
                  }`}
                >
                  Link to File
                </button>
              </div>

              {reqType === 'list' ? (
                <div>
                  <textarea
                    rows={4}
                    value={requirementsText}
                    onChange={(e) => {
                      setRequirementsText(e.target.value);
                      setStep1Error('');
                    }}
                    placeholder="Type all creator rules here (e.g., hashtags to use, video length, what to show in the clip)..."
                    className="w-full rounded-2xl bg-white border border-gray-200/90 p-3.5 text-xs text-gray-800 placeholder-gray-400 outline-none focus:border-[#26683B] resize-none leading-relaxed shadow-2xs mb-2"
                  />
                  <p className="text-[11px] text-gray-400">
                    Keep it short. Clear rules make better submissions.
                  </p>
                </div>
              ) : (
                <div>
                  <label className="text-[11px] text-gray-400 block mb-2">
                    Google Drive URL
                  </label>
                  <input
                    type="url"
                    value={driveUrl}
                    onChange={(e) => {
                      setDriveUrl(e.target.value);
                      setStep1Error('');
                    }}
                    placeholder="https://drive.google.com/file/d/...."
                    className="w-full bg-transparent text-xs font-medium text-gray-900 placeholder-gray-400 outline-none border-b border-gray-200 pb-2.5 mb-2.5"
                  />
                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    Set access to &ldquo;Anyone with the link&rdquo; so creators can open your brief.
                  </p>
                </div>
              )}
            </div>

            {/* shakes whenever step 1 validation fails */}
            {step1Error && (
              <div
                key={shakeKey}
                className="mb-3 p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2 text-red-700 text-xs font-medium animate-shake"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{step1Error}</span>
              </div>
            )}

            {/* delete campaign section only shown when editing an existing pabuya */}
            {editId && (
              <div
                key={deleteLockShake}
                className={`mb-4 p-3.5 rounded-2xl bg-white border border-gray-200/90 ${
                  deleteLockShake > 0 ? 'animate-shake' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-extrabold text-gray-900">
                    Campaign Lock & Deletion
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      is7dUnlocked
                        ? 'bg-red-50 text-red-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {is7dUnlocked ? 'Unlocked (7d Passed)' : 'Locked · 7 Days'}
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 leading-relaxed mb-3">
                  To protect creators while they edit clips, a Pabuya can only be deleted 7 days after launch.
                </p>
                <button
                  type="button"
                  onClick={handleDeleteCampaign}
                  className={`w-full py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    is7dUnlocked
                      ? 'bg-red-600 text-white shadow-xs active:scale-[0.99] cursor-pointer'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {is7dUnlocked ? (
                    <>
                      <Trash2 className="w-4 h-4" /> Delete Pabuya
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" /> Delete Pabuya (Available in 7d)
                    </>
                  )}
                </button>
              </div>
            )}

            <div className="mt-auto pt-2 text-center">
              <button
                type="button"
                onClick={handleStep1Next}
                className="w-full py-3.5 rounded-xl text-xs font-bold bg-[#26683B] text-white shadow-xs active:scale-[0.99] transition-all"
              >
                Next: Set Payouts
              </button>
              <p className="text-[10px] text-gray-400 mt-2">
                {editId
                  ? 'Review your payout settings on the next step.'
                  : 'Start with your idea. Funding comes later.'}
              </p>
            </div>
          </div>
        )}

        {/* step 2: payouts & cap validation (locked when editing within 7 days) */}
        {step === 2 && (
          <div className="flex-1 flex flex-col pt-2 animate-in fade-in duration-200">
            <h1 className="text-xl font-extrabold text-gray-900 mb-1">Set your payouts</h1>
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
              Reward real performance. Set your rate and total campaign budget.
            </p>

            <div
              onClick={() => {
                if (isPaymentLocked) {
                  setPaymentLockShake((k) => k + 1);
                }
              }}
              className="relative mb-4"
            >
              {/* big lock sign overlay when editing within 7 days */}
              {isPaymentLocked && (
                <div className="absolute inset-0 z-20 bg-gray-100/70 backdrop-blur-[2px] rounded-2xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center p-6 text-center cursor-not-allowed">
                  <div
                    key={paymentLockShake}
                    className={`bg-white rounded-3xl p-5 shadow-lg border border-gray-200 max-w-[290px] ${
                      paymentLockShake > 0 ? 'animate-shake' : ''
                    }`}
                  >
                    <div className="w-16 h-16 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center mx-auto mb-3 border border-gray-200">
                      <Lock className="w-8 h-8" strokeWidth={2.2} />
                    </div>
                    <h3 className="text-sm font-extrabold text-gray-900 mb-1.5">
                      Payout & Budget Locked
                    </h3>
                    <p className="text-[11px] text-gray-500 leading-relaxed mb-3">
                      To protect creators currently editing clips, payout rates and campaign budgets cannot be edited—only after 7 days.
                    </p>
                    <span className="inline-block bg-gray-100 text-gray-600 text-[10px] font-bold px-3 py-1 rounded-full">
                      Toggle &ldquo;Dev 7d Lock&rdquo; at top right to unlock
                    </span>
                  </div>
                </div>
              )}

              {/* greyed-out container when payment lock is active */}
              <div
                className={
                  isPaymentLocked
                    ? 'opacity-35 grayscale pointer-events-none select-none p-2'
                    : ''
                }
              >
                {/* rpm input */}
                <div className="mb-4 pb-3 border-b border-gray-200/80">
                  <label className="text-[11px] text-gray-400 block mb-1">Payout rate</label>
                  <div className="flex items-baseline justify-between">
                    <div className="flex items-baseline">
                      <span className="text-xl font-extrabold text-gray-900 mr-0.5">₱</span>
                      <input
                        type="number"
                        min="1"
                        disabled={isPaymentLocked}
                        value={rateInput}
                        onChange={(e) => {
                          setRateInput(e.target.value);
                          setStep2Error('');
                        }}
                        className="w-24 bg-transparent text-xl font-extrabold text-gray-900 outline-none"
                      />
                    </div>
                    <span className="text-xs text-gray-400">/ 1K validated views</span>
                  </div>
                </div>

                {/* budget input */}
                <div className="mb-4 pb-3 border-b border-gray-200/80">
                  <label className="text-[11px] text-gray-400 block mb-1">
                    Total campaign budget
                  </label>
                  <div className="flex items-baseline justify-between">
                    <div className="flex items-baseline">
                      <span className="text-xl font-extrabold text-gray-900 mr-0.5">₱</span>
                      <input
                        type="number"
                        min="100"
                        step="500"
                        disabled={isPaymentLocked}
                        value={budgetInput}
                        onChange={(e) => {
                          setBudgetInput(e.target.value);
                          setStep2Error('');
                        }}
                        className="w-36 bg-transparent text-xl font-extrabold text-gray-900 outline-none"
                      />
                    </div>
                    <span className="text-xs text-gray-400">Total reward pool</span>
                  </div>
                </div>

                {/* cap switch */}
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-extrabold text-gray-900">
                      No payout cap per creator
                    </span>
                    <button
                      type="button"
                      disabled={isPaymentLocked}
                      onClick={() => {
                        setNoPayoutCap(!noPayoutCap);
                        setStep2Error('');
                      }}
                      className={`w-12 h-7 rounded-full p-0.5 transition-colors flex items-center ${
                        noPayoutCap ? 'bg-[#26683B] justify-end' : 'bg-gray-300 justify-start'
                      }`}
                    >
                      <span className="w-6 h-6 rounded-full bg-white shadow-xs block" />
                    </button>
                  </div>

                  {noPayoutCap ? (
                    <p className="text-[11px] text-gray-500">
                      A single viral clip can earn up to the full ₱{numericBudget.toLocaleString()} budget.
                    </p>
                  ) : (
                    <div className="mt-3 pb-2 border-b-2 border-[#26683B]">
                      <label className="text-[11px] font-bold text-[#26683B] block mb-1">
                        Payout Cap:
                      </label>
                      <div className="flex items-center justify-between">
                        <div className="flex items-baseline">
                          <span className="text-lg font-extrabold text-gray-900 mr-0.5">₱</span>
                          <input
                            type="number"
                            min="50"
                            step="500"
                            disabled={isPaymentLocked}
                            value={payoutCapInput}
                            onChange={(e) => {
                              setPayoutCapInput(e.target.value);
                              setStep2Error('');
                            }}
                            className="w-28 bg-transparent text-lg font-extrabold text-gray-900 outline-none"
                          />
                        </div>
                        <span className="text-[11px] text-gray-500 text-right">
                          Max reward per submission ({formatViewsShort(maxViewsForCap)} views)
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* creator preview card */}
                <div>
                  <p className="text-xs text-gray-500 mb-2">What creators will see</p>
                  <div className="bg-[#FDF4DC] rounded-2xl p-4 mb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#9A6B13] mb-1">
                          VIEW-BASED BOUNTY
                        </p>
                        <p className="text-lg font-extrabold text-gray-900">
                          ₱{numericRate} / 1K views
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] text-gray-500 mb-0.5">Payout cap</p>
                        <p className="text-sm font-extrabold text-[#26683B]">
                          {noPayoutCap ? 'Uncapped' : `₱${numericCap.toLocaleString()}`}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-1.5">
                    <span className="bg-[#E4F3E8] text-[#1E6032] text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                      ₱{numericBudget.toLocaleString()} left
                    </span>
                    <span className="text-[11px] text-gray-500">0% done</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-3">
                    <div className="h-full bg-[#26683B] w-0 rounded-full" />
                  </div>

                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600">Total budget commitment</span>
                    <span className="text-xs font-extrabold text-gray-900">
                      ₱{numericBudget.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 leading-relaxed mb-1">
                    Locked for 7 days minimum so creators can edit and post with confidence.
                  </p>
                </div>
              </div>
            </div>

            {/* shakes every time user clicks Next with payout cap > budget */}
            {step2Error && (
              <div
                key={shakeKey}
                className="mb-3 p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2 text-red-700 text-xs font-medium animate-shake"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{step2Error}</span>
              </div>
            )}

            <div className="mt-auto pt-2">
              <button
                type="button"
                onClick={handleStep2Next}
                className="w-full py-3.5 rounded-xl text-xs font-bold bg-[#26683B] text-white shadow-xs active:scale-[0.99] transition-all"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* step 3: checkout & payment tab (also locked when editing within 7 days) */}
        {step === 3 && (
          <div className="flex-1 flex flex-col pt-2 animate-in fade-in duration-200">
            <h1 className="text-xl font-extrabold text-gray-900 mb-1">
              {editId ? 'Confirm your changes' : 'Fund your Pabuya'}
            </h1>
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
              {editId
                ? 'Review your campaign summary below before saving.'
                : 'One clear commitment. Your campaign goes live only after funding is confirmed.'}
            </p>

            <div
              onClick={() => {
                if (isPaymentLocked) {
                  setPaymentLockShake((k) => k + 1);
                }
              }}
              className="relative mb-5"
            >
              {/* big lock sign overlay over the payment tab when editing within 7 days */}
              {isPaymentLocked && (
                <div className="absolute inset-0 z-20 bg-gray-100/70 backdrop-blur-[2px] rounded-2xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center p-6 text-center cursor-not-allowed">
                  <div
                    key={paymentLockShake}
                    className={`bg-white rounded-3xl p-5 shadow-lg border border-gray-200 max-w-[290px] ${
                      paymentLockShake > 0 ? 'animate-shake' : ''
                    }`}
                  >
                    <div className="w-16 h-16 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center mx-auto mb-3 border border-gray-200">
                      <Lock className="w-8 h-8" strokeWidth={2.2} />
                    </div>
                    <h3 className="text-sm font-extrabold text-gray-900 mb-1.5">
                      Payment Settings Locked
                    </h3>
                    <p className="text-[11px] text-gray-500 leading-relaxed mb-3">
                      Funded budget and payment rails cannot be edited—only after 7 days from campaign launch.
                    </p>
                    <span className="inline-block bg-gray-100 text-gray-600 text-[10px] font-bold px-3 py-1 rounded-full">
                      Toggle &ldquo;Dev 7d Lock&rdquo; at top right to unlock
                    </span>
                  </div>
                </div>
              )}

              <div
                className={
                  isPaymentLocked
                    ? 'opacity-35 grayscale pointer-events-none select-none p-2'
                    : ''
                }
              >
                <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs mb-5">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#26683B] mb-1">
                    CAMPAIGN SUMMARY
                  </p>
                  <h2 className="text-base font-extrabold text-gray-900 pb-3 mb-3 border-b border-gray-100">
                    {title.trim() || 'Ube Latte Taste Test'}
                  </h2>

                  <div className="space-y-2.5 text-xs pb-3 mb-3 border-b border-gray-100">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Total campaign budget</span>
                      <span className="font-bold text-gray-900">
                        ₱{numericBudget.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Rate / 1K validated views</span>
                      <span className="font-bold text-gray-900">₱{numericRate}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Payout cap / submission</span>
                      <span className="font-bold text-gray-900">
                        {noPayoutCap
                          ? 'Uncapped'
                          : `₱${numericCap.toLocaleString()} (${maxViewsForCap.toLocaleString()} views)`}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Budget commitment lock</span>
                      <span className="font-bold text-[#26683B]">7 Days Minimum</span>
                    </div>
                  </div>

                  <div>
                    <p className="text-[11px] text-gray-400 mb-0.5">Total budget due</p>
                    <p className="text-2xl font-extrabold text-gray-900">
                      ₱{numericBudget.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* payment method buttons */}
                <div>
                  <p className="text-xs font-extrabold text-gray-900 mb-2.5">Pay with</p>
                  <div className="grid grid-cols-3 gap-2.5 mb-3">
                    {(['GCash', 'QR Ph', 'Card'] as const).map((method) => {
                      const active = paymentMethod === method;
                      return (
                        <button
                          key={method}
                          type="button"
                          disabled={isPaymentLocked}
                          onClick={() => setPaymentMethod(method)}
                          className={`py-2.5 rounded-full text-xs font-bold border transition-all ${
                            active
                              ? 'bg-[#E4F3E8] text-[#1E6032] border-[#26683B]'
                              : 'bg-white text-gray-600 border-gray-200'
                          }`}
                        >
                          {method}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-start gap-2 text-[11px] text-gray-400">
                    <Lock className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>
                      Continue to secure payment via PayMongo. Return here once your payment is confirmed.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-auto pt-2 text-center">
              <button
                type="button"
                onClick={handleConfirmPayment}
                className="w-full py-3.5 rounded-xl bg-[#26683B] text-white text-xs font-bold shadow-xs active:scale-[0.99] transition-transform"
              >
                {editId
                  ? 'Save Brief & Tag Changes'
                  : `Pay ₱${numericBudget.toLocaleString()} with ${paymentMethod}`}
              </button>
              <p className="text-[10px] text-gray-400 mt-1.5">
                {editId
                  ? 'Updates will immediately reflect across Pabuya.'
                  : 'Not live until payment is confirmed.'}
              </p>
            </div>
          </div>
        )}

        {/* step 4: confirmation screen */}
        {step === 4 && (
          <div className="flex-1 flex flex-col items-center pt-6 animate-in zoom-in-95 duration-300">
            <div className="relative w-32 h-32 flex items-center justify-center mb-4">
              <span className="absolute -top-1 left-10 w-1.5 h-4 bg-[#26683B] rounded-full -rotate-12" />
              <span className="absolute -top-1 right-10 w-1.5 h-4 bg-amber-400 rounded-full rotate-12" />
              <span className="absolute top-6 left-2 w-1.5 h-4 bg-amber-400 rounded-full -rotate-45" />
              <span className="absolute top-6 right-2 w-1.5 h-4 bg-[#26683B] rounded-full rotate-45" />
              <span className="absolute bottom-6 left-2 w-1.5 h-4 bg-amber-400 rounded-full rotate-45" />
              <span className="absolute bottom-6 right-2 w-1.5 h-4 bg-[#26683B] rounded-full -rotate-45" />

              <div className="w-20 h-20 rounded-full bg-[#26683B] flex items-center justify-center shadow-lg">
                <Check className="w-10 h-10 text-white" strokeWidth={2.5} />
              </div>
            </div>

            <h1 className="text-2xl font-extrabold text-gray-900 mb-1.5 text-center">
              {editId ? 'Pabuya Updated!' : 'Your Pabuya is live!'}
            </h1>
            <p className="text-xs text-gray-500 text-center max-w-[260px] mb-6 leading-relaxed">
              {editId
                ? 'Your changes have been saved and updated across the marketplace.'
                : 'Payment confirmed. Creators can now join and start making content.'}
            </p>

            <div className="w-full bg-white rounded-2xl p-4 border border-gray-100 shadow-xs mb-6">
              <h2 className="text-base font-extrabold text-gray-900 mb-3">
                {title.trim() || 'Ube Latte Taste Test'}
              </h2>

              <div className="flex justify-between items-center text-xs pb-3 mb-3 border-b border-gray-100">
                <span className="text-gray-500">Budget funded</span>
                <span className="font-extrabold text-[#26683B]">
                  ₱{numericBudget.toLocaleString()}
                </span>
              </div>

              <p className="text-[11px] text-gray-500 mb-2">Live budget status</p>
              <div className="flex justify-between items-center mb-1.5">
                <span className="bg-[#E4F3E8] text-[#1E6032] text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                  ₱{numericBudget.toLocaleString()} left
                </span>
                <span className="text-[11px] text-gray-500">0% done</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-4">
                <div className="h-full bg-[#26683B] w-0 rounded-full" />
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Payout cap</span>
                  <span className="font-bold text-gray-900">
                    {noPayoutCap ? 'Uncapped' : `₱${numericCap.toLocaleString()} / clip`}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">7-day commitment lock</span>
                  <span className="font-bold text-[#26683B]">Active until Nov 11</span>
                </div>
              </div>
            </div>

            <div className="w-full mt-auto">
              <button
                type="button"
                onClick={() => router.push('/home?tab=pabuyas')}
                className="w-full py-3.5 rounded-xl bg-[#26683B] text-white text-xs font-bold shadow-xs"
              >
                Back to My Pabuyas
              </button>
            </div>
          </div>
        )}
      </div>

      {/* paymongo bottom sheet overlay */}
      {showPayMongoSheet && (
        <div className="absolute inset-0 z-50 bg-black/40 flex items-end justify-center animate-in fade-in duration-200">
          <div className="w-full bg-white rounded-t-3xl px-5 pt-3 pb-8 shadow-2xl animate-in slide-in-from-bottom-4 duration-200">
            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4" />

            <div className="flex items-center gap-2.5 pb-3 mb-3 border-b border-gray-100">
              <div className="w-7 h-7 rounded-full bg-[#E4F3E8] text-[#26683B] flex items-center justify-center">
                <Lock className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-xs font-extrabold text-gray-900">Secure payment</p>
                <p className="text-[10px] text-gray-400">PayMongo · {paymentMethod}</p>
              </div>
            </div>

            <p className="text-xs text-gray-500 mb-0.5">
              {title.trim() || 'Ube Latte Taste Test'}
            </p>
            <p className="text-2xl font-extrabold text-gray-900 mb-0.5">
              ₱{numericBudget.toLocaleString()}
            </p>
            <p className="text-xs font-bold text-[#26683B] mb-4">
              Paying with {paymentMethod}
            </p>

            <div className="bg-[#E8F5EC] rounded-xl p-3.5 flex items-center gap-3 mb-4">
              <Loader2 className="w-5 h-5 text-[#26683B] animate-spin shrink-0" />
              <div>
                <p className="text-xs font-bold text-gray-900">
                  {editId ? 'Saving updates' : 'Awaiting payment'}
                </p>
                <p className="text-[11px] text-gray-500">
                  {editId ? 'Syncing your changes...' : 'Your campaign is not live yet.'}
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed mb-3">
              Complete the payment in {paymentMethod}. We&apos;ll return you to Pabuya after confirmation.
            </p>
            <p className="text-[10px] text-gray-400">
              Payment handoff concept - not a provider UI or a connected payment service.
            </p>
          </div>
        </div>
      )}

      {/* bottom nav */}
      <div className="absolute bottom-0 w-full bg-white border-t border-gray-100 px-6 py-3 flex justify-between items-center pb-8">
        <Link href="/home" className="flex flex-col items-center text-gray-400">
          <Home className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-medium">Home</span>
        </Link>
        <Link href="/" className="flex flex-col items-center text-gray-400">
          <SearchIcon className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-medium">Pabuyas</span>
        </Link>
        <button type="button" className="flex flex-col items-center text-[#26683B]">
          <PlusCircle className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-bold">Create</span>
        </button>
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