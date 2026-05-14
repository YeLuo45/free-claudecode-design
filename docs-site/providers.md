# Free Claude Code 提供商

## 1. 概述

Providers 模块 (`providers/`) 负责上游模型适配，包括请求转换、流式转换、限速和错误映射。

## 2. 提供商列表

| 提供商 | 描述 | 特点 |
|--------|------|------|
| `nvidia_nim` | NVIDIA NIM | 云端 NVIDIA 推理 |
| `kimi` | Kimi | 国产大模型 |
| `wafer` | Wafer | 第三方代理 |
| `open_router` | OpenRouter | 聚合多个模型 |
| `deepseek` | DeepSeek | 深度探索 |
| `lmstudio` | LM Studio | 本地模型 |
| `llamacpp` | llama.cpp | 本地推理 |
| `ollama` | Ollama | 本地推理 |

## 3. Provider 基类

```python
# providers/base.py
class Provider(ABC):
    def __init__(self, settings: ProviderSettings):
        self.settings = settings
        self.rate_limiter = RateLimiter(settings.limits)

    @abstractmethod
    async def chat(
        self, request: AnthropicMessageRequest
    ) -> AnthropicMessageResponse:
        """发送聊天请求"""
        pass

    @abstractmethod
    async def stream(
        self, request: AnthropicMessageRequest
    ) -> AsyncIterator[StreamEvent]:
        """发送流式请求"""
        pass

    def adapt_request(self, request: Request) -> AdaptedRequest:
        """转换请求格式"""
        pass

    def adapt_response(self, response: Response) -> AdaptedResponse:
        """转换响应格式"""
        pass
```

## 4. Provider 注册表

```python
# providers/registry.py
class ProviderRegistry:
    def __init__(self):
        self._providers: dict[ProviderType, type[Provider]] = {}

    def register(self, provider_type: ProviderType, cls: type[Provider]):
        self._providers[provider_type] = cls

    def get(self, provider_type: ProviderType) -> Provider:
        return self._providers[provider_type]()

    def get_for_model(self, model: str) -> Provider:
        """根据模型名称选择 Provider"""
        for provider_type, cls in self._providers.items():
            if cls.supports_model(model):
                return cls()
        raise UnsupportedModelError(model)
```

## 5. 默认配置

```python
# providers/defaults.py
NVIDIA_NIM_DEFAULT_BASE = "https://integrate.api.nvidia.com/v1"
KIMI_DEFAULT_BASE = "https://api.moonshot.cn/v1"
OPENROUTER_DEFAULT_BASE = "https://openrouter.ai/v1"
DEEPSEEK_DEFAULT_BASE = "https://api.deepseek.com/v1"
LMSTUDIO_DEFAULT_BASE = "http://localhost:1234/v1"
OLLAMA_DEFAULT_BASE = "http://localhost:11434/v1"
LLAMACPP_DEFAULT_BASE = "http://localhost:8080/v1"
WAFER_DEFAULT_BASE = "https://wafer.example.com/v1"
```

## 6. 限速器

```python
# providers/rate_limit.py
class RateLimiter:
    def __init__(self, limits: RateLimits):
        self.limits = limits
        self.tokens = limits.requests_per_minute

    async def acquire(self):
        """获取限速令牌"""
        if self.tokens <= 0:
            await asyncio.sleep(self.cooldown)
        self.tokens -= 1
```

## 7. 错误映射

```python
# providers/error_mapping.py
ERROR_MAPPINGS: dict[str, ProviderErrorMapping] = {
    "rate_limit_exceeded": ProviderErrorMapping(
        status=429,
        retry_after=60,
        message="Rate limit exceeded. Please wait."
    ),
    "invalid_api_key": ProviderErrorMapping(
        status=401,
        retry_after=None,
        message="Invalid API key."
    ),
    # ...
}

def map_error(error: UpstreamError) -> ProxyError:
    mapping = ERROR_MAPPINGS.get(error.code, DEFAULT_MAPPING)
    return ProxyError(mapping.message, status=mapping.status)
```

## 8. Anthropic 消息转换

```python
# providers/anthropic_messages.py
def to_anthropic_message(request: Request) -> AnthropicMessageRequest:
    """将代理请求转换为 Anthropic 格式"""
    return AnthropicMessageRequest(
        model=request.model,
        messages=[to_message(m) for m in request.messages],
        system=to_system(request.system),
        tools=to_tools(request.tools),
        stream=request.stream,
    )

def from_anthropic_response(response: Response) -> ProxyResponse:
    """将 Anthropic 响应转换为代理格式"""
    return ProxyResponse(
        content=response.content,
        stop_reason=response.stop_reason,
        model=response.model,
        usage=Usage(
            input_tokens=response.usage.input_tokens,
            output_tokens=response.usage.output_tokens,
        )
    )
```

## 9. 模型列表

```python
# providers/model_listing.py
MODELS: dict[ProviderType, list[ModelInfo]] = {
    ProviderType.NVIDIA_NIM: [
        ModelInfo(id="nvidia/llama-3.1-nemotron-70b-instruct", name="Nemotron 70B"),
        ModelInfo(id="nvidia/llama-3-70b-instruct", name="Llama 3 70B"),
    ],
    ProviderType.OLLAMA: [
        ModelInfo(id="llama3", name="Llama 3"),
        ModelInfo(id="mistral", name="Mistral"),
    ],
    # ...
}
```

## 10. 使用示例

```python
# 选择 Provider
registry = ProviderRegistry()
provider = registry.get_for_model("claude-opus-4-20250514")

# 发送请求
response = await provider.chat(request)

# 流式请求
async for event in provider.stream(request):
    print(event)
```
