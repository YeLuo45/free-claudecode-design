# Free Claude Code 消息系统

## 1. 概述

Messaging 模块 (`messaging/`) 负责 Discord 和 Telegram 适配器、命令处理、树形线程、会话持久化和转录渲染。

## 2. 目录结构

```
messaging/
├── __init__.py
├── handler.py              # 消息处理
├── commands.py             # 命令定义
├── session.py              # 会话管理
├── transcript.py           # 转录渲染
├── command_dispatcher.py    # 命令分发
├── event_parser.py          # 事件解析
├── limiter.py              # 限流器
├── cli_event_constants.py   # CLI 事件常量
├── ui_updates.py           # UI 更新
├── node_event_pipeline.py   # 节点事件管道
├── safe_diagnostics.py      # 安全诊断
├── transcription.py         # 转录
├── voice.py                 # 语音处理
├── platforms/               # 平台适配器
│   ├── discord/
│   └── telegram/
├── rendering/              # 渲染
└── trees/                  # 树形结构
```

## 3. 消息处理

```python
# messaging/handler.py
class MessageHandler:
    def __init__(self, platform: Platform):
        self.platform = platform
        self.dispatcher = CommandDispatcher()
        self.session_manager = SessionManager()

    async def handle(self, event: PlatformEvent) -> Response:
        """处理平台事件"""
        # 解析事件
        parsed = self.event_parser.parse(event)

        # 检查限流
        if await self.limiter.is_limited(parsed.user_id):
            return RateLimitedResponse()

        # 分发命令
        command = self.dispatcher.dispatch(parsed)
        if command:
            return await command.execute(parsed)

        # 默认：转发到 AI
        return await self.ai_proxy.chat(parsed)
```

## 4. 命令系统

```python
# messaging/commands.py
@dataclass
class Command:
    name: str
    description: str
    usage: str
    handler: Callable

class BuiltinCommands:
    @staticmethod
    @command(name="/model", description="切换模型", usage="/model <model_name>")
    async def switch_model(ctx: CommandContext) -> Response:
        model = ctx.args[0] if ctx.args else None
        await ctx.session.set_model(model)
        return Response(f"Switched to {model}")

    @staticmethod
    @command(name="/help", description="显示帮助")
    async def help(ctx: CommandContext) -> Response:
        return Response(BuiltinCommands.all_commands())
```

## 5. 命令分发

```python
# messaging/command_dispatcher.py
class CommandDispatcher:
    def __init__(self):
        self.commands: dict[str, Command] = {}

    def register(self, command: Command):
        self.commands[command.name] = command

    def dispatch(self, event: ParsedEvent) -> Command | None:
        """根据输入分发命令"""
        text = event.content.strip()

        if not text.startswith("/"):
            return None

        parts = text.split()
        name = parts[0]

        return self.commands.get(name)

    async def execute(self, command: Command, ctx: CommandContext):
        """执行命令"""
        try:
            return await command.handler(ctx)
        except Exception as e:
            return ErrorResponse(f"Command failed: {e}")
```

## 6. 会话管理

```python
# messaging/session.py
@dataclass
class MessagingSession:
    id: str
    platform: Platform
    user_id: str
    created_at: datetime
    last_active: datetime
    model: str | None
    context: list[Message]

class SessionManager:
    def __init__(self, store: SessionStore):
        self.store = store

    async def get_or_create(self, platform: Platform, user_id: str) -> MessagingSession:
        """获取或创建会话"""
        session = await self.store.get(platform, user_id)
        if not session:
            session = MessagingSession(
                id=uuid4(),
                platform=platform,
                user_id=user_id,
                created_at=datetime.now(),
                last_active=datetime.now(),
                model=None,
                context=[]
            )
            await self.store.save(session)
        return session

    async def update(self, session: MessagingSession):
        """更新会话"""
        session.last_active = datetime.now()
        await self.store.save(session)
```

## 7. 事件解析

```python
# messaging/event_parser.py
class EventParser:
    def parse(self, event: dict) -> ParsedEvent:
        """解析平台事件为统一格式"""
        if event["platform"] == "discord":
            return self.parse_discord(event)
        elif event["platform"] == "telegram":
            return self.parse_telegram(event)

@dataclass
class ParsedEvent:
    platform: Platform
    user_id: str
    content: str
    message_id: str
    reply_to: str | None
    attachments: list[Attachment]
```

## 8. 限流器

```python
# messaging/limiter.py
class Limiter:
    def __init__(self):
        self.user_buckets: dict[str, TokenBucket] = {}

    async def is_limited(self, user_id: str) -> bool:
        """检查用户是否被限流"""
        bucket = self.user_buckets.get(user_id)
        if not bucket:
            self.user_buckets[user_id] = TokenBucket(
                rate=10,  # 10 messages
                interval=60  # per minute
            )
            bucket = self.user_buckets[user_id]
        return not bucket.try_acquire()

@dataclass
class TokenBucket:
    tokens: int
    rate: int
    interval: int
    last_refill: datetime

    def try_acquire(self) -> bool:
        self.refill()
        if self.tokens > 0:
            self.tokens -= 1
            return True
        return False
```

## 9. 转录渲染

```python
# messaging/transcript.py
class TranscriptRenderer:
    def render(self, session: MessagingSession) -> str:
        """渲染会话转录为文本"""
        lines = [f"# Transcript: {session.id}"]
        lines.append(f"Platform: {session.platform.value}")
        lines.append(f"Model: {session.model or 'default'}")
        lines.append("")

        for msg in session.context:
            lines.append(self.format_message(msg))

        return "\n".join(lines)

    def format_message(self, msg: Message) -> str:
        role = msg.role.upper()
        content = msg.content if isinstance(msg.content, str) else str(msg.content)
        return f"**{role}**: {content}"
```

## 10. 平台适配器

### 10.1 Discord

```python
# messaging/platforms/discord/
class DiscordAdapter:
    def __init__(self, token: str):
        self.client = DiscordClient(token)

    async def send_message(self, channel_id: str, content: str):
        await self.client.create_message(channel_id, content)

    def parse_event(self, payload: dict) -> PlatformEvent:
        return PlatformEvent(
            platform=Platform.DISCORD,
            user_id=payload["author"]["id"],
            content=payload["content"],
            message_id=payload["id"],
        )
```

### 10.2 Telegram

```python
# messaging/platforms/telegram/
class TelegramAdapter:
    def __init__(self, token: str):
        self.client = TelegramClient(token)

    async def send_message(self, chat_id: str, content: str):
        await self.client.send_message(chat_id, content)

    def parse_event(self, payload: dict) -> PlatformEvent:
        return PlatformEvent(
            platform=Platform.TELEGRAM,
            user_id=payload["from"]["id"],
            content=payload["text"],
            message_id=payload["id"],
        )
```

## 11. 语音处理

```python
# messaging/voice.py
class VoiceHandler:
    def __init__(self, whisper_provider: WhisperProvider):
        self.whisper = whisper_provider

    async def transcribe(self, audio_data: bytes) -> str:
        """转录音频为文本"""
        return await self.whisper.transcribe(audio_data)
```
