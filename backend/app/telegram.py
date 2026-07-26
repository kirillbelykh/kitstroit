import html
import logging

import httpx

logger = logging.getLogger(__name__)


def _line(label: str, value: object | None) -> str | None:
    if value is None or value == "":
        return None
    return f"{label}: {html.escape(str(value))}"


async def notify_new_lead(token: str, chat_ids: list[int], lead: dict) -> None:
    if not token or not chat_ids:
        return
    lines = [
        "<b>Новая заявка с kitstroit.ru</b>",
        f"Имя: {html.escape(str(lead.get('name') or ''))}",
        f"Телефон: {html.escape(str(lead.get('phone') or ''))}",
        f"Тип проекта: {html.escape(str(lead.get('project_type') or '—'))}",
        f"Сообщение: {html.escape(str(lead.get('message') or '—'))}",
    ]
    attribution = [
        _line("Источник", lead.get("utm_source")),
        _line("Кампания", lead.get("utm_campaign")),
        _line("yclid", lead.get("yclid")),
        _line("ClientID", lead.get("ym_client_id")),
        _line("Landing", lead.get("landing_page") or lead.get("first_landing_page")),
        _line("CTA", lead.get("cta")),
    ]
    attribution = [item for item in attribution if item]
    if attribution:
        lines.append("")
        lines.append("<b>Атрибуция</b>")
        lines.extend(attribution)
    text = "\n".join(lines)
    async with httpx.AsyncClient(timeout=8) as client:
        for chat_id in chat_ids:
            try:
                response = await client.post(
                    f"https://api.telegram.org/bot{token}/sendMessage",
                    json={"chat_id": chat_id, "text": text, "parse_mode": "HTML"},
                )
                response.raise_for_status()
            except httpx.HTTPError:
                logger.exception("Telegram lead notification failed for chat %s", chat_id)
