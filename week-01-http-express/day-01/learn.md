我对http的理解是server到client的一个通信协议
这个协议有请求方法，url，header，body构成
这个协议可以实现资源的传递，是基于可靠的tcp的网络协议。
server端： 一个web server处理请求给出响应
client端： 可能是浏览器，也可能是一个shell命令
中间可能有proxy代理层，进行请求的转发，缓存，添加删除内容等操作。
日常我会关注，cookie信息，请求header信息，这些可能跟用户身份，登录等相关。比如登录会通过header携带auth信息。cookie会携带这个用户行为标记信息等。

get和post请求本质没有什么不同，我理解就是请求信息放到body中还是url中的区别，如果是信息较多也建议post，get请求可能会有超长截断的问题。

https 是在http基础上加TLS安全层，比http安全提供了加密，防止篡改，让请求响应更安全。

修复后回答：
1. URL解析（浏览器）
浏览器拆解url：
协议：http
主机：localhost
端口： 3002
路径： /health
方法： 地址栏回车默认get
2.  DNS解析
localhost 本地host文件解析为127.0.0.1不走外部DNS服务器
3. TCP三次握手
4. 发送http报文
5. 操作系统进程
操作系统收到这个TCP数据包
根据目标端口，路由到监听该端口的进程
node event loop 通过epoll/kqueue感知可读事件
6. express处理
node http模块解析原始tcp数据为http请求对象给express
请求进入
express.json 中间件检查body
路由匹配 命中handler
handler执行
res.json 设置content-type，json。stringnify序列化，设置content-length，写入响应流
7. 发送http响应
8. 浏览器接收渲染
9. tcp connection： keep-alive 链接不关闭，保持服用，一段时间没有请求才四次挥手关闭

