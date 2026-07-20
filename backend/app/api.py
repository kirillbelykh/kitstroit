import secrets
from pathlib import Path
from typing import Annotated, TypeVar
from uuid import uuid4

import anyio
from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, Response, UploadFile, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from .config import Settings, get_settings
from .db import get_session
from .models import Lead, Project, ProjectMedia, SiteSetting, TelegramSetting, TextSection
from .rate_limit import limit_leads, limit_logins
from .schemas import (
    LeadCreate,
    LeadOut,
    LeadUpdate,
    LoginIn,
    MediaCreate,
    MediaOut,
    MediaUpdate,
    ProjectCreate,
    ProjectOut,
    ProjectUpdate,
    PublicContent,
    SectionCreate,
    SectionOut,
    SectionUpdate,
    SettingCreate,
    SettingOut,
    SettingUpdate,
    TelegramOut,
    TelegramUpdate,
    UploadOut,
)
from .security import COOKIE_NAME, create_token, require_admin, verify_password
from .telegram import notify_new_lead


Session = Annotated[AsyncSession, Depends(get_session)]
Config = Annotated[Settings, Depends(get_settings)]
admin = APIRouter(prefix="/admin", dependencies=[Depends(require_admin)])
router = APIRouter(prefix="/api")
ModelT = TypeVar("ModelT")


async def commit(session: AsyncSession, obj: ModelT) -> ModelT:
    try:
        await session.commit()
    except IntegrityError as exc:
        await session.rollback()
        raise HTTPException(status_code=409, detail="A record with this key already exists") from exc
    await session.refresh(obj)
    return obj


async def get_or_404(session: AsyncSession, model: type[ModelT], object_id: int) -> ModelT:
    obj = await session.get(model, object_id)
    if obj is None:
        raise HTTPException(status_code=404, detail="Not found")
    return obj


@router.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/content", response_model=PublicContent)
async def public_content(session: Session) -> PublicContent:
    projects = list(
        (await session.scalars(select(Project).where(Project.published.is_(True)).order_by(Project.sort_order, Project.id))).all()
    )
    sections = list(
        (await session.scalars(select(TextSection).where(TextSection.enabled.is_(True)).order_by(TextSection.sort_order, TextSection.id))).all()
    )
    settings_rows = (await session.scalars(select(SiteSetting).where(SiteSetting.public.is_(True)))).all()
    telegram = await session.get(TelegramSetting, 1)
    return PublicContent(
        settings={row.key: row.value for row in settings_rows},
        sections=sections,
        projects=projects,
        telegram_username=telegram.bot_username if telegram and telegram.enabled else "",
    )


@router.post("/leads", response_model=LeadOut, status_code=201, dependencies=[Depends(limit_leads)])
async def create_lead(
    data: LeadCreate,
    background_tasks: BackgroundTasks,
    session: Session,
    settings: Config,
) -> Lead:
    lead = Lead(**data.model_dump(exclude={"website"}))
    session.add(lead)
    await commit(session, lead)
    telegram = await session.get(TelegramSetting, 1)
    if telegram and telegram.enabled:
        background_tasks.add_task(
            notify_new_lead,
            settings.telegram_bot_token,
            telegram.admin_chat_ids,
            data.model_dump(exclude={"consent", "website"}),
        )
    return lead


@router.post("/admin/login", status_code=204, dependencies=[Depends(limit_logins)])
async def login(data: LoginIn, response: Response, settings: Config) -> None:
    valid_password = verify_password(data.password, settings.admin_password_hash)
    valid_username = secrets.compare_digest(data.username, settings.admin_username)
    if not (valid_username and valid_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if len(settings.jwt_secret) < 32:
        raise HTTPException(status_code=503, detail="Admin authentication is not configured")
    response.set_cookie(
        COOKIE_NAME,
        create_token(settings),
        httponly=True,
        secure=settings.cookie_secure,
        samesite="strict",
        max_age=settings.jwt_ttl_minutes * 60,
        path="/api/admin",
    )


@admin.post("/logout", status_code=204)
async def logout(response: Response) -> None:
    response.delete_cookie(COOKIE_NAME, path="/api/admin")


UPLOAD_TYPES = {
    "image/jpeg": ("image", ".jpg", 15 * 1024 * 1024),
    "image/png": ("image", ".png", 15 * 1024 * 1024),
    "image/webp": ("image", ".webp", 15 * 1024 * 1024),
    "image/avif": ("image", ".avif", 15 * 1024 * 1024),
    "video/mp4": ("video", ".mp4", 100 * 1024 * 1024),
    "video/webm": ("video", ".webm", 100 * 1024 * 1024),
}


@admin.post("/uploads", response_model=UploadOut, status_code=201)
async def upload_media(file: Annotated[UploadFile, File()], settings: Config) -> UploadOut:
    media_type = (file.content_type or "").split(";", 1)[0].lower()
    if media_type not in UPLOAD_TYPES:
        await file.close()
        raise HTTPException(415, "Unsupported media type")
    kind, suffix, max_size = UPLOAD_TYPES[media_type]
    settings.upload_dir.mkdir(parents=True, exist_ok=True)
    filename = f"{uuid4().hex}{suffix}"
    target = settings.upload_dir / filename
    partial = Path(f"{target}.part")
    size = 0
    try:
        async with await anyio.open_file(partial, "wb") as output:
            while chunk := await file.read(1024 * 1024):
                size += len(chunk)
                if size > max_size:
                    raise HTTPException(413, f"File exceeds {max_size // (1024 * 1024)} MB limit")
                await output.write(chunk)
        if size == 0:
            raise HTTPException(400, "File is empty")
        partial.replace(target)
    except Exception:
        partial.unlink(missing_ok=True)
        target.unlink(missing_ok=True)
        raise
    finally:
        await file.close()
    return UploadOut(url=f"/uploads/{filename}", kind=kind)


@admin.get("/leads", response_model=list[LeadOut])
async def list_leads(session: Session) -> list[Lead]:
    return list((await session.scalars(select(Lead).order_by(Lead.created_at.desc()))).all())


@admin.patch("/leads/{lead_id}", response_model=LeadOut)
async def update_lead(lead_id: int, data: LeadUpdate, session: Session) -> Lead:
    lead = await get_or_404(session, Lead, lead_id)
    lead.status = data.status
    return await commit(session, lead)


@admin.delete("/leads/{lead_id}", status_code=204)
async def delete_lead(lead_id: int, session: Session) -> None:
    lead = await get_or_404(session, Lead, lead_id)
    await session.delete(lead)
    await session.commit()


@admin.get("/projects", response_model=list[ProjectOut])
async def list_projects(session: Session) -> list[Project]:
    return list((await session.scalars(select(Project).order_by(Project.sort_order, Project.id))).all())


@admin.post("/projects", response_model=ProjectOut, status_code=201)
async def create_project(data: ProjectCreate, session: Session) -> Project:
    project = Project(**data.model_dump())
    session.add(project)
    return await commit(session, project)


@admin.patch("/projects/{project_id}", response_model=ProjectOut)
async def update_project(project_id: int, data: ProjectUpdate, session: Session) -> Project:
    project = await get_or_404(session, Project, project_id)
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(project, key, value)
    return await commit(session, project)


@admin.delete("/projects/{project_id}", status_code=204)
async def delete_project(project_id: int, session: Session) -> None:
    project = await get_or_404(session, Project, project_id)
    await session.delete(project)
    await session.commit()


@admin.post("/projects/{project_id}/media", response_model=MediaOut, status_code=201)
async def create_media(project_id: int, data: MediaCreate, session: Session) -> ProjectMedia:
    await get_or_404(session, Project, project_id)
    media = ProjectMedia(project_id=project_id, **data.model_dump())
    session.add(media)
    return await commit(session, media)


@admin.patch("/media/{media_id}", response_model=MediaOut)
async def update_media(media_id: int, data: MediaUpdate, session: Session) -> ProjectMedia:
    media = await get_or_404(session, ProjectMedia, media_id)
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(media, key, value)
    return await commit(session, media)


@admin.delete("/media/{media_id}", status_code=204)
async def delete_media(media_id: int, session: Session) -> None:
    media = await get_or_404(session, ProjectMedia, media_id)
    await session.delete(media)
    await session.commit()


@admin.get("/texts", response_model=list[SectionOut])
async def list_sections(session: Session) -> list[TextSection]:
    return list((await session.scalars(select(TextSection).order_by(TextSection.sort_order, TextSection.id))).all())


@admin.post("/texts", response_model=SectionOut, status_code=201)
async def create_section(data: SectionCreate, session: Session) -> TextSection:
    section = TextSection(**data.model_dump())
    session.add(section)
    return await commit(session, section)


@admin.patch("/texts/{section_id}", response_model=SectionOut)
async def update_section(section_id: int, data: SectionUpdate, session: Session) -> TextSection:
    section = await get_or_404(session, TextSection, section_id)
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(section, key, value)
    return await commit(session, section)


@admin.delete("/texts/{section_id}", status_code=204)
async def delete_section(section_id: int, session: Session) -> None:
    section = await get_or_404(session, TextSection, section_id)
    await session.delete(section)
    await session.commit()


@admin.get("/settings", response_model=list[SettingOut])
async def list_settings(session: Session) -> list[SiteSetting]:
    return list((await session.scalars(select(SiteSetting).order_by(SiteSetting.key))).all())


@admin.post("/settings", response_model=SettingOut, status_code=201)
async def create_setting(data: SettingCreate, session: Session) -> SiteSetting:
    setting = SiteSetting(**data.model_dump())
    session.add(setting)
    return await commit(session, setting)


@admin.patch("/settings/{setting_id}", response_model=SettingOut)
async def update_setting(setting_id: int, data: SettingUpdate, session: Session) -> SiteSetting:
    setting = await get_or_404(session, SiteSetting, setting_id)
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(setting, key, value)
    return await commit(session, setting)


@admin.delete("/settings/{setting_id}", status_code=204)
async def delete_setting(setting_id: int, session: Session) -> None:
    setting = await get_or_404(session, SiteSetting, setting_id)
    await session.delete(setting)
    await session.commit()


@admin.get("/telegram", response_model=TelegramOut)
async def get_telegram(session: Session) -> TelegramSetting:
    telegram = await session.get(TelegramSetting, 1)
    if telegram is None:
        telegram = TelegramSetting(id=1)
        session.add(telegram)
        await commit(session, telegram)
    return telegram


@admin.put("/telegram", response_model=TelegramOut)
async def update_telegram(data: TelegramUpdate, session: Session) -> TelegramSetting:
    telegram = await session.get(TelegramSetting, 1)
    if telegram is None:
        telegram = TelegramSetting(id=1)
        session.add(telegram)
    for key, value in data.model_dump().items():
        setattr(telegram, key, value)
    return await commit(session, telegram)


router.include_router(admin)
