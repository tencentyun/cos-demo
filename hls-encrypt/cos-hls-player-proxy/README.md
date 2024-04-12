# COS HLS 解密代理服务示例

## 调用示例

1. 安装依赖
```javascript
npm i
```

2. 参照 demo-pc.js 调用并获取 url，用于播放前请求播放地址。
```javascript
var playerProxy = require('cos-hls-player-proxy');
// 内部随机指定端口，占用失败会重试下一个端口
playerProxy.start(function (err, data) {
    if (err) return console.error('playerProxy start error', err);
    console.log('play proxy ready!', data.url);
});
```

```javascript
var playerProxy = require('cos-hls-player-proxy');
// 外部指定端口
playerProxy.start({port: 3000}, function (err, data) {
    if (err) return console.error('playerProxy start error', err);
    console.log('play proxy ready!', data.url);
});
```

3. 服务启动后，会带有3个接口
/hls/getPublicKey // 获取公钥
/hls/getM3u8 // 代理 m3u8
/hls/getKey // 代理 getKey 接口
