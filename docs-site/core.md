# Free Claude Code 核心模块

## 1. 概述

Core 模块 (`core/`) 包含 Anthropic 协议助手和流式原语，被 API、Providers、Messaging 和 Tests 共享。

## 2. 目录结构

```
core/
├── anthropic/           # Anthropic 协议助手
│   ├── __init__.py
│   ├── messages.py     # 消息处理
│   ├── stream.py        # 流式处理
│   ├── content.py       # 内容提取
│   ├── tokens.py        # Token 估算
│   ├── errors.py        # 错误消息
│   ├── request.py       # 请求转换
│   ├── thinking.py       # Thinking 块处理
│   └── tools.py          # 工具助手
└── rate_limit.py        # 核心限速
```

## 3. Anthropic 协议助手

### 3.1 消息处理

```python
# core/anthropic/messages.py
@dataclass
class Message:
    role: Literal["user", "assistant", "system"]
    content: str | list[ContentBlock]
    name: str | None = None

@dataclass
class ContentBlock:
    type: Literal["text", "tool_use", "tool_result"]
    text: str | None = None
    id: str | None = None
    name: str | None = None
    input: dict | None = None
    content: str | None = None
```

### 3.2 流式事件

```python
# core/anthropic/stream.py
@dataclass
class StreamEvent:
    type: str
    index: int | None = None
    delta: str | None = None
    usage: Usage | None = None
    stop_reason: str | None = None

class StreamParser:
    def parse(self, chunk: str) -> StreamEvent:
        """解析 SSE 事件"""
        pass

    def parse_server_event(self, data: dict) -> StreamEvent:
        """解析服务器事件"""
        pass
```

## 4. 内容提取

```python
# core/anthropic/content.py
def extract_text(blocks: list[ContentBlock]) -> str:
    """从 ContentBlock 列表提取文本"""
    parts = []
    for block in blocks:
        if block.type == "text":
            parts.append(block.text)
        elif block.type == "tool_result":
            parts.append(block.content)
    return "\n".join(parts)

def extract_tool_calls(blocks: list[ContentBlock]) -> list[ToolCall]:
    """提取工具调用"""
    return [b for b in blocks if b.type == "tool_use"]
```

## 5. Token 估算

```python
# core/anthropic/tokens.py
def estimate_tokens(text: str) -> int:
    """估算文本的 token 数量"""
    # 简单估算：中文约 2 token/字，英文约 1.3 token/词
    return int(len(text) * 1.5)

def count_messages_tokens(messages: list[Message]) -> int:
    """计算消息列表的总 token 数"""
    return sum(estimate_tokens(m.content) for m in messages)
```

## 6. 错误消息

```python
# core/anthropic/errors.py
USER_ERROR_MESSAGES: dict[str, str] = {
    "authentication_error": "认证失败，请检查 API 密钥。",
    "rate_limit_error": "请求频率超限，请稍后再试。",
    "invalid_request_error": "请求格式无效。",
    "model_requires_vision": "当前模型不支持视觉功能。",
    "model_requires_beta_role": "请设置 beta 头部。",
}

def get_user_message(error_code: str) -> str:
    """获取用户友好的错误消息"""
    return USER_ERROR_MESSAGES.get(error_code, "发生未知错误。")
```

## 7. 请求转换

```python
# core/anthropic/request.py
def convert_to_provider_format(
    request: AnthropicRequest,
    provider_type: ProviderType
) -> ProviderRequest:
    """将 Anthropic 请求转换为提供商格式"""
    return ProviderRequest(
        model=request.model,
        messages=convert_messages(request.messages),
        system=request.system,
        tools=convert_tools(request.tools),
        stream=request.stream,
        extra=provider_type.specific_settings,
    )
```

## 8. Thinking 块处理

```python
# core/anthropic/thinking.py
@dataclass
class ThinkingBlock:
    thinking: str
    type: str = "thinking"

def extract_thinking(blocks: list[ContentBlock]) -> str | None:
    """从 ContentBlock 提取 thinking 内容"""
    for block in blocks:
        if hasattr(block, 'thinking'):
            return block.thinking
    return None

def process_thinking_response(response: Response) -> Response:
    """处理包含 thinking 的响应"""
    if response.content and response.content.type == "thinking":
        # 处理 thinking 块
        pass
    return response
```

## 9. 工具助手

```python
# core/anthropic/tools.py
@dataclass
class Tool:
    name: str
    description: str
    input_schema: dict

@dataclass
class ToolCall:
    id: str
    name: str
    input: dict

def validate_tool_input(tool: Tool, input_data: dict) -> bool:
    """验证工具输入是否符合 schema"""
    # JSON Schema 验证
    pass

def format_tool_result(tool_call: ToolCall, result: Any) -> ToolResultBlock:
    """格式化工具结果"""
    return ToolResultBlock(
        type="tool_result",
        tool_use_id=tool_call.id,
        content=str(result)
    )
```

## 10. 流式契约

```python
# core/anthropic/stream_contracts.py
def assert_stream_contract(events: list[StreamEvent]) -> None:
    """验证流式事件符合契约"""
    for i, event in enumerate(events):
        assert event.type in VALID_STREAM_EVENTS, f"Invalid event type: {event.type}"
        assert event.index == i, f"Event index mismatch: {event.index} != {i}"

VALID_STREAM_EVENTS = {
    "message_start",
    "message_delta",
    "content_block_start",
    "content_block_delta",
    "content_block_stop",
    "message_stop",
}
```

## 11. 设计原则

| 原则 | 说明 |
|------|------|
| 共享位置 | Anthropic 协议逻辑放在 `core/anthropic/` |
| 无提供者依赖 | 不导入 `providers` 模块 |
| 合约验证 | 使用 `stream_contracts.py` 验证流式事件 |
| 错误映射 | 统一用户错误消息 |
