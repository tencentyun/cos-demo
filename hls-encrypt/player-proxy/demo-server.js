// HLS加解密服务例子
const COS = require('cos-nodejs-sdk-v5');
const base64Url = require('base64-url');
const express = require('express');
const crypto = require('crypto');
const path = require("path");
const playerProxy = require('cos-hls-player-proxy');


// 配置参数
const config = {
    // 获取腾讯云密钥，建议使用限定权限的子用户的密钥 https://console.cloud.tencent.com/cam/capi
    secretId: process.env.SecretId,
    secretKey: process.env.SecretKey,
    // 播放秘钥，可通过到控制台（存储桶详情->数据处理->媒体处理）获取填写到这里，也可以调用万象 API 获取
    playKey: process.env.PlayKey,
    bucket: 'ci-1250000000',
    region: 'ap-chongqing',
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

playerProxy.start(function (err, data) {
    if (err) return console.error(err);
    console.log('try it on browser ' + data.url + '/pc-proxy-cdn.html');

    // 取出 express 实例
    const app = data.app;

    // 提供接口，给前端/App播放器，获取播放 token
    app.post('/hls/token', (req, res, next) => {
        const body = req.body || {}
        const src = body.src;
        const publicKey = body.publicKey;
        const protectContentKey = parseInt(body.protectContentKey || 0);

        // src 链接校验
        const reg = /^https?:\/\/[^/]+\/([^?]+)/;
        if (!reg.test(src)) return res.send({code: -1, message: 'src format error'});
        if (!publicKey) return res.send({code: -1, message: 'publicKey empty'});

        // 解析 url
        const objectKey = (src.match(reg) || [])[1] || '';
        const { bucket, region } = config;
        const { token, authorization } = getToken({publicKey, protectContentKey, bucket, region, objectKey}, res)

        res.send({code: 0, message: 'ok', token, authorization});
    });

    app.use(express.static(path.resolve(__dirname, 'client')));

    app.all('*', function (req, res, next) {
        res.send({code: -1, message: '404 Not Found'});
    });
});

