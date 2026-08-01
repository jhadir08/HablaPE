from __future__ import annotations

from typing import Any

from google.cloud import aiplatform
from langchain_core.callbacks import CallbackManagerForLLMRun
from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.messages import AIMessage, BaseMessage
from langchain_core.outputs import ChatGeneration, ChatResult


class GemmaVertexEndpoint(BaseChatModel):
    """Adaptador LangChain para un Gemma auto-desplegado en Vertex AI."""

    project_id: str
    location: str
    endpoint_id: str
    request_schema: str = "vllm"
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
        prompt = "\n\n".join(
            f"{message.type.upper()}: {message.content}" for message in messages
        )
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
            instances = [{"prompt": prompt, **parameters}]
        else:
            instances = [{"inputs": prompt, "parameters": parameters}]
        response = endpoint.predict(instances=instances)
        text = self._prediction_text(response.predictions[0])
        return ChatResult(generations=[ChatGeneration(message=AIMessage(content=text))])

    @staticmethod
    def _prediction_text(prediction: Any) -> str:
        if isinstance(prediction, str):
            return prediction
        if isinstance(prediction, list) and prediction:
            return GemmaVertexEndpoint._prediction_text(prediction[0])
        if isinstance(prediction, dict):
            for key in ("generated_text", "output", "outputs", "text"):
                if key in prediction:
                    return GemmaVertexEndpoint._prediction_text(prediction[key])
        raise ValueError(f"Respuesta de Gemma no reconocida: {type(prediction)!r}")

