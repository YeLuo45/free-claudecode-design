# Free Claude Code CLI 模块

## 1. 概述

CLI 模块 (`cli/`) 负责 Claude CLI 子进程管理、生命周期控制和包入口点。

## 2. 目录结构

```
cli/
├── __init__.py
├── runner.py           # Claude CLI 运行器
├── subprocess.py        # 子进程管理
└── config.py           # CLI 配置
```

## 3. Claude CLI 运行器

```python
# cli/runner.py
class ClaudeRunner:
    def __init__(self, config: ClaudeRunnerConfig):
        self.config = config
        self.process: subprocess.Popen | None = None

    async def start(self):
        """启动 Claude CLI 子进程"""
        self.process = await subprocess.create(
            ["claude", *self.config.args],
            env=self.config.env,
            cwd=self.config.working_dir,
        )

    async def send(self, message: str):
        """发送消息到 Claude CLI"""
        if not self.process:
            raise RuntimeError("Process not started")
        await self.process.stdin.write(message)

    async def receive(self) -> str:
        """从 Claude CLI 接收响应"""
        if not self.process:
            raise RuntimeError("Process not started")
        return await self.process.stdout.read()

    async def stop(self):
        """停止 Claude CLI 子进程"""
        if self.process:
            self.process.terminate()
            await self.process.wait()
```

## 4. 子进程配置

```python
# cli/subprocess.py
@dataclass
class ClaudeRunnerConfig:
    """Claude CLI 运行配置"""
    model: str | None = None
    args: list[str] = field(default_factory=list)
    env: dict[str, str] = field(default_factory=dict_env)
    working_dir: Path = field(default_factory=Path.cwd)
    timeout: float | None = None

def create_subprocess(
    cmd: list[str],
    env: dict[str, str],
    cwd: Path,
) -> subprocess.Popen:
    """创建子进程"""
    return subprocess.Popen(
        cmd,
        env={**os.environ, **env},
        cwd=cwd,
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
```

## 5. 包入口点

```python
# cli/__main__.py
def main():
    """CLI 入口点"""
    parser = argparse.ArgumentParser(description="Free Claude Code CLI")
    parser.add_argument("--provider", choices=PROVIDER_TYPES)
    parser.add_argument("--model", default="claude-opus-4-20250514")
    args = parser.parse_args()

    runner = ClaudeRunner(config_from_args(args))
    asyncio.run(runner.start())

    # 事件循环
    loop = asyncio.get_event_loop()
    loop.run_until_complete(event_loop(runner))
```

## 6. 生命周期管理

```python
# cli/lifecycle.py
class CLILifecycleManager:
    def __init__(self, runner: ClaudeRunner):
        self.runner = runner
        self.started_at: datetime | None = None

    async def start(self):
        """启动生命周期"""
        await self.runner.start()
        self.started_at = datetime.now()

        # 注册清理钩子
        atexit.register(self.cleanup)

    def cleanup(self):
        """清理资源"""
        if self.runner.process:
            self.runner.process.terminate()

    def is_running(self) -> bool:
        """检查是否正在运行"""
        return (
            self.runner.process is not None
            and self.runner.process.poll() is None
        )

    def uptime(self) -> timedelta | None:
        """获取运行时间"""
        if not self.started_at:
            return None
        return datetime.now() - self.started_at
```

## 7. 与 API 的集成

```python
# api/runtime.py
async def start_runtime():
    # 初始化 CLI runner
    cli_runner = CLILifecycleManager(
        ClaudeRunner(config.cli_config)
    )
    await cli_runner.start()

    # 注入到 API
    app.state.cli_runner = cli_runner
```
