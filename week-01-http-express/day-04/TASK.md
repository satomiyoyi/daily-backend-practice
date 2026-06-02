# Day 04: 异步与错误处理

## 学习（10分钟）

理解 Express 中的异步处理：
- Express 默认不会捕获 async 函数抛出的错误（为什么？）
- 解决方案：try-catch 包裹、asyncHandler wrapper、express-async-errors
- HTTP 错误码的正确使用：400 vs 404 vs 422 vs 500

## 动手（15分钟）

改造你的 todo API，模拟真实场景：

1. **模拟异步操作** — 把数据存取包装成 async 函数（用 setTimeout 模拟延迟）：
   ```typescript
   async function findTodo(id: number): Promise<Todo | null> {
     return new Promise(resolve => {
       setTimeout(() => resolve(todos.find(t => t.id === id) || null), 100)
     })
   }
   ```

2. **写一个 asyncHandler 工具函数** — 包裹 async 路由，自动 catch 错误传给 next：
   ```typescript
   function asyncHandler(fn: Function) {
     // 你来实现
   }
   ```

3. **自定义错误类** — 创建 `AppError`，包含 statusCode 和 message：
   ```typescript
   class AppError extends Error {
     // 你来实现
   }
   ```

4. 在错误处理中间件中，区分 AppError（返回对应 statusCode）和未知错误（返回 500）

## 思考题（5分钟）

> 为什么 Express 不自动处理 async 函数的错误？
> 这和 JavaScript 的事件循环有什么关系？

写在 `solution/THINK.md`

## 提交

```bash
git add .
git commit -m "week01 day04: async error handling"
git push
```
