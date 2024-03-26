# 服务端解密demo

# node代理解密服务

## 体验步骤

### 一、前期准备

1. 去腾讯云控制台获取 SecretId、SecretKey [获取密钥](https://console.cloud.tencent.com/capi)
2. 去 COS 控制台存储桶获取播放密钥 [COS控制台](https://console.cloud.tencent.com/cos/bucket)
![img.png](https://qcloudimg.tencent-cloud.cn/image/document/fbd702b3bdd7f49a2ed6eb15fbe9187b.png)
4. 参照最佳实践，创建 HLS 加密转码视频，[文档链接](https://cloud.tencent.com/document/product/460/59291)

### 二、创建 HLS 加密视频
1. 登录 对象存储控制台。
2. 在左侧导航栏中，单击存储桶管理，进入存储桶列表。
3. 找到您需要存储视频的存储桶，并单击右侧操作栏的管理，进入相应存储桶管理页面。
4. 单击左侧的任务和工作流，选择模板配置页签，进入模板配置页面。
5. 选择音视频转码，单击创建转码模板，弹出创建转码模板窗口。
6. 在创建音视频转码模板窗口中，配置如下基本信息后，点击下一步。
！[加密转码模板](https://qcloudimg.tencent-cloud.cn/image/document/2858e5465599929e60355b066afdee48.png)
7. 视频参数和音频参数选择默认配置。
8. 配置如下高级设置后，点击完成。
![加密转码模板2](https://qcloudimg.tencent-cloud.cn/image/document/e5c7bc1c41cd0d4ce592b056d2400cfe.png)
9. 完成 HLS 加密模板配置，后续选用此模板 配置工作流 或 配置任务 即可实现加密视频。
10. 当前实例里，可以通过创建转码任务，选中刚才创建的 HLS 加密转码模板，对已上传的 mp4 文件转码，转码完后即可得到加密后的 m3u8 和 ts 文件。
![](![task.png](task.png))

### 三、启动本地解密代理服务

``` bash
npm install # 安装依赖
node app.js # 启动node服务
```

### 四、在播放端使用该代理服务播放视频

1. 修改 client/index.html 里的 m3u8Url，改为刚才步骤二里在控制台转码好的加密视频 .m3u8 文件，复制文件链接。
2. 浏览器打开 http://127.0.0.1:3000 可以看到视频能正常播放，经过代理服务提供的 getM3u8 和 getKey 接口，完成了 HLS 加密视频正常播放。

## 正式使用说明

1. 以上的步骤是体验过程，正式使用时，client/index.html 是在 PC 客户端里的实现。
2. app.js 里的 hls/token 接口需要部署到线上服务器，在本地代码剥离掉。
