// HLS加解密服务例子
const COS = require('cos-nodejs-sdk-v5');
const base64Url = require('base64-url');
const bodyParser = require('body-parser');
const express = require('express');
const crypto = require('crypto');
const pathLib = require("path");

// 配置参数
const config = {
    // 获取腾讯云密钥，建议使用限定权限的子用户的密钥 https://console.cloud.tencent.com/cam/capi
    secretId: 'xxx',
    secretKey: 'xxx',
    // 播放秘钥，可通过到控制台（存储桶详情->数据处理->媒体处理）获取填写到这里，也可以调用万象 API 获取
    playKey: "xxx",
    // 视频存放的存储桶和地域
    bucket: 'ci-1250000000',
    region: 'ap-chongqing',
    // 指定域名是否使用 CDN 域名，如果为 true，playUrl 不需要签名 authorization
    useCdn: false,
    // 播放链接用什么域名，可以填写存储桶域名、CDN 域名、COS自定义域名
    playUrlHost: 'ci-1250000000.cos.ap-chongqing.myqcloud.com',
    // playerUrl 的参数，根据实际需要传参
    playUrlQuery: {
        'ci-process': 'pm3u8', // 请求类型，pm3u8 私有链接播放、getplaylist 边转边播
        'expires': 3600, // pm3u8 的参数
        'tokenType': 'JwtToken', // 私有加密场景，需要传入该参数
        // ... 这里放其他参数，这里加上会加入签名计算。
    },
};

// 创建临时密钥服务和用于调试的静态服务
const app = express();

app.use(express.static(pathLib.resolve(__dirname, './www'))); // 对项目跟路径放开静态访问
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


// query 对象转字符串
const obj2str = function (obj) {
    return Object.keys(obj).map(key => {
        return key + '=' + encodeURIComponent(obj[key]);
    }).join('&');
};

// 获取播放 token
function getToken({publicKey, protectContentKey, bucket, objectKey, query, headers}) {
    const header = {
        "alg": "HS256",
        "typ": "JWT"
    }
    const appId = bucket.slice(bucket.lastIndexOf('-') + 1);
    const payload = {
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
    const Header = base64Url.encode(JSON.stringify(header))
    const PayLoad = base64Url.encode(JSON.stringify(payload))
    const data = Header + "." + PayLoad
    const hash = crypto.createHmac('sha256', config.playKey).update(data).digest();
    const Signature = base64Url.encode(hash);
    const token = Header + '.' + PayLoad + '.' + Signature
    const authorization = COS.getAuthorization({
        SecretId: config.secretId,
        SecretKey: config.secretKey,
        Method: 'get',
        Pathname: `/${objectKey}`,
        Query: query,
        Headers: headers,
    });
    return {token, authorization};
}

// 提供接口，给前端/App播放器，获取播放 url
app.post('/hls/getPlayUrl', (req, res, next) => {
    const body = req.body || {}
    const objectKey = body.objectKey;
    const publicKey = body.publicKey;
    const protectContentKey = parseInt(body.protectContentKey || 0);

    // 限制只允许部分 UserAgent 来源的请求走标准加密
    // 不支持 HLS 私有加密视频场景，需要降级走 HLS 标准加密流程(例如小程序、iOS Safari 和 iOS Webview)。
    const userAgent = req.headers['user-agent'] || '';
    const uaWhiteList = ['Safari', 'wechatdevtools', 'MiniProgramEnv'];
    const isUaAllow = uaWhiteList.some(item => userAgent.includes(item));
    // 只有白名单的浏览器，才放通 protectContentKey:0，走标准加密
    if (!protectContentKey && !isUaAllow) {
        res.status(400);
        return res.send({code: -1, message: 'protectContentKey=0 not allowed'});
    }

    // 校验参数
    if (!publicKey) return res.send({code: -1, message: 'publicKey empty'});

    // 构造请求信息
    const opt = {
        publicKey,
        protectContentKey,
        objectKey,
        bucket: config.bucket,
        query: config.playUrlQuery,
        headers: {host: config.playUrlHost},
    };
    // 计算 token、authorization
    const {token, authorization} = getToken(opt);
    // 拼接 url
    let playUrl = `https://${config.playUrlHost}/${objectKey}?${obj2str(config.playUrlQuery)}&token=${token}`;
    // 如果是 CDN 域名，playUrl 不需要带签名 authorization
    if (!config.useCdn) playUrl += '&' + authorization;
    // 返回 playUrl 给前端用于播放
    res.send({code: 0, message: 'ok', playUrl});
});

app.all('*', function (req, res, next) {
    res.send({code: -1, message: '404 Not Found'});
});

// 启动签名服务
app.listen(3000);
console.log('app is listening at http://127.0.0.1:3000');
