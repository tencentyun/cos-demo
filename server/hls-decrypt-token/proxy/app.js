// HLS加解密服务例子
const COS = require('cos-nodejs-sdk-v5');
const base64Url = require('base64-url');
const express = require('express');
const crypto = require('crypto');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios')
const path = require("path");
const NodeRSA = require('node-rsa');

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

// todo
app.use(cors({origin: 'null', credentials: true}));
// 使用body-parser中间件
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// 提供接口，给前端/App播放器，获取播放 token
app.post('/hls/token', (req, res, next) => {
    const body = req.body || {}
    const src = body.src;
    const publicKey = body.publicKey;
    const protectContentKey = parseInt(body.protectContentKey || 0);

    // src 链接校验
    const reg = /^https?:\/\/([a-z0-9-]+)\.cos\.([a-z0-9-]+)\.myqcloud\.com\/([^?]+)/;
    if (!reg.test(src)) return res.send({code: -1, message: 'src format error'});
    if (!publicKey) return res.send({code: -1, message: 'publicKey empty'});

    // 解析 url
    const [, bucket, region, objectKey] = src.match(reg) || [];

    const {token, authorization} = getToken({publicKey, protectContentKey, bucket, region, objectKey}, res)

    let finalSrc = `${src}?ci-process=pm3u8&expires=43200&tokenType=JwtToken&${authorization}&token=${token}`
    res.send({code: 0, message: 'ok', token, authorization, finalSrc});
});

const privateKeyMap = {}
app.get('/hls/getM3u8', (req, res, next) => {
    const signedMeu8Url = req.query.url;
    const privateKey = req.query.privateKey;
    const keyId =  Date.now() + parseInt(Math.random() * 1000000);
    privateKeyMap[keyId] = privateKey;

    // src 链接校验
    axios({
        url: signedMeu8Url,
        method: 'get',
    }).then(function (data) {
        // 拼接当前代理 url
        var proxyUrlPrefix = 'http://127.0.0.1:3000';
        // 拼接当前代理 url
        var dirPrefix = signedMeu8Url.replace(/\/[^/]+(\?.*)?$/, '');
        var domainPrefix = signedMeu8Url.replace(/^(https?:\/\/[^/]+).*$/, '$1');

        // 替换 X-KEY url 的路径为代理路径
        let m3u8Content = data.data;
        m3u8Content = m3u8Content.replace(/(#EXT-X-KEY:METHOD=AES-128,URI=")([^"\n\r]+)(",IV=)/g, (str, s1, realKeyUrl, s3) => {
            var proxyM3u8Url = `${proxyUrlPrefix}/hls/getKey?url=${encodeURIComponent(realKeyUrl)}&keyId=${keyId}`
            return s1 + proxyM3u8Url + s3;
        });

        // 对 .ts 补全域名
        m3u8Content = m3u8Content.replace(/(#EXTINF:[.\d]+,[\s]+)([^\s]+)([\s]+)/g, (str, s1, tsUrl, s3) => {
            var tsUrlWithHost = tsUrl;
            if (tsUrl.startsWith('/')) {
                tsUrlWithHost = domainPrefix + tsUrl;
            } else if (!/^https?:\/\//.test(tsUrl)) {
                tsUrlWithHost = dirPrefix + '/' + tsUrl;
            }
            return s1 + tsUrlWithHost + s3;
        });
        res.header('content-type', 'application/x-mpegURL')
        res.send(m3u8Content);
    });

});

app.get('/hls/getKey', (req, res, next) => {
    const url = req.query.url
    const keyId = req.query.keyId

    // src 链接校验
    axios({
        url: url,
        method: 'get',
        responseType: 'arraybuffer'
    }).then(function (data) {
        res.header('content-type', 'application/octet-stream')
        let decryptedKey = keyDecode(data.data, keyId);
        res.send(decryptedKey);
    }).catch(err => {
        res.send({code: -1, message: 'get key failed'});
    });

});

app.use(express.static(path.resolve(__dirname, 'www')));

var keyDecode = function (source, keyId) {
    var privateKey = privateKeyMap[keyId];
    const key = new NodeRSA(privateKey);
    key.setOptions({encryptionScheme: 'pkcs1'});
    const result = key.decrypt(source);
    return result;
};

app.all('*', function (req, res, next) {
    res.send({code: -1, message: '404 Not Found'});
});

// 启动签名服务
app.listen(3000);
console.log('app is listening at http://127.0.0.1:3000');

