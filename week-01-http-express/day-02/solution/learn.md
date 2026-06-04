三种参数传递方式
如查询的就是资源本身，那么用path
如果需要额外增加筛选条件的话，用query
如果需要创建内容，或者内容过多，可以用body，比较典型就是post请求

思考题
/todo/：id 更向资源；优点更清晰；确定可能需要额外社会子路由
/todo/getId?id=123 更倾向查找；有点拓展性好不断叠加参数；缺点不太符合rest设计风格

resful优势： 把api当作资源的集合来操作，动作由http method来表达，统一接口，可缓存，url本身有语义。
rpc优势： 复杂查询更直观

测试post接口语句
Invoke-WebRequest -Uri "http://localhost:3003/todos" -Method Post -ContentType "application/json" -Body '{"title":"htitle4"}' | Select-Object StatusCode, Content