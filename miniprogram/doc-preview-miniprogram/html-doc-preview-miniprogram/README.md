
## 描述

腾讯云对象存储COS--转html文档预览微信小程序demo

## 配置业务域名

1. 登录 [微信公众平台](https://mp.weixin.qq.com)
2. 点击 开发 - 开发管理 - 开发设置，找到业务域名，点击修改
3. 下载校验文件至本地，并将文件放置在域名根目录下，以本示例中需要配置的两个业务域名为例，需要做如下操作：
- https://ci-h5-demo-1258125638.cos.ap-chengdu.myqcloud.com
   
    登录控制台，进入相应存储桶根目录下，上传校验文件，设置访问权限为公有读。业务域名中新增 https://ci-h5-demo-1258125638.cos.ap-chengdu.myqcloud.com
   
- https://prvsh.myqcloud.com

   提工单，找mark帮忙上传校验文件。业务域名中新增 https://prvsh.myqcloud.com

4. 保存配置的业务域名
> Tips：可以参考 [业务域名说明](https://developers.weixin.qq.com/miniprogram/dev/framework/ability/domain.html)

## 使用webview实现文档预览

1. 使用微信开发者工具，新建一个微信小程序。 [下载地址](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 在index.wxml文件中使用web-view
    ```
    <web-view src="{{url}}"></web-view>
   
   // 此处的url即为文档预览链接
   // 例如：https://ci-h5-demo-1258125638.cos.ap-chengdu.myqcloud.com/default_file/defaultDoc.pdf?ci-process=doc-preview&dstType=html&htmlwaterword=Q09T5paH5qGj6aKE6KeI&htmlfront=Ym9sZCAxOHB4IFNlcmlm&htmlrotate=30&htmlhorizontal=100&htmlvertical=80
    ```
    此处可带上水印等相关参数。查看更多参数可以访问 [腾讯云官方文档](https://cloud.tencent.com/document/product/460/52518)
3. 运行即可
