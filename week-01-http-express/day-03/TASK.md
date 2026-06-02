# Day 03: 中间件

## 学习（10分钟）

理解 Express 中间件：
- 什么是中间件？（一个能访问 req, res, next 的函数）
- 执行顺序是什么？（洋葱模型 / 管道模型）
- `next()` 不调用会怎样？
- 应用级中间件 vs 路由级中间件 vs 错误处理中间件

## 动手（15分钟）

在 Day 02 的 todo API 基础上，添加三个中间件：

1. **请求日志中间件** — 每个请求打印：`[时间] METHOD /path - 耗时ms`
2. **请求体验证中间件** — POST /todos 时，如果没有 title 字段，返回 400 + 错误信息
3. **错误处理中间件** — 捕获所有未处理的错误，返回 `{ error: message }` + 500

要求：
- 日志中间件要计算请求耗时（记录开始时间，在 res.on('finish') 时计算差值）
- 验证中间件只作用于 POST /todos 路由
- 错误处理中间件放在所有路由之后

## 思考题（5分钟）

> Express 中间件的执行顺序和 React 组件的生命周期有什么相似之处？
> 如果让你解释中间件给一个只写过 React 的人，你怎么说？

写在 `solution/THINK.md`

## 提交

```bash
git add .
git commit -m "week01 day03: middleware"
git push
```
