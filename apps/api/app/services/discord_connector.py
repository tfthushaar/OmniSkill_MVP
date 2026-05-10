"""
Discord OAuth2 integration.
Register a free application at: https://discord.com/developers/applications
Required scopes: identify, guilds
Set DISCORD_REDIRECT_URI to: https://your-api.onrender.com/connect/discord/callback
"""
import urllib.parse

import httpx
from fastapi import HTTPException, status

DISCORD_API = "https://discord.com/api/v10"


def build_auth_url(client_id: str, redirect_uri: str, state: str) -> str:
    params = {
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": "identify guilds",
        "state": state,
        "prompt": "consent",
    }
    return f"https://discord.com/api/oauth2/authorize?{urllib.parse.urlencode(params)}"


def exchange_code(client_id: str, client_secret: str, redirect_uri: str, code: str) -> dict:
    with httpx.Client(timeout=10.0) as client:
        resp = client.post(
            f"{DISCORD_API}/oauth2/token",
            data={
                "client_id": client_id,
                "client_secret": client_secret,
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": redirect_uri,
            },
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Discord OAuth token exchange failed — check DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET")
        return resp.json()


def get_current_user(access_token: str) -> dict:
    with httpx.Client(timeout=10.0) as client:
        resp = client.get(f"{DISCORD_API}/users/@me", headers={"Authorization": f"Bearer {access_token}"})
        resp.raise_for_status()
        return resp.json()


def get_guilds(access_token: str) -> list[dict]:
    with httpx.Client(timeout=10.0) as client:
        resp = client.get(f"{DISCORD_API}/users/@me/guilds", headers={"Authorization": f"Bearer {access_token}"})
        resp.raise_for_status()
        return resp.json()


def summarise(user: dict, guilds: list[dict]) -> dict:
    return {
        "discord_id": user.get("id", ""),
        "username": user.get("username", ""),
        "display_name": user.get("global_name") or user.get("username", ""),
        "avatar_url": (
            f"https://cdn.discordapp.com/avatars/{user['id']}/{user['avatar']}.png"
            if user.get("avatar")
            else ""
        ),
        "guild_count": len(guilds),
        "guilds": [{"id": g["id"], "name": g["name"]} for g in guilds[:20]],
    }
