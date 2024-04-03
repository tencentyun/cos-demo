
const COS = require('cos-nodejs-sdk-v5');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

// 配置参数
const config = {
    // 获取腾讯云密钥，建议使用限定权限的子用户的密钥 https://console.cloud.tencent.com/cam/capi
    secretId: 'xx',
    secretKey: 'xx',
};

// 获取播放 Authorization
function getAuthorization({objectKey}) {
    let authorization = COS.getAuthorization({
        SecretId: config.secretId,
        SecretKey: config.secretKey,
        Method: 'get',
        Pathname: `/${objectKey}`,
        Query: {'ci-process': 'getplaylist'},
    });
    return {authorization};
}

// 创建临时密钥服务和用于调试的静态服务
const app = express();

app.use(cors({ origin: '*', credentials: true }));
// body-parser中间件
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 获取播放签名及可播放链接
app.post('/hls/getAuthorization', (req, res, next) => {
    const body = req.body || {}
    const src = body.src;

    // src 链接校验
    const reg = /^https?:\/\/([a-z0-9-]+)\.cos\.([a-z0-9-]+)\.myqcloud\.com\/([^?]+)/;
    if (!reg.test(src)) return res.send({code: -1, message: 'src format error'});

    // 解析 url
    const [, bucket, region, objectKey] = src.match(reg) || [];

    const {authorization} = getAuthorization({objectKey})
    // 返回签名和播放视频链接
    let signedM3u8Url = `${src}?ci-process=getplaylist&expires=43200&${authorization}`
    res.send({code: 0, message: 'ok', authorization, signedM3u8Url});
});

app.use(express.static('./www'));


app.all('*', function (req, res, next) {
    res.send({code: -1, message: '404 Not Found'});
});

// 启动签名服务
app.listen(3000);
console.log('app is listening at http://127.0.0.1:3000');
