from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any
from urllib import error, request

from app.core.config import settings


@dataclass(slots=True)
class LLMResult:
    content: str
    model: str


class LLMService:
    def __init__(self) -> None:
        self.api_key = settings.llm_api_key.strip()
        self.base_url = settings.llm_base_url.rstrip("/")
        self.model = settings.llm_model.strip()
        self.timeout_seconds = max(settings.llm_timeout_seconds, 5)

    @property
    def enabled(self) -> bool:
        return bool(self.api_key and self.model)

    def generate_text(
        self,
        *,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.2,
        max_output_tokens: int = 900,
    ) -> LLMResult | None:
        if not self.enabled:
            return None

        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": temperature,
            "max_tokens": max_output_tokens,
        }
        body = json.dumps(payload).encode("utf-8")
        req = request.Request(
            url=f"{self.base_url}/chat/completions",
            data=body,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.api_key}",
            },
            method="POST",
        )

        try:
            with request.urlopen(req, timeout=self.timeout_seconds) as response:
                data = json.loads(response.read().decode("utf-8"))
        except (TimeoutError, error.URLError, error.HTTPError, json.JSONDecodeError):
            return None

        content = self._extract_message_content(data)
        if not content:
            return None
        return LLMResult(content=content, model=self.model)

    @staticmethod
    def _extract_message_content(payload: dict[str, Any]) -> str:
        choices = payload.get("choices") or []
        if not choices:
            return ""
        message = choices[0].get("message") or {}
        content = message.get("content")
        if isinstance(content, str):
            return content.strip()
        if isinstance(content, list):
            parts: list[str] = []
            for item in content:
                if isinstance(item, dict) and item.get("type") == "text":
                    text = item.get("text")
                    if isinstance(text, str):
                        parts.append(text)
            return "\n".join(parts).strip()
        return ""
