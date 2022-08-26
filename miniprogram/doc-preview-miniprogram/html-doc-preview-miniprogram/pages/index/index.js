// index.js
const Bucket = 'ci-h5-demo-1258125638'; // 存储桶名称
const Region = 'ap-chengdu'; // 地域
const filePath = 'default_file/defaultDoc.pdf'; // 预览文件路径

// 根据 Bucket, Region, filePath 拼接文件完整路径
const objectUrl = `https://${Bucket}.cos.${Region}.myqcloud.com/${filePath}`;

Page({
    data: {
        // 拼接请求url，本示例中包含水印相关参数。查看更多参数可以访问腾讯云官方文档：https://cloud.tencent.com/document/product/460/52518
        url: `${objectUrl}?ci-process=doc-preview&dstType=html&htmlwaterword=Q09T5paH5qGj6aKE6KeI&htmlfront=Ym9sZCAxOHB4IFNlcmlm&htmlrotate=30&htmlhorizontal=100&htmlvertical=80`
    }
})
