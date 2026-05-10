"""
FACEIT Data API v4 integration.
Docs: https://developers.faceit.com/docs/apis/data
Free API key: https://developers.faceit.com (register, create app)
"""
import httpx
from fastapi import HTTPException, status

FACEIT_BASE = "https://open.faceit.com/data/v4"

# Games we try to pull stats for, in preference order
GAMES = ["cs2", "csgo", "valorant", "dota2", "lol"]


def _headers(api_key: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {api_key}"}


def get_player_profile(api_key: str, nickname: str) -> dict:
    """Return raw FACEIT player profile by nickname."""
    with httpx.Client(timeout=10.0) as client:
        resp = client.get(
            f"{FACEIT_BASE}/players",
            params={"nickname": nickname},
            headers=_headers(api_key),
        )
        if resp.status_code == 404:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"FACEIT player '{nickname}' not found")
        if resp.status_code == 401:
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Invalid FACEIT API key — check your FACEIT_API_KEY setting")
        resp.raise_for_status()
        return resp.json()


def get_player_stats(api_key: str, player_id: str) -> tuple[str, dict]:
    """Return (game_id, stats_dict) for the first game the player has stats in."""
    with httpx.Client(timeout=10.0) as client:
        for game in GAMES:
            resp = client.get(
                f"{FACEIT_BASE}/players/{player_id}/stats/{game}",
                headers=_headers(api_key),
            )
            if resp.status_code == 200:
                return game, resp.json()
    return "unknown", {}


def summarise(profile: dict, game: str, stats: dict) -> dict:
    """Extract career-relevant numbers into a flat summary dict."""
    games_info = profile.get("games", {})
    game_data = games_info.get(game, {})
    lifetime = stats.get("lifetime", {})

    return {
        "player_id": profile.get("player_id", ""),
        "nickname": profile.get("nickname", ""),
        "avatar": profile.get("avatar", ""),
        "country": profile.get("country", ""),
        "game": game,
        "skill_level": game_data.get("skill_level", "—"),
        "faceit_elo": game_data.get("faceit_elo", "—"),
        "region": game_data.get("region", ""),
        "matches": lifetime.get("Matches", "—"),
        "win_rate": lifetime.get("Win Rate %", "—"),
        "kd_ratio": lifetime.get("K/D Ratio", "—"),
        "avg_kd": lifetime.get("Average K/D Ratio", "—"),
        "headshots_pct": lifetime.get("Average Headshots %", "—"),
        "profile_url": f"https://www.faceit.com/en/players/{profile.get('nickname', '')}",
    }
