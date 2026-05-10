"""
Steam Web API integration.
Free API key: https://steamcommunity.com/dev/apikey
"""
import re

import httpx
from fastapi import HTTPException, status

STEAM_BASE = "https://api.steampowered.com"


def extract_steam_id(raw: str) -> str:
    """
    Accept a SteamID64 (17-digit number) or a Steam profile URL.
    Returns the SteamID64 string, or raises HTTPException on bad input.
    """
    raw = raw.strip()
    if re.fullmatch(r"\d{17}", raw):
        return raw
    m = re.search(r"steamcommunity\.com/profiles/(\d{17})", raw)
    if m:
        return m.group(1)
    raise HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        detail="Provide a 17-digit SteamID64 or a steam profile URL like steamcommunity.com/profiles/76561198...",
    )


def get_player_summary(api_key: str, steam_id: str) -> dict:
    with httpx.Client(timeout=10.0) as client:
        resp = client.get(
            f"{STEAM_BASE}/ISteamUser/GetPlayerSummaries/v2/",
            params={"key": api_key, "steamids": steam_id},
        )
        if resp.status_code == 403:
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Invalid Steam API key — check your STEAM_API_KEY setting")
        resp.raise_for_status()
        players = resp.json().get("response", {}).get("players", [])
        if not players:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Steam profile not found — check the SteamID64 and make sure the profile is public")
        return players[0]


def get_owned_games_count(api_key: str, steam_id: str) -> int:
    """Return total number of owned games (0 if profile is private)."""
    with httpx.Client(timeout=10.0) as client:
        resp = client.get(
            f"{STEAM_BASE}/IPlayerService/GetOwnedGames/v1/",
            params={"key": api_key, "steamid": steam_id, "include_appinfo": "false"},
        )
        if resp.status_code != 200:
            return 0
        return resp.json().get("response", {}).get("game_count", 0)


def summarise(profile: dict, game_count: int) -> dict:
    visibility = profile.get("communityvisibilitystate", 1)
    return {
        "steam_id": profile.get("steamid", ""),
        "display_name": profile.get("personaname", ""),
        "avatar": profile.get("avatarfull", ""),
        "profile_url": profile.get("profileurl", ""),
        "visibility": "Public" if visibility == 3 else "Private",
        "game_count": game_count,
        "country": profile.get("loccountrycode", ""),
        "real_name": profile.get("realname", ""),
    }
