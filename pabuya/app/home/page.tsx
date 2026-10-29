'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bell, Home, PlusCircle, Receipt, User, Landmark, Link2, Eye, ChevronDown, ChevronUp, Search as SearchIcon, Trash2 } from 'lucide-react';

const SUPABASE_URL = "https://yvbfmtomudcxdwgouqyf.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2YmZtdG9tdWRjeGR3Z291cXlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIzMTMxMDIsImV4cCI6MjEwNzg4OTEwMn0.lUTIQl25hjL28wGND4izzz-SLLGlGo-OnF0UWAh3OfE";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'submissions' | 'pabuyas'>('submissions');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  
  // adding state to track which campaign is actively being reviewed
  const [expandedCampaignId, setExpandedCampaignId] = useState<number | null>(null);
  
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // hardcoded campaign list mirroring the marketplace so the business tab looks populated
  const campaigns = [
    {
      id: 1,
      brand: "KAPE TAYO",
      title: "Show us your cozy café moment",
      reward: "₱50 per 1K views",
      funded: "₱5,000",
      remaining: "₱4,550",
      imageColor: "bg-amber-800" 
    },
    {
      id: 2,
      brand: "HABI LOCAL",
      title: "Style a handwoven everyday bag",
      reward: "₱80 per 1K views",
      funded: "₱4,000",
      remaining: "₱2,800",
      imageColor: "bg-stone-500" 
    },
    {
      id: 3,
      brand: "LOLA NENA'S",
      title: "Cheese doughnut taste test",
      reward: "₱60 per 1K views",
      funded: "₱8,000",
      remaining: "₱8,000",
      imageColor: "bg-orange-300" 
    }
  ];

  // hitting the supabase endpoint to pull all live submissions
  useEffect(() => {
    const fetchFromSupabase = async () => {
      try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/submissions?select=*&order=id.desc`, {
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          setSubmissions(data);
        }
      } catch (err) {
        console.error("Error loading from Supabase:", err);
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

  // this pushes the approve/reject decision straight to the database
  const updateSubmissionStatus = async (id: number, newStatus: string) => {
    // defining the visual colors based on the decision
    const statusColor = newStatus === 'Approved & Tracking' ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50';
    const reason = newStatus === 'Approved & Tracking' ? 'Milestones active.' : 'Rejected by business owner.';

    // instantly updating the UI so it doesn't feel laggy for the user
    setSubmissions(submissions.map(sub => 
      sub.id === id ? { ...sub, status: newStatus, statusColor, reason } : sub
    ));

    // silently updating the supabase row in the background
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/submissions?id=eq.${id}`, {
        method: 'PATCH',
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          statusColor: statusColor,
          reason: reason
        }),
      });
    } catch (err) {
      console.error("Failed to update status in Supabase:", err);
    }
  };

  const deleteSubmission = async (idToRemove: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedSubmissions = submissions.filter(sub => sub.id !== idToRemove);
    setSubmissions(updatedSubmissions);

    try {
      await fetch(`${SUPABASE_URL}/rest/v1/submissions?id=eq.${idToRemove}`, {
        method: 'DELETE',
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
      });
    } catch (err) {
      console.error("Failed to delete from Supabase:", err);
    }
  };

  // getting a quick count of how many items actually need the business owner's attention
  const pendingCount = submissions.filter(sub => sub.status === 'Pending Review').length;

  return (
    <div className="max-w-md mx-auto h-screen bg-gray-50 flex flex-col font-sans relative overflow-hidden shadow-2xl">
      
      <div className="px-5 pt-12 pb-4 bg-white">
        <div className="flex justify-between items-center mb-6">
          <div className="w-8 h-8 bg-green-700 text-white font-bold rounded-lg flex items-center justify-center">P</div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-green-700 flex items-center">
              <span className="w-2 h-2 rounded-full bg-green-500 mr-1.5"></span> QC nearby
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
              activeTab === 'submissions' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
            }`}
          >
            My Submissions
          </button>
          <button 
            onClick={() => setActiveTab('pabuyas')}
            className={`flex-1 text-sm font-medium py-2 rounded-full transition-all ${
              activeTab === 'pabuyas' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
            }`}
          >
            My Pabuyas
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pt-4 pb-28">
        
        {/* ==========================================
            VIEW 1: CREATOR SUBMISSIONS
            ========================================== */}
        {activeTab === 'submissions' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-900 text-lg">My active submissions</h3>
              <span className="text-sm font-medium text-green-700">{submissions.length} tracking</span>
            </div>

            <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex flex-col gap-2">
              {loading ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                  Loading from Supabase...
                </div>
              ) : (
                submissions.map((sub) => (
                  <div key={sub.id} className="border-b border-gray-100 last:border-0 pb-3 mb-1 last:mb-0 last:pb-0">
                    
                    <div 
                      onClick={() => toggleExpand(sub.id)}
                      className="flex items-center gap-3 cursor-pointer py-1"
                    >
                      <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                        <Landmark className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-gray-900 truncate">{sub.title}</h4>
                        <p className="text-xs text-gray-500 truncate flex items-center mt-0.5">
                          {sub.platform}
                        </p>
                      </div>
                      
                      <div className="flex flex-col items-end shrink-0">
                        <div className="flex items-center text-xs font-bold text-gray-900">
                          <Eye className="w-3.5 h-3.5 mr-1" /> {sub.views} views
                          {expandedId === sub.id ? <ChevronUp className="w-4 h-4 ml-1 text-gray-400" /> : <ChevronDown className="w-4 h-4 ml-1 text-gray-400" />}
                        </div>
                        <div className={`text-[10px] font-medium px-2 py-0.5 rounded-full mt-1.5 ${sub.statusColor}`}>
                          {sub.status}
                        </div>
                      </div>
                    </div>

                    {expandedId === sub.id && (
                      <div className="mt-3 bg-gray-50 rounded-xl p-4 animate-in slide-in-from-top-2 fade-in duration-200">
                        
                        <div className="mb-4">
                          <p className="text-[11px] text-gray-500 mb-1">Submitted: {sub.date}</p>
                          <p className="text-[11px] font-bold text-gray-900 mb-0.5">Status: {sub.status}</p>
                          <p className={`text-[11px] ${sub.status === 'Rejected' ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
                            Status reason: {sub.reason}
                          </p>
                        </div>

                        <div className="border-t border-gray-200 pt-3 mb-3">
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-[11px] text-gray-600">Gross Earnings ({sub.views} views)</span>
                            <span className="text-[11px] font-medium text-gray-900">{sub.gross}</span>
                          </div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-[11px] text-gray-600">Platform Deduction (10%)</span>
                            <span className="text-[11px] font-medium text-gray-900">{sub.deduction}</span>
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                            <span className="text-[12px] font-bold text-gray-900">Net Payout</span>
                            <span className="text-[12px] font-bold text-green-700">{sub.net}</span>
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
              )}
              
              {!loading && submissions.length === 0 && (
                <div className="text-center py-8 text-gray-500 text-sm">
                  No active submissions in Supabase. Go find a Pabuya!
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==========================================
            VIEW 2: BUSINESS PABUYAS (THE APPROVAL INBOX)
            ========================================== */}
        {activeTab === 'pabuyas' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex justify-between items-center mb-1">
              <h3 className="font-bold text-gray-900 text-lg">My active campaigns</h3>
              <span className="text-sm font-medium text-green-700">3 live</span>
            </div>
            <p className="text-xs text-gray-500 mb-4">Review creator submissions to unlock their payouts.</p>

            <div className="flex flex-col gap-4">
              {campaigns.map((camp, index) => (
                <div key={camp.id} className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 transition-all">
                  
                  {/* The Campaign Card Header */}
                  <div className="flex gap-4 mb-3 border-b border-gray-100 pb-3">
                    {/* kept the 9:16 aspect ratio so everything matches the app's aesthetic */}
                    <div className={`w-[90px] aspect-[9/16] rounded-xl shrink-0 object-cover ${camp.imageColor}`}></div>
                    
                    <div className="flex flex-col justify-between flex-1 py-1">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] font-bold text-green-700 uppercase tracking-wider">{camp.brand}</span>
                        </div>
                        <h4 className="font-bold text-gray-900 leading-tight text-sm mb-1.5">{camp.title}</h4>
                        <div className="flex items-center text-xs font-medium text-gray-700 mb-1.5">
                          <Link2 className="w-3 h-3 text-orange-500 mr-1" /> {camp.reward}
                        </div>
                      </div>
                      
                      {/* for demo purposes, attaching all pending items to the first campaign just so we can see the badge work */}
                      {index === 0 && pendingCount > 0 ? (
                        <span className="bg-orange-50 text-orange-700 text-[10px] font-bold px-2 py-0.5 rounded-full self-start border border-orange-100">
                          {pendingCount} clips pending
                        </span>
                      ) : (
                        <span className="bg-green-50 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full self-start border border-green-100">
                          Active · Escrow Locked
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center px-1">
                    <div>
                      <p className="text-[10px] text-gray-400">{camp.funded} funded</p>
                      <p className="text-xs font-bold text-gray-900">{camp.remaining} remaining</p>
                    </div>
                    
                    {/* Triggers the submission inbox for the campaign */}
                    <button 
                      onClick={() => toggleCampaignExpand(camp.id)}
                      className="bg-green-700 text-white text-xs font-medium px-4 py-2 rounded-full active:scale-95 transition-transform"
                    >
                      {expandedCampaignId === camp.id ? "Close Inbox" : "Review Clips"}
                    </button>
                  </div>

                  {/* ==========================================
                      THE EXPANDED INBOX (Clip Review System)
                      ========================================== */}
                  {expandedCampaignId === camp.id && (
                    <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col gap-3 animate-in slide-in-from-top-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Creator Submissions</p>
                      
                      {loading && <p className="text-xs text-gray-400 text-center py-4">Loading from Supabase...</p>}
                      
                      {!loading && submissions.length === 0 && (
                        <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                          <p className="text-xs font-medium text-gray-500">No clips submitted yet.</p>
                        </div>
                      )}
                      
                      {/* mapping all the live submissions straight from the database */}
                      {submissions.map((sub) => (
                        <div key={sub.id} className="bg-gray-50 rounded-xl p-3 border border-gray-200 shadow-sm">
                          <div className="flex justify-between items-start mb-2">
                            <div className="pr-2">
                              {/* faking a user ID just by slicing the end of the timestamp ID */}
                              <p className="text-[10px] font-bold text-gray-400 mb-0.5">USER: ID-{sub.id.toString().slice(-4)}</p>
                              <p className="text-sm font-bold text-gray-900 leading-tight mb-1">{sub.title}</p>
                              <a href={sub.url} target="_blank" rel="noreferrer" className="text-[11px] text-blue-600 underline font-medium truncate block max-w-[200px]">
                                {sub.url}
                              </a>
                            </div>
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 border ${sub.statusColor === 'text-yellow-700 bg-yellow-50' ? 'border-yellow-200' : sub.statusColor === 'text-green-700 bg-green-50' ? 'border-green-200' : 'border-red-200'} ${sub.statusColor}`}>
                              {sub.status}
                            </span>
                          </div>
                          
                          {/* only showing the approve/reject buttons if the clip hasn't been processed yet */}
                          {sub.status === 'Pending Review' && (
                            <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200/60">
                              <button 
                                onClick={() => updateSubmissionStatus(sub.id, 'Approved & Tracking')}
                                className="flex-1 bg-white border border-green-200 text-green-700 text-xs font-bold py-2 rounded-lg shadow-sm active:bg-green-50 transition-colors"
                              >
                                Approve
                              </button>
                              <button 
                                onClick={() => updateSubmissionStatus(sub.id, 'Rejected')}
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
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="absolute bottom-0 w-full bg-white border-t border-gray-100 px-6 py-3 flex justify-between items-center pb-8">
        <button className="flex flex-col items-center text-green-700">
          <Home className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-bold">Home</span>
        </button>
        <Link href="/" className="flex flex-col items-center text-gray-400">
          <SearchIcon className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-medium">Pabuyas</span>
        </Link>
        <button className="flex flex-col items-center text-gray-400">
          <PlusCircle className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-medium">Create</span>
        </button>
        <button className="flex flex-col items-center text-gray-400">
          <Receipt className="w-6 h-6 mb-1" />
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