from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from google.cloud import aiplatform
from langchain_core.callbacks import CallbackManagerForLLMRun
from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.messages import AIMessage, BaseMessage
from langchain_core.outputs import ChatGeneration, ChatResult


@dataclass(frozen=True)
class MediaPart:
    kind: str
    mime_type: str
    data_base64: str
    file_name: str | None = None


class GemmaVertexEndpoint(BaseChatModel):
    """Adaptador LangChain para un Gemma auto-desplegado en Vertex AI."""

    project_id: str
    location: str
    endpoint_id: str
    request_schema: str = "vllm"
    media_schema: str = "auto"
    temperature: float = 0.0
    max_output_tokens: int = 1024

    @property
    def _llm_type(self) -> str:
        return "gemma-vertex-endpoint"

    def _generate(
        self,
        messages: list[BaseMessage],
        stop: list[str] | None = None,
        run_manager: CallbackManagerForLLMRun | None = None,
        **kwargs: Any,
    ) -> ChatResult:
        return self._generate_with_media(messages, media=[], stop=stop)

    def invoke_multimodal(
        self, messages: list[BaseMessage], media: list[MediaPart]
    ) -> AIMessage:
        """Invoke the deployed Gemma container with explicit media payloads.

        Vertex custom endpoints do not impose a universal instance schema. The
        selected ``media_schema`` must match the prediction handler used when
        the Gemma model was deployed.
        """
        result = self._generate_with_media(messages, media=media, stop=None)
        return result.generations[0].message

    def _generate_with_media(
        self,
        messages: list[BaseMessage],
        *,
        media: list[MediaPart],
        stop: list[str] | None,
    ) -> ChatResult:
        prompt = "\n\n".join(
            f"{message.type.upper()}: {message.content}" for message in messages
        )
        prompt = self._add_media_placeholders(prompt, media)
        endpoint = aiplatform.Endpoint(
            endpoint_name=self.endpoint_id,
            project=self.project_id,
            location=self.location,
        )
        parameters = {
            "temperature": self.temperature,
            "max_tokens": self.max_output_tokens,
        }
        if stop:
            parameters["stop"] = stop
        if self.request_schema == "prompt":
            instance: dict[str, Any] = {"prompt": prompt, **parameters}
        elif self.request_schema == "vllm":
            instance = {"inputs": prompt, "parameters": parameters}
        else:
            raise ValueError(
                "HABLAPE_GEMMA_REQUEST_SCHEMA debe ser prompt o vllm."
            )
        media_schemas = (
            ["gemma4", "inline_data"]
            if media and self.media_schema == "auto"
            else [self.media_schema]
        )
        response = None
        last_error: Exception | None = None
        for index, media_schema in enumerate(media_schemas):
            candidate = dict(instance)
            if media:
                candidate.update(
                    self._media_payload(prompt, media, schema=media_schema)
                )
            try:
                response = endpoint.predict(instances=[candidate])
                break
            except Exception as exc:
                last_error = exc
                can_try_alternate = (
                    index < len(media_schemas) - 1
                    and "Status code:400" in str(exc)
                )
                if not can_try_alternate:
                    raise
        if response is None:
            assert last_error is not None
            raise last_error
        text = self._prediction_text(response.predictions[0])
        return ChatResult(generations=[ChatGeneration(message=AIMessage(content=text))])

    @staticmethod
    def _add_media_placeholders(prompt: str, media: list[MediaPart]) -> str:
        placeholders: list[str] = []
        for item in media:
            token = "<|image|>" if item.kind == "image" else "<|audio|>"
            placeholders.append(token)
        if not placeholders:
            return prompt
        return f"{prompt}\n\nENTRADA MULTIMODAL:\n{' '.join(placeholders)}"

    def _media_payload(
        self,
        prompt: str,
        media: list[MediaPart],
        *,
        schema: str | None = None,
    ) -> dict[str, Any]:
        selected_schema = schema or self.media_schema
        if selected_schema == "gemma4":
            images = [
                {
                    "mime_type": item.mime_type,
                    "data": {"b64": item.data_base64},
                }
                for item in media
                if item.kind == "image"
            ]
            audios = [
                {
                    "mime_type": item.mime_type,
                    "data": {"b64": item.data_base64},
                }
                for item in media
                if item.kind == "audio"
            ]
            payload: dict[str, Any] = {}
            if images:
                payload["images"] = images
            if audios:
                payload["audios"] = audios
            return payload
        if selected_schema == "inline_data":
            parts: list[dict[str, Any]] = [{"text": prompt}]
            parts.extend(
                {
                    "inline_data": {
                        "mime_type": item.mime_type,
                        "data": item.data_base64,
                    }
                }
                for item in media
            )
            return {"contents": [{"role": "user", "parts": parts}]}
        raise ValueError(
            "HABLAPE_GEMMA_MEDIA_SCHEMA debe ser auto, gemma4 o inline_data."
        )

    @staticmethod
    def _prediction_text(prediction: Any) -> str:
        if isinstance(prediction, str):
            return prediction
        if isinstance(prediction, list) and prediction:
            return GemmaVertexEndpoint._prediction_text(prediction[0])
        if isinstance(prediction, dict):
            choices = prediction.get("choices")
            if isinstance(choices, list) and choices:
                choice = choices[0]
                if isinstance(choice, dict):
                    message = choice.get("message")
                    if isinstance(message, dict) and message.get("content"):
                        return str(message["content"])
            for key in (
                "generated_text",
                "output",
                "outputs",
                "text",
                "content",
            ):
                if key in prediction:
                    return GemmaVertexEndpoint._prediction_text(prediction[key])
        raise ValueError(f"Respuesta de Gemma no reconocida: {type(prediction)!r}")

