"""
Gaming platform connector routes.
Each provider:
  POST /connect/{provider}   → link account, fetch + store data
  POST /sync/{provider}      → re-fetch and update stored data
  DELETE /connections/{p}    → unlink account
  GET /connections           → list all linked accounts with latest stats
  GET /connect/discord/start → return OAuth URL
  GET /connect/discord/callback → OAuth callback (browser redirect)
"""
import secrets
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import RedirectResponse
from sqlmodel import Session, select

from app.core.config import settings
from app.db import get_session
from app.deps import get_current_user
from app.models import ConnectedAccount, DataSyncJob, RawDataSnapshot, User, utc_now
from app.schemas import (
    ConnectDiscordManualRequest,
    ConnectFaceitRequest,
    ConnectRiotRequest,
    ConnectSteamRequest,
    ConnectionWithStats,
)
from app.services import discord_connector, faceit, riot, steam

router = APIRouter(tags=["connectors"])


# ─── helpers ─────────────────────────────────────────────────────────────────

def _require_key(key: str, name: str) -> None:
    if not key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"{name} API key is not configured. Ask the platform admin to set the {name.upper()}_API_KEY environment variable.",
        )


def _upsert_account(
    session: Session,
    user_id: int,
    provider: str,
    account_id: str,
    display_name: str,
    scopes: list[str],
    token: str = "",
) -> ConnectedAccount:
    account = session.exec(
        select(ConnectedAccount)
        .where(ConnectedAccount.user_id == user_id)
        .where(ConnectedAccount.provider == provider)
    ).first()
    if not account:
        account = ConnectedAccount(user_id=user_id, provider=provider)
    account.provider_account_id = account_id
    account.display_name = display_name
    account.scopes = scopes
    account.token_reference = token
    account.last_synced_at = utc_now()
    session.add(account)
    return account


def _save_snapshot(session: Session, user_id: int, provider: str, external_id: str, data: dict[str, Any]) -> RawDataSnapshot:
    snap = RawDataSnapshot(
        user_id=user_id,
        provider=provider,
        external_id=external_id,
        snapshot=data,
    )
    session.add(snap)
    return snap


def _latest_snapshot(session: Session, user_id: int, provider: str) -> dict[str, Any]:
    snap = session.exec(
        select(RawDataSnapshot)
        .where(RawDataSnapshot.user_id == user_id)
        .where(RawDataSnapshot.provider == provider)
        .order_by(RawDataSnapshot.captured_at.desc())  # type: ignore[arg-type]
    ).first()
    return snap.snapshot if snap else {}


# ─── list connections ─────────────────────────────────────────────────────────

@router.get("/connections", response_model=list[ConnectionWithStats])
def list_connections(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> list[dict]:
    accounts = session.exec(
        select(ConnectedAccount).where(ConnectedAccount.user_id == current_user.id)
    ).all()
    result = []
    for acc in accounts:
        result.append({
            "id": acc.id,
            "user_id": acc.user_id,
            "provider": acc.provider,
            "provider_account_id": acc.provider_account_id,
            "display_name": acc.display_name,
            "scopes": acc.scopes,
            "connected_at": acc.connected_at,
            "last_synced_at": acc.last_synced_at,
            "stats": _latest_snapshot(session, current_user.id or 0, acc.provider),
        })
    return result


# ─── FACEIT ──────────────────────────────────────────────────────────────────

@router.post("/connect/faceit", response_model=ConnectionWithStats)
def connect_faceit(
    payload: ConnectFaceitRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> dict:
    _require_key(settings.faceit_api_key, "FACEIT")

    profile = faceit.get_player_profile(settings.faceit_api_key, payload.username)
    game, stats = faceit.get_player_stats(settings.faceit_api_key, profile["player_id"])
    summary = faceit.summarise(profile, game, stats)

    account = _upsert_account(
        session,
        user_id=current_user.id or 0,
        provider="faceit",
        account_id=profile["player_id"],
        display_name=profile.get("nickname", payload.username),
        scopes=["profile", "stats"],
    )
    snap = _save_snapshot(session, current_user.id or 0, "faceit", profile["player_id"], {
        "profile": profile,
        "game": game,
        "stats": stats,
        "summary": summary,
    })
    session.commit()
    session.refresh(account)

    return {
        "id": account.id,
        "user_id": account.user_id,
        "provider": account.provider,
        "provider_account_id": account.provider_account_id,
        "display_name": account.display_name,
        "scopes": account.scopes,
        "connected_at": account.connected_at,
        "last_synced_at": account.last_synced_at,
        "stats": snap.snapshot.get("summary", {}),
    }


# ─── Steam ────────────────────────────────────────────────────────────────────

@router.post("/connect/steam", response_model=ConnectionWithStats)
def connect_steam(
    payload: ConnectSteamRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> dict:
    _require_key(settings.steam_api_key, "STEAM")

    steam_id = steam.extract_steam_id(payload.steam_id)
    profile = steam.get_player_summary(settings.steam_api_key, steam_id)
    game_count = steam.get_owned_games_count(settings.steam_api_key, steam_id)
    summary = steam.summarise(profile, game_count)

    account = _upsert_account(
        session,
        user_id=current_user.id or 0,
        provider="steam",
        account_id=steam_id,
        display_name=profile.get("personaname", steam_id),
        scopes=["profile", "games"],
    )
    snap = _save_snapshot(session, current_user.id or 0, "steam", steam_id, {
        "profile": profile,
        "game_count": game_count,
        "summary": summary,
    })
    session.commit()
    session.refresh(account)

    return {
        "id": account.id,
        "user_id": account.user_id,
        "provider": account.provider,
        "provider_account_id": account.provider_account_id,
        "display_name": account.display_name,
        "scopes": account.scopes,
        "connected_at": account.connected_at,
        "last_synced_at": account.last_synced_at,
        "stats": summary,
    }


# ─── Riot Games ───────────────────────────────────────────────────────────────

@router.post("/connect/riot", response_model=ConnectionWithStats)
def connect_riot(
    payload: ConnectRiotRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> dict:
    _require_key(settings.riot_api_key, "RIOT")

    account_data = riot.get_account_by_riot_id(
        settings.riot_api_key, payload.game_name, payload.tag_line
    )
    summary = riot.summarise(account_data, payload.game_name, payload.tag_line)

    account = _upsert_account(
        session,
        user_id=current_user.id or 0,
        provider="riot",
        account_id=account_data.get("puuid", f"{payload.game_name}#{payload.tag_line}"),
        display_name=f"{account_data.get('gameName', payload.game_name)}#{account_data.get('tagLine', payload.tag_line)}",
        scopes=["account"],
    )
    snap = _save_snapshot(session, current_user.id or 0, "riot", account_data.get("puuid", ""), {
        "account": account_data,
        "summary": summary,
    })
    session.commit()
    session.refresh(account)

    return {
        "id": account.id,
        "user_id": account.user_id,
        "provider": account.provider,
        "provider_account_id": account.provider_account_id,
        "display_name": account.display_name,
        "scopes": account.scopes,
        "connected_at": account.connected_at,
        "last_synced_at": account.last_synced_at,
        "stats": summary,
    }


# ─── Discord OAuth ────────────────────────────────────────────────────────────

@router.get("/connect/discord/start")
def discord_oauth_start(current_user: User = Depends(get_current_user)) -> dict:
    if not settings.discord_client_id:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Discord OAuth is not configured. Set DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET.",
        )
    state = f"{current_user.id}:{secrets.token_urlsafe(16)}"
    auth_url = discord_connector.build_auth_url(
        settings.discord_client_id,
        settings.discord_redirect_uri,
        state,
    )
    return {"auth_url": auth_url}


@router.get("/connect/discord/callback")
def discord_oauth_callback(
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
    session: Session = Depends(get_session),
) -> RedirectResponse:
    frontend = settings.frontend_url

    if error or not code:
        return RedirectResponse(url=f"{frontend}/dashboard?connection_error=discord_denied")

    try:
        tokens = discord_connector.exchange_code(
            settings.discord_client_id,
            settings.discord_client_secret,
            settings.discord_redirect_uri,
            code,
        )
        access_token = tokens["access_token"]
        user_data = discord_connector.get_current_user(access_token)
        guilds = discord_connector.get_guilds(access_token)
        summary = discord_connector.summarise(user_data, guilds)

        user_id = int(state.split(":")[0]) if state and ":" in state else None
        if not user_id:
            return RedirectResponse(url=f"{frontend}/dashboard?connection_error=discord_state")

        account = _upsert_account(
            session,
            user_id=user_id,
            provider="discord",
            account_id=user_data.get("id", ""),
            display_name=summary["display_name"],
            scopes=tokens.get("scope", "identify guilds").split(),
            token=access_token,
        )
        _save_snapshot(session, user_id, "discord", user_data.get("id", ""), {
            "user": user_data,
            "guild_count": len(guilds),
            "summary": summary,
        })
        session.commit()

    except Exception:
        return RedirectResponse(url=f"{frontend}/dashboard?connection_error=discord_failed")

    return RedirectResponse(url=f"{frontend}/dashboard?connection_success=discord")


@router.post("/connect/discord/manual", response_model=ConnectionWithStats)
def discord_manual_connect(
    payload: ConnectDiscordManualRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> dict:
    """
    Fallback: store a Discord username manually when OAuth isn't configured.
    Verification level will remain self-reported (level 1).
    """
    account = _upsert_account(
        session,
        user_id=current_user.id or 0,
        provider="discord",
        account_id=payload.discord_id or payload.username,
        display_name=payload.username,
        scopes=["manual"],
    )
    summary = {"username": payload.username, "discord_id": payload.discord_id, "linked_via": "manual"}
    _save_snapshot(session, current_user.id or 0, "discord", payload.discord_id or payload.username, {"summary": summary})
    session.commit()
    session.refresh(account)

    return {
        "id": account.id,
        "user_id": account.user_id,
        "provider": account.provider,
        "provider_account_id": account.provider_account_id,
        "display_name": account.display_name,
        "scopes": account.scopes,
        "connected_at": account.connected_at,
        "last_synced_at": account.last_synced_at,
        "stats": summary,
    }


# ─── Disconnect ───────────────────────────────────────────────────────────────

@router.delete("/connections/{provider}", status_code=status.HTTP_204_NO_CONTENT)
def disconnect_provider(
    provider: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> None:
    account = session.exec(
        select(ConnectedAccount)
        .where(ConnectedAccount.user_id == current_user.id)
        .where(ConnectedAccount.provider == provider.lower())
    ).first()
    if not account:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"{provider} account not connected")
    session.delete(account)
    session.commit()


# ─── Re-sync ──────────────────────────────────────────────────────────────────

@router.post("/sync/{provider}", response_model=ConnectionWithStats)
def sync_provider(
    provider: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> dict:
    """Re-fetch data for an already-connected provider."""
    provider = provider.lower()
    account = session.exec(
        select(ConnectedAccount)
        .where(ConnectedAccount.user_id == current_user.id)
        .where(ConnectedAccount.provider == provider)
    ).first()
    if not account:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"{provider} account not connected — connect it first")

    job = DataSyncJob(user_id=current_user.id or 0, provider=provider, status="running")
    session.add(job)
    session.commit()

    try:
        summary: dict[str, Any] = {}

        if provider == "faceit":
            _require_key(settings.faceit_api_key, "FACEIT")
            profile = faceit.get_player_profile(settings.faceit_api_key, account.display_name)
            game, stats = faceit.get_player_stats(settings.faceit_api_key, profile["player_id"])
            summary = faceit.summarise(profile, game, stats)
            _save_snapshot(session, current_user.id or 0, "faceit", profile["player_id"], {"profile": profile, "game": game, "stats": stats, "summary": summary})

        elif provider == "steam":
            _require_key(settings.steam_api_key, "STEAM")
            steam_id = account.provider_account_id
            prof = steam.get_player_summary(settings.steam_api_key, steam_id)
            gc = steam.get_owned_games_count(settings.steam_api_key, steam_id)
            summary = steam.summarise(prof, gc)
            _save_snapshot(session, current_user.id or 0, "steam", steam_id, {"profile": prof, "game_count": gc, "summary": summary})

        elif provider == "riot":
            _require_key(settings.riot_api_key, "RIOT")
            parts = account.display_name.split("#", 1)
            game_name, tag_line = (parts[0], parts[1]) if len(parts) == 2 else (account.display_name, "")
            acc_data = riot.get_account_by_riot_id(settings.riot_api_key, game_name, tag_line)
            summary = riot.summarise(acc_data, game_name, tag_line)
            _save_snapshot(session, current_user.id or 0, "riot", acc_data.get("puuid", ""), {"account": acc_data, "summary": summary})

        elif provider == "discord":
            summary = _latest_snapshot(session, current_user.id or 0, "discord").get("summary", {})

        account.last_synced_at = utc_now()
        session.add(account)
        job.status = "completed"
        session.add(job)
        session.commit()
        session.refresh(account)

    except HTTPException:
        job.status = "failed"
        session.add(job)
        session.commit()
        raise

    return {
        "id": account.id,
        "user_id": account.user_id,
        "provider": account.provider,
        "provider_account_id": account.provider_account_id,
        "display_name": account.display_name,
        "scopes": account.scopes,
        "connected_at": account.connected_at,
        "last_synced_at": account.last_synced_at,
        "stats": summary,
    }
