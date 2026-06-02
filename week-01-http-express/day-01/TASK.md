# Day 01: Hello HTTP

## 学习（10分钟）

理解 HTTP 请求的基本结构：
- 一个 HTTP 请求由什么组成？（method, URL, headers, body）
- 一个 HTTP 响应由什么组成？（status code, headers, body）
- GET 和 POST 的区别是什么？

可以查的资源：MDN HTTP 文档、任何你觉得好的教程。

## 动手（15分钟）

用 Express + TypeScript 创建一个服务，实现以下接口：

1. `GET /` → 返回 `{ message: "hello world", timestamp: <当前时间戳> }`
2. `GET /health` → 返回 `{ status: "ok", uptime: <服务启动了多少秒> }`
3. `POST /echo` → 把请求 body 原样返回

要求：
- 监听 3000 端口
- 启动时在控制台打印 "Server running on port 3000"
- 所有响应都是 JSON 格式

## 思考题（5分钟）

在 `solution/THINK.md` 里用自己的话回答：

> 当你在浏览器地址栏输入 `http://localhost:3000/health` 然后回车，
> 从你按下回车到看到页面内容，中间发生了什么？尽量详细。

不需要完美答案，写出你当前的理解就行。

## 提交

```bash
git add .
git commit -m "week01 day01: hello http"
git push
```
