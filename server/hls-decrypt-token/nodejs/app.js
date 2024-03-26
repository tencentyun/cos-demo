// HLS加解密服务例子
const COS = require('cos-nodejs-sdk-v5');
const base64Url = require('base64-url');
const express = require('express');
const crypto = require('crypto');

// 配置参数
const config = {
    // 获取腾讯云密钥，建议使用限定权限的子用户的密钥 https://console.cloud.tencent.com/cam/capi
    secretId: process.env.SecretId,
    secretKey: process.env.SecretKey,
    // 播放秘钥，可通过到控制台（存储桶详情->数据处理->媒体处理）获取填写到这里，也可以调用万象 API 获取
    playKey: process.env.playKey,
};

// 获取播放 token
function getToken({publicKey, protectContentKey, bucket, region, objectKey}) {
    const header = {
        "alg": "HS256",
        "typ": "JWT"
    }
    const appId = bucket.slice(bucket.lastIndexOf('-') + 1);
    let payload = {
        Type: "CosCiToken",
        AppId: appId,
        BucketId: bucket,
        Issuer: "client",
        IssuedTimeStamp: Math.floor((new Date().getTime() - 30 * 1000) / 1000),
        ProtectSchema: "rsa1024",
        PublicKey: publicKey,
        ProtectContentKey: protectContentKey || 0,
        UsageLimit: 50,
        Object: objectKey,
    };
    let Header = base64Url.encode(JSON.stringify(header))
    let PayLoad = base64Url.encode(JSON.stringify(payload))
    let data = Header + "." + PayLoad
    let hash = crypto.createHmac('sha256', config.playKey).update(data).digest();
    let Signature = base64Url.encode(hash);
    let token = Header + '.' + PayLoad + '.' + Signature
    let authorization = COS.getAuthorization({
        SecretId: config.secretId,
        SecretKey: config.secretKey,
        Method: 'get',
        Pathname: `/${objectKey}`,
        Query: {'ci-process': 'pm3u8'},
    });
    return {token, authorization};
}

// 创建临时密钥服务和用于调试的静态服务
const app = express();

// 提供接口，给前端/App播放器，获取播放 token
app.post('/hls/token', (req, res, next) => {
    const body = req.body || {}
    const src = body.src;
    const publicKey = body.publicKey;
    const protectContentKey = parseInt(body.protectContentKey || 0);

    // 代码示例只允许 protectContentKey 传 1，原因：如果允许传入 0 播放流程会走 HLS 标准加密会有风险。
    // 如在某些特殊场景需要用HLS标准加密(例如小程序里播放)，可以去掉下面的限制判断并做好来源限制只允许小程序来源。
    if (!protectContentKey) {
        res.status(400);
        return res.send({code: -1, message: 'protectContentKey=0 not allowed'});
    }

    // src 链接校验
    const reg = /^https?:\/\/([a-z0-9-]+)\.cos\.([a-z0-9-]+)\.myqcloud\.com\/([^?]+)/;
    if (!reg.test(src)) return res.send({code: -1, message: 'src format error'});
    if (!publicKey) return res.send({code: -1, message: 'publicKey empty'});

    // 解析 url
    const [, bucket, region, objectKey] = src.match(reg) || [];

    const {token, authorization} = getToken({publicKey, protectContentKey, bucket, region, objectKey}, res)
    res.send({code: 0, message: 'ok', token, authorization});
});


app.all('*', function (req, res, next) {
    res.send({code: -1, message: '404 Not Found'});
});

// 启动签名服务
app.listen(3000);
console.log('app is listening at http://127.0.0.1:3000');
