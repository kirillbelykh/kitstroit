import html
import logging

import httpx

logger = logging.getLogger(__name__)


async def notify_new_lead(token: str, chat_ids: list[int], lead: dict[str, str]) -> None:
    if not token or not chat_ids:
        return
    text = (
        "<b>Новая заявка с kitstroit.ru</b>\n"
        f"Имя: {html.escape(lead['name'])}\n"
        f"Телефон: {html.escape(lead['phone'])}\n"
        f"Тип проекта: {html.escape(lead.get('project_type') or '—')}\n"
        f"Сообщение: {html.escape(lead.get('message') or '—')}"
    )
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

