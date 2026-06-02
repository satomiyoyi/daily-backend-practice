# Day 02: 路由与参数

## 学习（10分钟）

理解 Express 路由的三种参数传递方式：
- **Path params**: `/users/:id` → `req.params.id`
- **Query string**: `/users?page=1&limit=10` → `req.query.page`
- **Request body**: POST 请求的 JSON body → `req.body`

搞清楚：什么时候用哪种？设计 API 时怎么选？

## 动手（15分钟）

在 Day 01 的基础上，实现一个简单的"待办事项"内存 API：

1. `GET /todos` → 返回所有待办（数组）
2. `GET /todos/:id` → 返回单个待办，找不到返回 404
3. `POST /todos` → 创建一个待办（body: `{ title: string }`），返回 201
4. `DELETE /todos/:id` → 删除一个待办，找不到返回 404

要求：
- 数据存在内存里（用一个数组），不需要数据库
- 每个 todo 有 `{ id, title, done: false, createdAt }`
- id 用自增数字就行

## 思考题（5分钟）

> 为什么 RESTful API 用 `/todos/:id` 而不是 `/getTodoById?id=123`？
> 这两种设计有什么区别？各有什么优缺点？

写在 `solution/THINK.md`

## 提交

```bash
git add .
git commit -m "week01 day02: routing and params"
git push
```
