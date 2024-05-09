
const COS = require('cos-nodejs-sdk-v5');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const crypto = require("crypto");
const base64Url = require('base64-url');

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

// 创建临时密钥服务和用于调试的静态服务
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 获取播放 token
const srcReg = /^https?:\/\/([^/]+)\/([^?]+)/;
const ciHostReg = /^[^.]+\.ci\.[^.]+\.myqcloud\.com$/;
function getToken({publicKey, protectContentKey, bucket, region, src}) {
    const m = src.match(srcReg);
    const srcHost = m[1];
    const pathKey = m[2];
    const query = {};
    const isCiHost = ciHostReg.test(srcHost);
    src.replace(/^([^?]+)(\?([^#]+))?(#.*)?$/, '$3').split('&').forEach(item => {
        const index = item.indexOf('=');
        const key = index > -1 ? item.slice(0, index) : item;
        let val = index > -1 ? item.slice(index + 1) : '';
        query[key] = decodeURIComponent(val);
    });
    let objectKey = isCiHost ? query.object : pathKey;
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
    const authOpt = {
        SecretId: config.secretId,
        SecretKey: config.secretKey,
        Method: 'get',
        Pathname: '/' + pathKey,
    };
    if (!isCiHost) {
        const ciProcess = query['ci-process'] ||'pm3u8';
        authOpt.Query = {'ci-process': ciProcess};
    }
    let authorization = COS.getAuthorization(authOpt);
    return {token, authorization};
}

// 提供接口，给前端/App播放器，获取播放 token
app.post('/hls/token', (req, res, next) => {
    const body = req.body || {}
    const src = body.src;
    const publicKey = body.publicKey;
    const protectContentKey = parseInt(body.protectContentKey || 0);

    // 限制只允许部分 UserAgent 来源的请求走标准加密
    // 不支持 HLS 私有加密视频场景，需要降级走 HLS 标准加密流程(例如小程序、iOS Safari 和 iOS Webview)。
    const userAgent = req.headers['user-agent'] || '';
    const uaWhiteList = ['Safari', 'wechatdevtools', 'MiniProgramEnv'];
    const isUaAllow = uaWhiteList.some(item => userAgent.includes(item));
    // 只有白名单的浏览器，才能走标准加密
    if (!protectContentKey && !isUaAllow) {
        res.status(400);
        return res.send({code: -1, message: 'protectContentKey=0 not allowed'});
    }

    // src 链接校验
    if (!src || !srcReg.test(src)) return res.send({code: -1, message: 'src format error'});
    if (!publicKey) return res.send({code: -1, message: 'publicKey empty'});

    // 解析 url
    const { bucket, region } = config;
    const { token, authorization } = getToken({publicKey, protectContentKey, bucket, region, src}, res)

    res.send({code: 0, message: 'ok', token, authorization});
});

app.use(express.static('./www'));

app.all('*', function (req, res, next) {
    res.send({code: -1, message: '404 Not Found'});
});

// 启动签名服务
app.listen(3000);
console.log('app is listening at http://127.0.0.1:3000');
