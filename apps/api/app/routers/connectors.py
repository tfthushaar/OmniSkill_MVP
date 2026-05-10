from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from app.db import get_session
from app.deps import get_current_user
from app.models import ConnectedAccount, DataSyncJob, RawDataSnapshot, User, utc_now
from app.schemas import ConnectedAccountCreate, ConnectedAccountRead, SyncJobRead

router = APIRouter(tags=["connectors"])


@router.post("/connect/{provider}", response_model=ConnectedAccountRead)
def connect_provider(
    provider: str,
    payload: ConnectedAccountCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> ConnectedAccount:
    provider = provider.lower()
    account = session.exec(
        select(ConnectedAccount).where(ConnectedAccount.user_id == current_user.id).where(ConnectedAccount.provider == provider)
    ).first()
    if not account:
        account = ConnectedAccount(user_id=current_user.id or 0, provider=provider)
    account.provider_account_id = payload.provider_account_id
    account.display_name = payload.display_name
    account.scopes = payload.scopes
    session.add(account)
    session.commit()
    session.refresh(account)
    return account


@router.post("/sync/{provider}", response_model=SyncJobRead)
def sync_provider(
    provider: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> DataSyncJob:
    provider = provider.lower()
    job = DataSyncJob(user_id=current_user.id or 0, provider=provider, status="completed")
    session.add(job)
    session.add(
        RawDataSnapshot(
            user_id=current_user.id or 0,
            provider=provider,
            external_id="manual-mvp-snapshot",
            snapshot={
                "note": "Connector contract is ready. Real OAuth/API ingestion is implemented per provider after MVP validation.",
                "captured_by": "sync_placeholder",
            },
        )
    )
    account = session.exec(
        select(ConnectedAccount).where(ConnectedAccount.user_id == current_user.id).where(ConnectedAccount.provider == provider)
    ).first()
    if account:
        account.last_synced_at = utc_now()
        session.add(account)
    session.commit()
    session.refresh(job)
    return job

