# COS HLS 解密代理服务示例

## 调用示例

1. 安装依赖
```javascript
npm i
```
2. 参照 demo-pc.js 调用并获取 url，用于播放前请求播放地址。
```javascript
var playerProxy = require('cos-hls-player-proxy');
playerProxy.start(function (err, data) {
    if (err) return console.error('playerProxy start error', err);
    console.log('play proxy ready!', data.url);
});
```
