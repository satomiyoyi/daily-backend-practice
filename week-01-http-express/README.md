# Week 01: HTTP & Express 基础

## 本周目标

从零搭一个能用的 REST API。到周五结束时，你应该能：
- 理解 HTTP 请求/响应的完整生命周期
- 用 Express 搭建路由、处理请求、返回 JSON
- 理解中间件的概念和执行顺序
- 实现基本的错误处理
- 完成一个小型 CRUD API

## 前置准备

```bash
node --version
cd week-01-http-express
npm init -y
npm install express
npm install -D typescript @types/express @types/node ts-node
npx tsc --init
```

## 本周关键概念

- HTTP 方法语义（GET/POST/PUT/DELETE）
- 状态码（2xx/4xx/5xx）
- Request 组成（headers, body, params, query）
- 中间件洋葱模型
- 同步 vs 异步错误处理
