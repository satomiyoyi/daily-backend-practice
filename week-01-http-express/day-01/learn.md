我对http的理解是server到client的一个通信协议
这个协议有请求方法，url，header，body构成
这个协议可以实现资源的传递，是基于可靠的tcp的网络协议。
server端： 一个web server处理请求给出响应
client端： 可能是浏览器，也可能是一个shell命令
中间可能有proxy代理层，进行请求的转发，缓存，添加删除内容等操作。
日常我会关注，cookie信息，请求header信息，这些可能跟用户身份，登录等相关。比如登录会通过header携带auth信息。cookie会携带这个用户行为标记信息等。

get和post请求本质没有什么不同，我理解就是请求信息放到body中还是url中的区别，如果是信息较多也建议post，get请求可能会有超长截断的问题。

https 是在http基础上加TLS安全层，比http安全提供了加密，防止篡改，让请求响应更安全。

