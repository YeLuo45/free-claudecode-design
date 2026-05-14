# Free Claude Code API 模块

## 1. 概述

API 模块 (`api/`) 负责 HTTP 路由、请求编排、模型路由、认证和应用生命周期。

## 2. 核心文件

| 文件 | 职责 |
|------|------|
| `routes.py` | API 路由定义 |
| `app.py` | FastAPI 应用工厂 |
| `runtime.py` | 应用组合和启动 |
| `dependencies.py` | 依赖注入 |
| `model_router.py` | 模型路由逻辑 |
| `detection.py` | 请求类型检测 |
| `admin_routes.py` | Admin UI 路由 |
| `admin_config.py` | Admin 配置 |
| `services.py` | 服务层 |

## 3. 应用工厂

```python
# api/app.py
def create_app() -> FastAPI:
    app = FastAPI()

    # 路由注册
    app.include_router(routes.router)

    # 中间件
    app.add_middleware(...)

    return app
```

## 4. 运行时组合

```python
# api/runtime.py
async def start_runtime():
    # 初始化消息栈
    await messaging.start()

    # 恢复会话存储
    session_store.restore()

    # 注册清理处理器
    atexit.register(cleanup)
```

## 5. 依赖注入

```python
# api/dependencies.py
async def get_provider(request: Request) -> Provider:
    """根据请求获取对应的 Provider"""
    registry = request.app.state.provider_registry
    return registry.get_for_model(request.model)
```

## 6. 模型路由

```python
# api/model_router.py
class ModelRouter:
    def route(self, model: str) -> ProviderType:
        """根据模型名称选择 Provider"""
        if model.startswith("opus"):
            return ProviderType.NVIDIA_NIM
        elif model.startswith("sonnet"):
            return ProviderType.KIMI
        # ...
```

## 7. API 端点

### 7.1 消息端点

```
POST /v1/messages
```

请求体：
```json
{
  "model": "claude-opus-4-20250514",
  "messages": [...],
  "tools": [...],
  "stream": true
}
```

### 7.2 模型列表

```
GET /v1/models
```

响应：
```json
{
  "models": [
    {"id": "claude-opus-4-20250514", "name": "Claude Opus 4"},
    {"id": "claude-sonnet-4-20250514", "name": "Claude Sonnet 4"}
  ]
}
```

### 7.3 Admin 端点

```
GET /admin
POST /admin/config
GET /admin/providers
```

## 8. 请求处理流程

```
HTTP 请求
    │
    ▼
detection.py — 检测请求类型
    │
    ▼
dependencies.py — 获取 Provider
    │
    ▼
model_router.py — 选择模型
    │
    ▼
Provider.adapt_request() — 转换请求
    │
    ▼
Provider.stream() / Provider.chat() — 发送请求
    │
    ▼
core/anthropic/ — 处理响应
    │
    ▼
返回流式/非流式响应
```

## 9. Admin UI

Admin UI 路由 (`/admin`) 提供：
- 可视化配置编辑
- 配置文件验证
- 提供商状态检查
- 请求日志查看

## 10. 错误处理

```python
# api/exceptions.py
class ProxyError(Exception):
    """代理错误基类"""

class ProviderError(ProxyError):
    """提供商错误"""

class AuthError(ProxyError):
    """认证错误"""
```

## 11. 请求优化

```python
# api/optimization_handlers.py
async def optimize_request(request: Request) -> Request:
    """本地请求优化"""
    # 合并小请求
    # 缓存响应
    # ...
```
