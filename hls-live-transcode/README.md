# 边转边播示例

## 使用说明

1. 到腾讯云[对象存储控制台](https://console.cloud.tencent.com/cos/bucket)存储桶详情，开启媒体处理，并在视频加密配置复制播放密钥。
2. 在 app.js 里，指定 config 的 CAM 密钥、存储桶、播放密钥。
3. `npm i` 安装依赖。
4. `node app.js` 启动 http 服务
5. 在浏览器打开 http://127.0.0.1:3000 使用示例
