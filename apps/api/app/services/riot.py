"""
Riot Games Account API v1 integration.
Free developer key: https://developer.riotgames.com
Note: Developer keys expire every 24 hours. Production keys require approval.

Regions for account-v1 (global routing):
  americas, asia, europe, esports
"""
import httpx
from fastapi import HTTPException, status

# account-v1 routes to regional clusters; "europe" covers EUNE/EUW/TR/RU
# "americas" covers NA/BR/LAN/LAS; "asia" covers KR/JP
ROUTING_MAP = {
    "euw1": "europe", "eun1": "europe", "tr1": "europe", "ru": "europe",
    "na1": "americas", "br1": "americas", "la1": "americas", "la2": "americas",
    "kr": "asia", "jp1": "asia",
    "oc1": "sea", "ph2": "sea", "sg2": "sea", "th2": "sea", "tw2": "sea", "vn2": "sea",
}
DEFAULT_REGION = "europe"


def get_account_by_riot_id(api_key: str, game_name: str, tag_line: str, region: str = DEFAULT_REGION) -> dict:
    """Fetch Riot account by Riot ID (gameName + tagLine)."""
    cluster = ROUTING_MAP.get(region.lower(), region)
    url = f"https://{cluster}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/{game_name}/{tag_line}"
    with httpx.Client(timeout=10.0) as client:
        resp = client.get(url, headers={"X-Riot-Token": api_key})
        if resp.status_code == 403:
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Invalid or expired Riot API key — developer keys expire every 24 h; check RIOT_API_KEY")
        if resp.status_code == 404:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Riot account '{game_name}#{tag_line}' not found")
        resp.raise_for_status()
        return resp.json()


def summarise(account: dict, game_name: str, tag_line: str) -> dict:
    return {
        "puuid": account.get("puuid", ""),
        "game_name": account.get("gameName", game_name),
        "tag_line": account.get("tagLine", tag_line),
        "riot_id": f"{account.get('gameName', game_name)}#{account.get('tagLine', tag_line)}",
        "profile_url": f"https://www.op.gg/summoners/euw/{account.get('gameName', game_name)}-{account.get('tagLine', tag_line)}",
    }
