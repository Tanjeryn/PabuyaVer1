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

# supabase connection
SUPABASE_URL = "https://yvbfmtomudcxdwgouqyf.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2YmZtdG9tdWRjeGR3Z291cXlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIzMTMxMDIsImV4cCI6MjEwNzg4OTEwMn0.lUTIQl25hjL28wGND4izzz-SLLGlGo-OnF0UWAh3OfE"

# keep false by default so older test links don't auto-reject
ENFORCE_30_MIN_WINDOW = False


class CampaignEscrow:
    def __init__(self, initial_balance: float):
        self.__balance = initial_balance  

    def release_payout(self, views: int, rate: float = 50.0, payout_cap: float = 0.0) -> float:
        # rate per 1k views + cap check
        payout = (views // 1000) * rate
        if payout_cap and payout_cap > 0 and payout > payout_cap:
            payout = payout_cap
        if payout <= self.__balance:
            self.__balance -= payout
            return payout
        return payout

    def get_balance(self) -> float:
        return self.__balance


class VideoLink:
    def __init__(self, url: str):
        self.url = url
        self.upload_timestamp = 0
        self.is_short_form = True

    def fetch_views(self) -> int:
        raise NotImplementedError("Subclasses must implement this method")

    def is_within_30_mins(self) -> bool:
        if not self.upload_timestamp:
            return False
        age_in_seconds = time.time() - self.upload_timestamp
        return age_in_seconds <= 1800


class TikTokLink(VideoLink):
    def fetch_views(self) -> int:
        ydl_opts = {'quiet': True, 'extract_flat': True}
        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(self.url, download=False)
                self.upload_timestamp = info.get('timestamp') or 0

                # flag long-form tiktok videos over 3 minutes
                duration = info.get('duration') or 0
                if duration and duration > 180:
                    self.is_short_form = False
                    return 0

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

                # check if someone swapped /watch?v= to /shorts/ on a long or landscape video
                duration = info.get('duration') or 0
                media_type = info.get('media_type')
                width = info.get('width') or 0
                height = info.get('height') or 0

                if (
                    (media_type and media_type != 'short')
                    or (duration and duration > 180)
                    or (width and height and width > height)
                ):
                    self.is_short_form = False
                    return 0

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


# large balance pool so high-view test videos don't zero out
demo_escrow = CampaignEscrow(initial_balance=100000000.0)


class ViewTracker:
    @staticmethod
    def process_link(
        title: str,
        url: str,
        campaign_id: int = 1,
        campaign_name: str = "",
        campaign_rate: float = 0.0,
        payout_cap: float = 0.0,
        enforce_time_limit: bool = False,
        instant_approve: bool = False
    ):
        # check duplicate link first
        if SupabasePersistence.is_duplicate(url):
            return {"error": "Duplicate Link: This video has already been submitted and tracked."}
        
        url_lower = url.lower()
        is_valid_tiktok = "tiktok.com" in url_lower and (
            "/video/" in url_lower or "/t/" in url_lower or "vm.tiktok.com" in url_lower or "vt.tiktok.com" in url_lower
        )

        # reject standard youtube watch/youtu.be links immediately
        is_long_youtube = ("youtube.com/watch" in url_lower) or ("youtu.be/" in url_lower)
        is_valid_youtube_short = "youtube.com/shorts/" in url_lower

        if is_long_youtube and not is_valid_youtube_short:
            return {
                "error": "Invalid video: Long-form videos are not accepted. Please upload short-form videos only (YouTube Shorts or TikTok)."
            }

        if is_valid_tiktok:
            video = TikTokLink(url)
        elif is_valid_youtube_short:
            video = YouTubeShortsLink(url)
        else:
            return {
                "error": "Invalid link: Please upload short-form videos only (YouTube Shorts or TikTok URL)."
            }
        
        current_views = video.fetch_views()

        # reject if yt-dlp metadata shows it is a long-form video
        if not video.is_short_form:
            return {
                "error": "Invalid video: This upload is a long-form video. Please upload short-form videos only."
            }
        
        # format view count (M / K)
        if current_views >= 1000000:
            formatted_views = f"{current_views / 1000000:.1f}M"
        elif current_views >= 1000:
            formatted_views = f"{current_views / 1000:.1f}K"
        else:
            formatted_views = str(current_views)
            
        now_str = datetime.now().strftime("%b %d, %Y, %I:%M %p")

        # use custom rate if passed, otherwise default campaign rates
        rate_map = {1: 50.0, 2: 80.0, 3: 60.0}
        camp_rate = campaign_rate if campaign_rate > 0 else rate_map.get(campaign_id, 50.0)
        
        strict_check_active = ENFORCE_30_MIN_WINDOW or enforce_time_limit
        if strict_check_active and not video.is_within_30_mins():
            status = "Rejected"
            status_color = "text-red-700 bg-red-50"
            reason = "Rejected: Video was uploaded outside the 30-minute window"
            payout = 0.0
        else:
            if instant_approve:
                status = "Approved & Tracking"
                status_color = "text-green-700 bg-green-50"
                reason = "Milestones active."
                payout = demo_escrow.release_payout(current_views, camp_rate, payout_cap)
            else:
                status = "Pending Review"
                status_color = "text-yellow-700 bg-yellow-50"
                reason = "Awaiting business owner approval."
                payout = 0.0 

        campaign_map = {
            1: "Kape Tayo",
            2: "Podcast ni Melai",
            3: "Lola Nena's"
        }
        camp_tag = campaign_name.strip() if campaign_name.strip() else campaign_map.get(campaign_id, "Kape Tayo")

        record = {
            "id": int(time.time() * 1000),
            "title": title,
            "platform": f"[ID:{campaign_id}] {camp_tag} • {video.__class__.__name__} • {url[:20]}...",
            "url": url,
            "views": formatted_views,
            "status": status,
            "statusColor": status_color,
            "date": now_str,
            "reason": reason,
            "gross": f"₱{payout:,.2f}",
            "deduction": f"-₱{payout * 0.10:,.2f}",
            "net": f"₱{payout * 0.90:,.2f}"
        }
        
        saved_ok = SupabasePersistence.save_submission(record)
        if not saved_ok:
            return {"error": "Database Error: Could not save submission to Supabase."}
        
        return {
            "submitted_url": url,
            "platform_detected": video.__class__.__name__,
            "live_views": current_views,
            "status": status,
            "reason": reason,
            "payout_unlocked": f"₱{payout:,.2f}",
            "escrow_remaining": f"₱{demo_escrow.get_balance():,.2f}",
            "saved_record": record
        }

class SubmissionData(BaseModel):
    title: str = "Submitted Clip"
    url: str
    campaignId: int = 1
    campaignName: str = ""
    campaignRate: float = 0.0
    payoutCap: float = 0.0
    enforce_30m: bool = False
    instant_approve: bool = False

@app.post("/api/track-views")
async def track_views(data: SubmissionData):
    result = ViewTracker.process_link(
        data.title,
        data.url,
        data.campaignId,
        data.campaignName,
        data.campaignRate,
        data.payoutCap,
        data.enforce_30m,
        data.instant_approve
    )
    return result