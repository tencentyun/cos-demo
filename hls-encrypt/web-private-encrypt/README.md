# COS HLS 私有加密播放示例


## 前置工作

1. 参考[官网文档](https://cloud.tencent.com/document/product/460/104295)，上传视频后转 HLS 加密视频。

## 示例体验步骤

1. 修改 app.js 里的 config 配置字段
2. 修改 www/ 目录下 html 文件里的 src 路径
3. 安装 Nodejs，`npm i` 安装依赖
4. 执行脚本启动 demo `npm run dev`
5. 浏览器端访问 http://127.0.0.1:3000，打开里面的 demo 链接播放视频

## 正式使用说明

1. 复制 cos_hls_sdk.js 文件到自己的前端项目里
2. 参考 www/ 目录里的 html 代码，实现视频私有加密播放
