from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
import urllib.request
import json
import yt_dlp
import time

app = FastAPI(title="Pabuya View Tracker API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# hooking up our live supabase database
SUPABASE_URL = "https://yvbfmtomudcxdwgouqyf.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2YmZtdG9tdWRjeGR3Z291cXlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIzMTMxMDIsImV4cCI6MjEwNzg4OTEwMn0.lUTIQl25hjL28wGND4izzz-SLLGlGo-OnF0UWAh3OfE"

# turning this off by default so I don't fail my own demo with old links
ENFORCE_30_MIN_WINDOW = False


class CampaignEscrow:
    def __init__(self, initial_balance: float):
        self.__balance = initial_balance  

    def release_payout(self, views: int) -> float:
        # locking in the rate at ₱50 per 1k views
        payout = (views // 1000) * 50.0  
        if payout <= self.__balance:
            self.__balance -= payout
            return payout
        return 0.0

    def get_balance(self) -> float:
        return self.__balance


class VideoLink:
    def __init__(self, url: str):
        self.url = url
        self.upload_timestamp = 0

    def fetch_views(self) -> int:
        raise NotImplementedError("Subclasses must implement this method")

    def is_within_30_mins(self) -> bool:
        # failsafe to make sure people aren't stealing old videos for money
        if not self.upload_timestamp:
            return False
        age_in_seconds = time.time() - self.upload_timestamp
        return age_in_seconds <= 1800


class TikTokLink(VideoLink):
    def fetch_views(self) -> int:
        ydl_opts = {'quiet': True, 'extract_flat': True}
        try:
            # pulling views via yt-dlp quietly in the background
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(self.url, download=False)
                self.upload_timestamp = info.get('timestamp') or 0
                views = info.get('view_count', 0)
                return views if views is not None else 0
        except Exception:
            return 0  


class YouTubeShortsLink(VideoLink):
    def fetch_views(self) -> int:
        ydl_opts = {'quiet': True, 'extract_flat': True}
        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(self.url, download=False)
                self.upload_timestamp = info.get('timestamp') or 0
                views = info.get('view_count', 0)
                return views if views is not None else 0
        except Exception:
            return 0


class SupabasePersistence:
    @staticmethod
    def is_duplicate(url: str) -> bool:
        req_url = f"{SUPABASE_URL}/rest/v1/submissions?select=url"
        req = urllib.request.Request(req_url, headers={
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}"
        })
        try:
            with urllib.request.urlopen(req) as response:
                rows = json.loads(response.read().decode('utf-8'))
                return any(row.get("url") == url for row in rows)
        except Exception as e:
            print("Supabase check error:", e)
            return False

    @staticmethod
    def save_submission(record: dict) -> bool:
        req_url = f"{SUPABASE_URL}/rest/v1/submissions"
        payload = json.dumps(record).encode('utf-8')
        req = urllib.request.Request(req_url, data=payload, method="POST", headers={
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal"
        })
        try:
            with urllib.request.urlopen(req) as response:
                return response.status in (200, 201, 204)
        except Exception as e:
            print("Supabase insert error:", e)
            return False


demo_escrow = CampaignEscrow(initial_balance=5000.0)


class ViewTracker:
    @staticmethod
    def process_link(title: str, url: str, enforce_time_limit: bool = False, instant_approve: bool = False):
        
        if SupabasePersistence.is_duplicate(url):
            return {"error": "Duplicate Link: This video has already been submitted and tracked."}
        
        url_lower = url.lower()
        is_valid_tiktok = "tiktok.com" in url_lower and ("/video/" in url_lower or "/t/" in url_lower or "vm.tiktok.com" in url_lower or "vt.tiktok.com" in url_lower)
        is_valid_youtube = ("youtube.com" in url_lower and ("/shorts/" in url_lower or "/watch" in url_lower)) or "youtu.be" in url_lower

        if is_valid_tiktok:
            video = TikTokLink(url)
        elif is_valid_youtube:
            video = YouTubeShortsLink(url)
        else:
            return {"error": "Invalid Link: Please submit a specific TikTok video or YouTube Shorts URL."}
        
        current_views = video.fetch_views()
        
        # FIXED DYNAMIC VIEW COUNTER LOGIC
        # automatically scaling down huge numbers so the UI doesn't break
        if current_views >= 1000000:
            formatted_views = f"{current_views / 1000000:.1f}M"
        elif current_views >= 1000:
            formatted_views = f"{current_views / 1000:.1f}K"
        else:
            formatted_views = str(current_views)
            
        now_str = datetime.now().strftime("%b %d, %Y, %I:%M %p")
        
        strict_check_active = ENFORCE_30_MIN_WINDOW or enforce_time_limit
        if strict_check_active and not video.is_within_30_mins():
            status = "Rejected"
            status_color = "text-red-700 bg-red-50"
            reason = "Rejected: Video was uploaded outside the 30-minute window"
            payout = 0.0
        else:
            # splitting the approval process so the business owner has control
            if instant_approve:
                status = "Approved & Tracking"
                status_color = "text-green-700 bg-green-50"
                reason = "Milestones active."
                payout = demo_escrow.release_payout(current_views)
            else:
                status = "Pending Review"
                status_color = "text-yellow-700 bg-yellow-50"
                reason = "Awaiting business owner approval."
                payout = 0.0 

        record = {
            "id": int(time.time() * 1000),
            "title": title,
            "platform": f"{video.__class__.__name__} • {url[:25]}...",
            "url": url,
            "views": formatted_views,
            "status": status,
            "statusColor": status_color,
            "date": now_str,
            "reason": reason,
            "gross": f"₱{payout:.2f}",
            "deduction": f"-₱{payout * 0.10:.2f}",
            "net": f"₱{payout * 0.90:.2f}"
        }
        SupabasePersistence.save_submission(record)
        
        return {
            "submitted_url": url,
            "platform_detected": video.__class__.__name__,
            "live_views": current_views,
            "status": status,
            "reason": reason,
            "payout_unlocked": f"₱{payout:.2f}",
            "escrow_remaining": f"₱{demo_escrow.get_balance():.2f}",
            "saved_record": record
        }

class SubmissionData(BaseModel):
    title: str = "Submitted Clip"
    url: str
    enforce_30m: bool = False
    instant_approve: bool = False

@app.post("/api/track-views")
async def track_views(data: SubmissionData):
    result = ViewTracker.process_link(data.title, data.url, data.enforce_30m, data.instant_approve)
    return result