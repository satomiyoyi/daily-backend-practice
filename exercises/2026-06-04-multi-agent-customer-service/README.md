# 练习题解答：设计一个 Multi-Agent 客服系统

## 前置知识：什么是 Agent？

在 AI 语境下，Agent = LLM + 工具 + 循环决策能力。

一个普通的 LLM 调用是这样的：

```
输入 prompt → LLM → 输出文本
```

一个 Agent 是这样的：

```
输入任务 → LLM 思考下一步 → 调用工具 → 拿到结果 → LLM 再思考 → 可能再调工具 → ... → 最终回答
```

核心区别：Agent 有一个 **循环**（loop），LLM 不是一次性生成答案，而是反复"思考-行动-观察"直到任务完成。

## 前置知识：什么是 Multi-Agent？

单个 Agent 用一个 LLM 实例 + 它的工具集来完成所有事情。

Multi-Agent 是把任务分配给多个 Agent，每个 Agent：
- 有自己的 system prompt（角色定义）
- 有自己的工具集（只能做特定的事）
- 有自己的知识范围

为什么要拆分？和微服务的道理一样：
- **单一职责**：每个 Agent 只做一件事，prompt 短而精确
- **出错隔离**：售后 Agent 出 bug 不影响售前
- **独立迭代**：改进技术支持不需要动其他部分

## 系统全景

```
┌─────────────────────────────────────────────────┐
│                  API Gateway                      │
│    (接收用户消息，维护 WebSocket 连接)            │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│              Orchestrator（编排器）               │
│                                                   │
│  职责：                                           │
│  1. 管理对话状态机                                │
│  2. 调用 Router 决定走哪个 Agent                  │
│  3. 执行 Agent 并返回结果                         │
│  4. 判断是否需要转人工                            │
└────────┬──────────────┬──────────────┬──────────┘
         │              │              │
         ▼              ▼              ▼
┌────────────┐  ┌────────────┐  ┌────────────┐
│ Router     │  │ 领域 Agent │  │ Escalation │
│ Agent      │  │ (多个)     │  │ Manager    │
│            │  │            │  │ (转人工)   │
└────────────┘  └────────────┘  └────────────┘
```

## 第一步：实现最小 Agent（单个函数）

一个 Agent 的最简实现就是一个函数。用 Python + OpenAI API 举例：

```python
import openai
import json

client = openai.OpenAI()

def run_agent(system_prompt: str, tools: list, user_message: str) -> str:
    """
    最小 Agent 实现：一个带工具的 LLM 循环
    """
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_message}
    ]

    # Agent 循环：反复调用 LLM 直到它不再需要工具
    while True:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            tools=tools,  # 告诉 LLM 它可以用哪些工具
        )

        choice = response.choices[0]

        # 如果 LLM 决定不调用工具了，说明它准备好了最终回答
        if choice.finish_reason == "stop":
            return choice.message.content

        # 如果 LLM 要调用工具
        if choice.message.tool_calls:
            messages.append(choice.message)  # 把 LLM 的决策加入对话

            for tool_call in choice.message.tool_calls:
                # 执行工具（后面会详细讲）
                result = execute_tool(tool_call.function.name,
                                     json.loads(tool_call.function.arguments))

                # 把工具结果告诉 LLM
                messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "content": json.dumps(result)
                })
            # 继续循环，让 LLM 看到工具结果后再决定下一步
```

这就是 Agent 的核心：一个 while True 循环 + tool calling。

## 第二步：实现 Router Agent

Router 的职责很简单：看用户说了什么，决定交给谁处理。

```python
ROUTER_SYSTEM_PROMPT = """你是一个客服路由器。
根据用户的消息，判断应该交给哪个部门处理。

你必须输出 JSON 格式：
{
  "department": "pre_sales" | "after_sales" | "technical" | "fallback",
  "confidence": 0.0-1.0,
  "reasoning": "简短说明为什么这样分类"
}

分类规则：
- pre_sales: 咨询产品功能、价格、购买建议
- after_sales: 退换货、退款、物流问题、订单查询
- technical: 产品使用故障、技术问题、bug 报告
- fallback: 无法判断、闲聊、或多个类别都沾边
"""

def route_message(user_message: str, conversation_history: list) -> dict:
    """
    调用 LLM 做意图分类。
    注意：Router 不需要工具，它只做分类判断。
    """
    messages = [
        {"role": "system", "content": ROUTER_SYSTEM_PROMPT},
    ]
    # 带上最近几轮对话，帮助 LLM 理解上下文
    for msg in conversation_history[-3:]:
        messages.append(msg)
    messages.append({"role": "user", "content": user_message})

    response = client.chat.completions.create(
        model="gpt-4o-mini",  # Router 用便宜快速的模型就够了
        messages=messages,
        response_format={"type": "json_object"},  # 强制输出 JSON
    )

    result = json.loads(response.choices[0].message.content)
    return result  # {"department": "after_sales", "confidence": 0.85, ...}
```

**为什么 Router 用小模型？**
- 意图分类是相对简单的任务
- Router 每条消息都要跑，用大模型太贵
- gpt-4o-mini 做分类足够准确，延迟低

## 第三步：实现领域 Agent（以售后为例）

```python
# ========== 售后 Agent 的工具定义 ==========

AFTER_SALES_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "query_order",
            "description": "根据订单号或用户ID查询订单状态",
            "parameters": {
                "type": "object",
                "properties": {
                    "order_id": {"type": "string", "description": "订单号"},
                    "user_id": {"type": "string", "description": "用户ID"}
                },
                "required": ["order_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "initiate_refund",
            "description": "发起退款申请。金额超过500元需要人工审批。",
            "parameters": {
                "type": "object",
                "properties": {
                    "order_id": {"type": "string"},
                    "reason": {"type": "string"},
                    "amount": {"type": "number"}
                },
                "required": ["order_id", "reason", "amount"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "check_logistics",
            "description": "查询物流信息",
            "parameters": {
                "type": "object",
                "properties": {
                    "tracking_number": {"type": "string"}
                },
                "required": ["tracking_number"]
            }
        }
    }
]

AFTER_SALES_SYSTEM_PROMPT = """你是售后客服专员。

你的职责：
1. 帮用户查询订单状态和物流信息
2. 处理退换货请求
3. 处理退款（500元以下可直接操作，500元以上告知用户需要人工审批）

规则：
- 退款前必须先查询订单确认订单存在
- 如果用户情绪激动，表达理解并尽快解决问题
- 如果问题超出你的能力范围（比如技术故障），告知用户你会转接技术支持

语气：专业、耐心、有同理心。
"""

# ========== 工具执行层 ==========

def execute_tool(tool_name: str, arguments: dict) -> dict:
    """
    工具执行器：真正去调用后端 API
    在真实系统中，这里会调用微服务/数据库
    """
    if tool_name == "query_order":
        # 实际调用订单服务
        return order_service.get_order(arguments["order_id"])

    elif tool_name == "initiate_refund":
        if arguments["amount"] > 500:
            # 大额退款走人工审批队列
            approval_service.create_approval(arguments)
            return {"status": "pending_approval", "message": "已提交人工审批"}
        else:
            return refund_service.process_refund(arguments)

    elif tool_name == "check_logistics":
        return logistics_service.track(arguments["tracking_number"])

    else:
        return {"error": f"Unknown tool: {tool_name}"}
```

## 第四步：Orchestrator（编排器）—— 核心粘合层

```python
from enum import Enum
from dataclasses import dataclass
from typing import Optional
import time

class ConversationState(Enum):
    """对话状态机"""
    ROUTING = "routing"           # 正在判断意图
    IN_AGENT = "in_agent"         # 某个 Agent 正在处理
    ESCALATING = "escalating"     # 正在转人工
    CLOSED = "closed"             # 对话结束

@dataclass
class ConversationContext:
    """一次对话的完整上下文"""
    session_id: str
    user_id: str
    state: ConversationState
    current_agent: Optional[str]       # 当前由哪个 Agent 处理
    history: list                       # 完整对话历史
    routing_failures: int = 0           # 路由失败计数
    agent_loop_count: int = 0           # Agent 循环次数（防死循环）
    sentiment_score: float = 0.0        # 情绪分数
    created_at: float = 0.0

class Orchestrator:
    """
    编排器：整个系统的大脑
    负责状态管理、Agent 调度、异常处理
    """

    def __init__(self):
        self.agents = {
            "pre_sales": Agent(PRE_SALES_SYSTEM_PROMPT, PRE_SALES_TOOLS),
            "after_sales": Agent(AFTER_SALES_SYSTEM_PROMPT, AFTER_SALES_TOOLS),
            "technical": Agent(TECHNICAL_SYSTEM_PROMPT, TECHNICAL_TOOLS),
            "fallback": Agent(FALLBACK_SYSTEM_PROMPT, []),  # 兜底 Agent 无工具
        }
        self.contexts: dict[str, ConversationContext] = {}  # session_id -> context

    async def handle_message(self, session_id: str, user_id: str, message: str) -> str:
        """处理一条用户消息的完整流程"""

        # 1. 获取或创建对话上下文
        ctx = self._get_or_create_context(session_id, user_id)
        ctx.history.append({"role": "user", "content": message})

        # 2. 情绪检测（简单实现：可以用另一个 LLM 调用，或规则引擎）
        ctx.sentiment_score = await self._detect_sentiment(message)

        # 3. 检查是否需要强制转人工
        if self._should_escalate(ctx):
            return await self._escalate_to_human(ctx)

        # 4. 路由：决定交给哪个 Agent
        if ctx.state == ConversationState.ROUTING or ctx.current_agent is None:
            route_result = route_message(message, ctx.history)

            if route_result["confidence"] < 0.7:
                ctx.routing_failures += 1
                if ctx.routing_failures >= 2:
                    return await self._escalate_to_human(ctx)
                # 用 fallback agent 追问
                ctx.current_agent = "fallback"
            else:
                ctx.current_agent = route_result["department"]
                ctx.routing_failures = 0

            ctx.state = ConversationState.IN_AGENT

        # 5. 执行对应的 Agent
        agent = self.agents[ctx.current_agent]
        response = await agent.run(message, ctx.history)

        # 6. 记录回复
        ctx.history.append({"role": "assistant", "content": response})

        # 7. 循环检测
        ctx.agent_loop_count += 1
        if ctx.agent_loop_count > 10:  # 防止 Agent 死循环
            return await self._escalate_to_human(ctx)

        return response

    def _should_escalate(self, ctx: ConversationContext) -> bool:
        """判断是否需要转人工"""
        # 情绪极度负面
        if ctx.sentiment_score < -0.8:
            return True
        # Agent 循环过多（可能卡住了）
        if ctx.agent_loop_count > 8:
            return True
        return False

    async def _escalate_to_human(self, ctx: ConversationContext) -> str:
        """转人工流程"""
        ctx.state = ConversationState.ESCALATING
        # 生成对话摘要给人工客服看
        summary = await self._generate_summary(ctx.history)
        # 推送到人工客服队列
        await human_queue.push({
            "session_id": ctx.session_id,
            "user_id": ctx.user_id,
            "summary": summary,
            "full_history": ctx.history,
            "sentiment": ctx.sentiment_score,
        })
        return "您的问题需要人工客服协助，我正在为您转接，请稍候..."

    async def _detect_sentiment(self, message: str) -> float:
        """
        情绪检测。
        简单实现：用 LLM 打分 -1.0 到 1.0
        生产环境可以用专门的情绪分类模型（更快更便宜）
        """
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "对以下用户消息的情绪打分，-1.0=极度愤怒，0=中性，1.0=非常满意。只输出数字。"},
                {"role": "user", "content": message}
            ]
        )
        try:
            return float(response.choices[0].message.content.strip())
        except ValueError:
            return 0.0
```

## 第五步：Memory（记忆系统）

Agent 需要记忆来避免重复提问、理解上下文。记忆分两层：

```python
import redis
from qdrant_client import QdrantClient

class MemoryStore:
    """
    双层记忆系统：
    - 短期记忆（Redis）：当前对话的完整历史，TTL 24小时
    - 长期记忆（向量数据库）：用户画像、历史交互摘要
    """

    def __init__(self):
        self.redis = redis.Redis()
        self.vector_db = QdrantClient(url="localhost:6333")

    # ===== 短期记忆 =====

    def save_turn(self, session_id: str, role: str, content: str):
        """保存一轮对话"""
        key = f"conversation:{session_id}"
        turn = json.dumps({"role": role, "content": content, "ts": time.time()})
        self.redis.rpush(key, turn)
        self.redis.expire(key, 86400)  # 24小时过期

    def get_recent_history(self, session_id: str, n: int = 10) -> list:
        """获取最近 N 轮对话"""
        key = f"conversation:{session_id}"
        turns = self.redis.lrange(key, -n, -1)
        return [json.loads(t) for t in turns]

    # ===== 长期记忆 =====

    def save_user_profile(self, user_id: str, profile: dict):
        """
        保存用户画像：
        - 历史购买记录摘要
        - 常见问题偏好
        - 情绪倾向
        - 上次对话摘要
        """
        # 将 profile 文本 embedding 后存入向量数据库
        text = json.dumps(profile, ensure_ascii=False)
        embedding = self._get_embedding(text)
        self.vector_db.upsert(
            collection_name="user_profiles",
            points=[{"id": user_id, "vector": embedding, "payload": profile}]
        )

    def get_user_context(self, user_id: str) -> dict:
        """获取用户的长期画像"""
        results = self.vector_db.retrieve(
            collection_name="user_profiles",
            ids=[user_id]
        )
        return results[0].payload if results else {}

    # ===== Agent 间摘要传递 =====

    def save_agent_summary(self, session_id: str, agent_name: str, summary: str):
        """
        当对话从一个 Agent 转到另一个时，
        前一个 Agent 写入结构化摘要而不是传递完整对话。
        这样下一个 Agent 不需要读全部历史。
        """
        key = f"handoff:{session_id}"
        self.redis.rpush(key, json.dumps({
            "from_agent": agent_name,
            "summary": summary,
            "ts": time.time()
        }))

    def get_handoff_summaries(self, session_id: str) -> list:
        """获取之前 Agent 的交接摘要"""
        key = f"handoff:{session_id}"
        summaries = self.redis.lrange(key, 0, -1)
        return [json.loads(s) for s in summaries]
```

## 第六步：完整的请求处理流程（串起来）

一条用户消息从进入到响应的完整路径：

```
1. 用户发送 "我昨天买的耳机坏了，要退货"
   │
2. API Gateway 收到消息，找到对应 session_id
   │
3. Orchestrator.handle_message() 被调用
   │
4. 情绪检测 → sentiment_score = -0.3（轻微负面，不需要转人工）
   │
5. Router Agent 分类：
   │  输入："我昨天买的耳机坏了，要退货"
   │  输出：{"department": "after_sales", "confidence": 0.92}
   │
6. Orchestrator 选择 after_sales Agent
   │
7. After-sales Agent 开始 Agent 循环：
   │
   │  第一轮：
   │  ├── LLM 思考："用户要退货，我需要先查订单"
   │  ├── LLM 调用工具：query_order(user_id="U123")
   │  ├── 工具返回：{"order_id": "ORD456", "item": "无线耳机", "status": "delivered"}
   │  └── LLM 继续思考...
   │
   │  第二轮：
   │  ├── LLM 思考："订单确认存在，商品已签收，可以发起退货"
   │  ├── LLM 决定不调用工具了，生成最终回复
   │  └── finish_reason = "stop"
   │
8. Agent 返回回复："我查到了您昨天的订单 ORD456（无线耳机），已签收。
   │  我可以帮您发起退货申请。请问是产品质量问题还是其他原因？
   │  退货后款项将在3-5个工作日退回原支付方式。"
   │
9. Orchestrator 记录对话历史，返回给用户
```

## 第七步：可观测性（你怎么知道系统工作正常？）

```python
import structlog

logger = structlog.get_logger()

class ObservabilityMiddleware:
    """
    每一步都要记 trace，否则出了问题你根本不知道哪里错了。
    在 Multi-Agent 系统中，可观测性不是可选的。
    """

    def trace_routing(self, session_id: str, message: str, result: dict):
        logger.info("routing_decision",
            session_id=session_id,
            input_preview=message[:100],
            department=result["department"],
            confidence=result["confidence"],
            reasoning=result["reasoning"]
        )

    def trace_tool_call(self, session_id: str, agent: str, tool: str, args: dict, result: dict, latency_ms: float):
        logger.info("tool_call",
            session_id=session_id,
            agent=agent,
            tool=tool,
            arguments=args,
            result_preview=str(result)[:200],
            latency_ms=latency_ms
        )

    def trace_escalation(self, session_id: str, reason: str, sentiment: float):
        logger.warn("escalation",
            session_id=session_id,
            reason=reason,
            sentiment_score=sentiment
        )
```

**为什么可观测性这么重要？**

Multi-Agent 系统的 debug 极其困难。用户说"你们 AI 客服回答不对"，你需要知道：
- Router 分类对了吗？
- Agent 调用了哪些工具？
- 工具返回了什么？
- LLM 是在哪一步"想歪了"？

没有 trace，你只能猜。

## 第八步：技术选型总结

| 组件 | 选择 | 为什么 |
|------|------|--------|
| Router 模型 | gpt-4o-mini | 分类简单，要快要便宜 |
| 领域 Agent 模型 | gpt-4o / Claude | 需要强推理 + 工具调用 |
| 情绪检测 | gpt-4o-mini 或专用分类模型 | 低延迟，每条消息都要跑 |
| 短期记忆 | Redis | 快，适合会话级数据，自动过期 |
| 长期记忆 | Qdrant / Pinecone | 向量检索，存用户画像 |
| 编排框架 | 自建状态机 / LangGraph | 自建更可控，LangGraph 适合快速原型 |
| 消息队列 | Redis Streams / RabbitMQ | 解耦 Agent 执行，处理高并发 |
| 可观测性 | structlog + Langfuse | 结构化日志 + LLM 专用 tracing |

## 第九步：常见陷阱

### 陷阱 1：过度依赖框架

很多人上来就用 LangChain / CrewAI，但框架会：
- 隐藏细节，出错时不知道为什么
- 引入不必要的抽象层
- 默认 prompt 可能有问题

**建议**：先用原始 API 实现（如上面的代码），理解原理后再决定是否需要框架。

### 陷阱 2：把完整对话历史传给每个 Agent

对话历史越长，LLM 越容易"迷失"。正确做法：
- 只给 Agent 最近 N 轮 + 前一个 Agent 的摘要
- 摘要是结构化的（"用户想退货，订单号 X，原因 Y"），不是原文

### 陷阱 3：没有循环保护

Agent 可能陷入死循环（反复调用同一个工具，或两个 Agent 互相转接）。
必须有：
- 最大循环次数限制
- 最大 token 消耗限制
- 超时机制

### 陷阱 4：忽略 Fallback

80% 的用户请求可能清晰易分类，但剩下 20% 是模糊的。
没有 fallback 策略，这 20% 会体验极差。

## 完整代码结构

```
multi-agent-customer-service/
├── main.py              # 入口，启动 API server
├── orchestrator.py      # 编排器 + 状态机
├── router.py            # 路由 Agent
├── agents/
│   ├── base.py          # Agent 基类（上面的 run_agent 函数）
│   ├── pre_sales.py     # 售前 Agent（prompt + tools）
│   ├── after_sales.py   # 售后 Agent
│   ├── technical.py     # 技术支持 Agent
│   └── fallback.py      # 兜底 Agent
├── tools/
│   ├── order_service.py     # 订单查询
│   ├── refund_service.py    # 退款
│   ├── logistics_service.py # 物流
│   └── knowledge_base.py    # RAG 知识库检索
├── memory/
│   ├── short_term.py    # Redis 短期记忆
│   └── long_term.py     # 向量数据库长期记忆
├── observability/
│   └── tracing.py       # 全链路 trace
└── config.py            # 模型选择、阈值配置
```

## 关键概念回顾

1. **Agent = LLM + Tools + Loop**：不是一次调用，是反复"思考-行动-观察"
2. **Router 做分类，不做处理**：用小模型，输出 JSON，快速分派
3. **每个 Agent 有独立的 prompt + 工具集**：单一职责
4. **Orchestrator 是粘合层**：状态机 + 异常处理 + 转人工逻辑
5. **记忆分短期/长期**：短期=当前对话（Redis），长期=用户画像（向量DB）
6. **可观测性不是可选的**：没有 trace 你无法 debug
7. **永远有 fallback**：置信度低就承认不确定，不要硬接

## 延伸阅读

- [Anthropic: Building effective agents](https://www.anthropic.com/research/building-effective-agents) — 官方 Agent 设计模式总结
- [Huyenchip: Agents](https://huyenchip.com/2025/01/07/agents.html) — Agent 的学术+工程综合视角
- [OpenAI Function Calling 文档](https://platform.openai.com/docs/guides/function-calling) — 工具调用的 API 细节
