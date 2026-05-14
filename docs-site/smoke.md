# Free Claude Code 烟雾测试

## 1. 概述

烟雾测试 (`smoke/`) 包含可选的产品烟雾场景，用于验证端到端功能。

## 2. 测试策略

### 2.1 测试分层

```
┌─────────────────────────────┐
│      smoke/ (产品烟雾)       │  ← 可选，需要 FCC_LIVE_SMOKE=1
├─────────────────────────────┤
│      tests/ (合约测试)       │  ← 必须通过
├─────────────────────────────┤
│     tests/unit/ (单元测试)   │  ← 必须通过
└─────────────────────────────┘
```

### 2.2 运行条件

| 测试类型 | 运行方式 | 说明 |
|----------|----------|------|
| 单元测试 | `uv run pytest` | 必须通过 |
| 合约测试 | `uv run pytest tests/contracts/` | 必须通过 |
| 烟雾测试 | `FCC_LIVE_SMOKE=1 uv run pytest smoke/` | 可选 |

## 3. 烟雾测试目录

```
smoke/
├── __init__.py
├── conftest.py
├── test_message_flow.py      # 消息流
├── test_provider_routing.py  # 提供商路由
├── test_streaming.py         # 流式处理
└── test_voice.py             # 语音功能
```

## 4. 烟雾测试示例

```python
# smoke/test_message_flow.py
@pytest.mark.smoke
@pytest.mark.skipif(
    not os.getenv("FCC_LIVE_SMOKE"),
    reason="Set FCC_LIVE_SMOKE=1 to run"
)
class TestMessageFlow:
    async def test_basic_chat(self, live_proxy_url: str):
        """测试基本聊天流程"""
        async with Client(live_proxy_url) as client:
            response = await client.messages.create(
                model="claude-sonnet-4-20250514",
                messages=[{"role": "user", "content": "Hello"}],
            )
            assert response.content[0].text

    async def test_streaming(self, live_proxy_url: str):
        """测试流式响应"""
        async with Client(live_proxy_url) as client:
            stream = client.messages.stream(
                model="claude-sonnet-4-20250514",
                messages=[{"role": "user", "content": "Count to 5"}],
            )
            events = []
            async for event in stream:
                events.append(event)
            assert len(events) > 0
```

## 5. Provider 路由测试

```python
# smoke/test_provider_routing.py
@pytest.mark.smoke
class TestProviderRouting:
    @pytest.mark.parametrize("model,expected_provider", [
        ("claude-opus-4-20250514", "nvidia_nim"),
        ("claude-sonnet-4-20250514", "kimi"),
        ("claude-haiku-3-20250514", "deepseek"),
    ])
    async def test_model_routing(
        self, live_proxy_url: str, model: str, expected_provider: str
    ):
        """测试模型到提供商的路由"""
        async with Client(live_proxy_url) as client:
            response = await client.messages.create(
                model=model,
                messages=[{"role": "user", "content": "Hi"}],
            )
            # 验证请求到达正确提供商
            # (通过响应头或日志验证)
```

## 6. 流式测试

```python
# smoke/test_streaming.py
@pytest.mark.smoke
class TestStreaming:
    async def test_thinking_blocks(self, live_proxy_url: str):
        """测试 thinking block 处理"""
        async with Client(live_proxy_url) as client:
            stream = client.messages.stream(
                model="claude-opus-4-20250514",
                messages=[{"role": "user", "content": "Think carefully"}],
                thinking={"type": "enabled", "budget_tokens": 1024},
            )
            thinking_events = []
            content_events = []

            async for event in stream:
                if event.type == "thinking_block_delta":
                    thinking_events.append(event)
                elif event.type == "content_block_delta":
                    content_events.append(event)

            assert len(thinking_events) > 0
            assert len(content_events) > 0

    async def test_tool_use(self, live_proxy_url: str):
        """测试工具使用"""
        async with Client(live_proxy_url) as client:
            stream = client.messages.stream(
                model="claude-sonnet-4-20250514",
                messages=[{"role": "user", "content": "List files"}],
                tools=[{"name": "bash", "description": "Run bash", "input_schema": {"type": "object"}}],
            )
            tool_events = []

            async for event in stream:
                if event.type == "tool_use":
                    tool_events.append(event)

            assert len(tool_events) > 0
```

## 7. 配置

### 7.1 环境变量

```bash
# 启用烟雾测试
export FCC_LIVE_SMOKE=1

# 指定测试的提供商
export FCC_SMOKE_PROVIDER=nvidia_nim

# 测试 URL
export FCC_SMOKE_URL=http://127.0.0.1:8082
```

### 7.2 Fixture

```python
# smoke/conftest.py
@pytest.fixture
def live_proxy_url() -> str:
    """获取实时代理 URL"""
    return os.getenv("FCC_SMOKE_URL", "http://127.0.0.1:8082")

@pytest.fixture
def smoke_provider() -> str:
    """获取烟雾测试提供商"""
    return os.getenv("FCC_SMOKE_PROVIDER", "nvidia_nim")
```

## 8. CI 集成

```yaml
# .github/workflows/smoke.yml
name: Smoke Tests

on:
  schedule:
    - cron: '0 2 * * *'  # 每天凌晨运行

jobs:
  smoke:
    if: env.FCC_LIVE_SMOKE == '1'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: astral-sh/setup-uv@v4
        with:
          enable-cache: true
      - run: uv python install 3.14
      - run: uv sync
      - run: uv run pytest smoke/ -v
        env:
          FCC_LIVE_SMOKE: '1'
          FCC_SMOKE_URL: ${{ secrets.FCC_SMOKE_URL }}
```

## 9. 测试覆盖策略

| 覆盖类型 | 说明 | 优先级 |
|----------|------|--------|
| 核心消息流 | 基本发送/接收 | P0 |
| 流式响应 | SSE 解析 | P0 |
| 工具使用 | 工具调用/结果 | P0 |
| Provider 路由 | 模型路由 | P1 |
| Thinking blocks | 推理块 | P1 |
| 语音转录 | Whisper | P2 |
