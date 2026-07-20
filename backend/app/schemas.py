import re
from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


KEY_RE = re.compile(r"^[a-z][a-z0-9_-]{1,99}$")
SLUG_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")


class ApiModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class LoginIn(BaseModel):
    username: str = Field(min_length=1, max_length=100)
    password: str = Field(min_length=8, max_length=200)


class LeadCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    phone: str = Field(min_length=7, max_length=32)
    project_type: str | None = Field(default=None, max_length=100)
    message: str | None = Field(default=None, max_length=3000)
    consent: Literal[True]
    website: Literal[""] = ""

    @field_validator("name", "phone", "project_type", "message", mode="before")
    @classmethod
    def strip_strings(cls, value: Any) -> Any:
        return value.strip() if isinstance(value, str) else value

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value: str) -> str:
        if not 7 <= len(re.sub(r"\D", "", value)) <= 15:
            raise ValueError("phone must contain 7 to 15 digits")
        return value


class LeadUpdate(BaseModel):
    status: Literal["new", "in_progress", "won", "lost"]


class LeadOut(ApiModel):
    id: int
    name: str
    phone: str
    project_type: str | None
    message: str | None
    status: str
    consent: bool
    created_at: datetime
    updated_at: datetime


class MediaBase(BaseModel):
    kind: Literal["image", "video"] = "image"
    url: str = Field(min_length=1, max_length=500)
    alt: str = Field(default="", max_length=300)
    poster_url: str = Field(default="", max_length=500)
    sort_order: int = Field(default=0, ge=-10_000, le=10_000)
    extra: dict[str, Any] = Field(default_factory=dict)


class MediaCreate(MediaBase):
    pass


class MediaUpdate(BaseModel):
    kind: Literal["image", "video"] | None = None
    url: str | None = Field(default=None, min_length=1, max_length=500)
    alt: str | None = Field(default=None, max_length=300)
    poster_url: str | None = Field(default=None, max_length=500)
    sort_order: int | None = Field(default=None, ge=-10_000, le=10_000)
    extra: dict[str, Any] | None = None


class MediaOut(MediaBase, ApiModel):
    id: int
    project_id: int


class ProjectBase(BaseModel):
    slug: str = Field(min_length=1, max_length=120)
    title: str = Field(min_length=1, max_length=200)
    summary: str = Field(default="", max_length=5000)
    location: str = Field(default="", max_length=200)
    area: str = Field(default="", max_length=100)
    year: str = Field(default="", max_length=20)
    cover_url: str = Field(default="", max_length=500)
    sort_order: int = Field(default=0, ge=-10_000, le=10_000)
    published: bool = False

    @field_validator("slug")
    @classmethod
    def validate_slug(cls, value: str) -> str:
        if not SLUG_RE.fullmatch(value):
            raise ValueError("slug must contain lowercase letters, digits and hyphens")
        return value


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    slug: str | None = Field(default=None, min_length=1, max_length=120)
    title: str | None = Field(default=None, min_length=1, max_length=200)
    summary: str | None = Field(default=None, max_length=5000)
    location: str | None = Field(default=None, max_length=200)
    area: str | None = Field(default=None, max_length=100)
    year: str | None = Field(default=None, max_length=20)
    cover_url: str | None = Field(default=None, max_length=500)
    sort_order: int | None = Field(default=None, ge=-10_000, le=10_000)
    published: bool | None = None

    @field_validator("slug")
    @classmethod
    def validate_slug(cls, value: str | None) -> str | None:
        if value is not None and not SLUG_RE.fullmatch(value):
            raise ValueError("slug must contain lowercase letters, digits and hyphens")
        return value


class ProjectOut(ProjectBase, ApiModel):
    id: int
    media: list[MediaOut] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime


class SectionBase(BaseModel):
    key: str = Field(min_length=2, max_length=100)
    eyebrow: str = Field(default="", max_length=200)
    title: str = Field(default="", max_length=300)
    body: str = Field(default="", max_length=20_000)
    cta_label: str = Field(default="", max_length=100)
    cta_url: str = Field(default="", max_length=500)
    sort_order: int = Field(default=0, ge=-10_000, le=10_000)
    enabled: bool = True

    @field_validator("key")
    @classmethod
    def validate_key(cls, value: str) -> str:
        if not KEY_RE.fullmatch(value):
            raise ValueError("key must contain lowercase letters, digits, _ or -")
        return value


class SectionCreate(SectionBase):
    pass


class SectionUpdate(BaseModel):
    key: str | None = Field(default=None, min_length=2, max_length=100)
    eyebrow: str | None = Field(default=None, max_length=200)
    title: str | None = Field(default=None, max_length=300)
    body: str | None = Field(default=None, max_length=20_000)
    cta_label: str | None = Field(default=None, max_length=100)
    cta_url: str | None = Field(default=None, max_length=500)
    sort_order: int | None = Field(default=None, ge=-10_000, le=10_000)
    enabled: bool | None = None

    @field_validator("key")
    @classmethod
    def validate_key(cls, value: str | None) -> str | None:
        if value is not None and not KEY_RE.fullmatch(value):
            raise ValueError("key must contain lowercase letters, digits, _ or -")
        return value


class SectionOut(SectionBase, ApiModel):
    id: int
    created_at: datetime
    updated_at: datetime


class SettingBase(BaseModel):
    key: str = Field(min_length=2, max_length=100)
    value: str = Field(default="", max_length=20_000)
    public: bool = True

    @field_validator("key")
    @classmethod
    def validate_key(cls, value: str) -> str:
        if not KEY_RE.fullmatch(value):
            raise ValueError("key must contain lowercase letters, digits, _ or -")
        return value


class SettingCreate(SettingBase):
    pass


class SettingUpdate(BaseModel):
    key: str | None = Field(default=None, min_length=2, max_length=100)
    value: str | None = Field(default=None, max_length=20_000)
    public: bool | None = None

    @field_validator("key")
    @classmethod
    def validate_key(cls, value: str | None) -> str | None:
        if value is not None and not KEY_RE.fullmatch(value):
            raise ValueError("key must contain lowercase letters, digits, _ or -")
        return value


class SettingOut(SettingBase, ApiModel):
    id: int
    created_at: datetime
    updated_at: datetime


class TelegramUpdate(BaseModel):
    bot_username: str = Field(default="", max_length=100)
    admin_chat_ids: list[int] = Field(default_factory=list, max_length=50)
    enabled: bool = False

    @field_validator("bot_username")
    @classmethod
    def normalize_username(cls, value: str) -> str:
        return value.strip().removeprefix("@")


class TelegramOut(TelegramUpdate, ApiModel):
    id: int


class UploadOut(BaseModel):
    url: str
    kind: Literal["image", "video"]


class PublicContent(BaseModel):
    settings: dict[str, str]
    sections: list[SectionOut]
    projects: list[ProjectOut]
    telegram_username: str = ""
