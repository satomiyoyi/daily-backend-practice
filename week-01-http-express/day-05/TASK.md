# Day 05: 项目结构与 Mini Project

## 学习（10分钟）

理解后端项目的基本分层：
- **Router** — 定义路由，不包含业务逻辑
- **Controller** — 处理请求/响应，调用 Service
- **Service** — 业务逻辑，不关心 HTTP
- **Model/Store** — 数据存取

为什么要分层？（可测试性、可维护性、关注点分离）

## 动手（20分钟）

把这周写的 Todo API 重构为分层结构：

```
solution/
├── src/
│   ├── app.ts              # Express 实例 + 中间件注册
│   ├── server.ts           # 启动入口
│   ├── routes/
│   │   └── todos.ts        # 路由定义
│   ├── controllers/
│   │   └── todos.ts        # 请求处理
│   ├── services/
│   │   └── todos.ts        # 业务逻辑
│   ├── models/
│   │   └── todo.ts         # 类型定义 + 数据存储
│   ├── middleware/
│   │   ├── logger.ts       # 日志中间件
│   │   ├── validator.ts    # 验证中间件
│   │   └── errorHandler.ts # 错误处理
│   └── utils/
│       ├── asyncHandler.ts
│       └── AppError.ts
├── package.json
└── tsconfig.json
```

要求：
- 每个文件职责单一
- Service 层不 import express 相关的任何东西
- 能正常运行，功能跟之前一样

## 思考题（5分钟）

> 这种分层架构和你在前端写 React 时的组件/hook/service 分层有什么异同？
> 如果让你用一句话解释"为什么后端要分层"，你怎么说？

写在 `solution/THINK.md`

## 本周回顾

完成 Day 05 后，在 `solution/THINK.md` 末尾额外回答：
1. 这周最大的收获是什么？
2. 哪个概念你觉得还没完全搞懂？
3. 你觉得这些知识跟你日常 OpenClaw 开发有什么关联？

## 提交

```bash
git add .
git commit -m "week01 day05: project structure"
git push
```
