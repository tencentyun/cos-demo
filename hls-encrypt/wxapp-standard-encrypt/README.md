# HLS 标准加密 - 小程序 示例

本文主要介绍如何在小程序端播放 HLS 加密视频。

[文档链接](https://cloud.tencent.com/document/product/460/104024)
[代码示例](https://github.com/tencentyun/cos-demo/tree/master/hls-encrypt/wxapp-standard-encrypt)

# 实现步骤

## 准备工作

1. 已创建和绑定存储桶，详情请参见 [存储桶操作](https://cloud.tencent.com/document/product/460/46483)。

2. 已 [开通媒体处理 ](https://cloud.tencent.com/document/product/460/87745)功能。

3. [上传 m3u8 文件](https://cloud.tencent.com/document/product/436/13321)。

4. 创建加密媒体处理转码 HLS 加密模版，并创建任务对已上传的视频转码为加密的 HLS 格式。

5. 搭建 HLS 解密 token 服务，参考 [文档说明](https://cloud.tencent.com/document/product/460/104024#5ea2a185-f626-4f4c-9011-cc7684c39baf) 和 [代码示例](https://github.com/tencentyun/cos-demo/tree/main/server/hls-decrypt-token/)，注意需要对代码示例放开 protectContentKey 不允许传 0 的限制，这里由于放开了之后会有安全风险，需要严格做好登录态校验以及限制只允许小程序来源。以 nodejs 为例，改造代码位置是 `if (!protectContentKey)` 片段的代码。

6. 在小程序端代码里，实现播放代码。

新建小程序工程代码，在 pages/index/index.wxml 里加 video 标签
```xml
<video src="{{src}}"></video>
```

在 pages/index/index.js 里填入以下代码示例
```javascript
Page({
    data: {
        // 将要播放的转码后的 m3u8 视频链接
        m3u8Url: 'https://example-1250000000.cos.ap-beijing.myqcloud.com/hls/video.m3u8',
        src: '',
    },
    onReady: async function () {
        wx.request({
            method: 'POST',
            // 替换成自己实现的 hls token server
            // token server 参考文档：https://cloud.tencent.com/document/product/460/104024#5ea2a185-f626-4f4c-9011-cc7684c39baf
            // token server 代码示例：https://github.com/tencentyun/cos-demo/tree/main/server/hls-decrypt-token/
            url: 'https://example.com/samples/hls/token',
            data: JSON.stringify({
                src: this.data.m3u8Url,
                protectContentKey: 0,
            }),
            header: {
                'Content-Type': 'application/json',
            },
            dataType: 'json',
            success: (res) => {
                const {token, authorization} = res.data;
                // 拼接可被正常 HLS 标准加密方式播放的视频链接，加上签名、token等参数
                const url = `${this.data.m3u8Url}?ci-process=pm3u8&expires=43200&tokenType=JwtToken&token=${encodeURIComponent(token)}&${authorization}`;
                this.setData({ src: url });
            },
            fail(res) {
                console.log(res);
            },
        });
    }
})
```

7. 最后在小程序开发工具上打开项目编译即可正常播放 HLS 加密视频。

## 其他说明

[HLS私有加密方案文档](https://cloud.tencent.com/document/product/460/104295)

