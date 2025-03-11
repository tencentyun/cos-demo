const COS = require('cos-nodejs-sdk-v5');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const crypto = require("crypto");
const base64Url = require('base64-url');

// config 中的内容请替换成您自己的配置
const config = {
    Bucket: 'ci-h5-bj-1251902136',                    // 存储桶，必须
    Region: 'ap-beijing',                             // 存储桶所在地域，必须字段，目前仅支持北京和上海
    // 获取腾讯云密钥，建议使用限定权限的子用户的密钥 https://console.cloud.tencent.com/cam/capi
    SecretId: 'xxx',                   // 推荐使用环境变量获取；用户的 SecretId，建议使用子账号密钥，授权遵循最小权限指引，降低使用风险。
    SecretKey: 'xxx',                 // 推荐使用环境变量获取；用户的 SecretKey，建议使用子账号密钥，授权遵循最小权限指引，降低使用风险。
    // 播放秘钥，可通过到控制台（存储桶详情->数据处理->媒体处理）获取填写到这里，也可以调用万象 API 获取
    PlayKey: 'xxx',
};

// 初始化 COS SDK 实例
var cos = new COS({
    SecretId: config.SecretId,
    SecretKey: config.SecretKey,
});

// 创建临时密钥服务和用于调试的静态服务
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 获取播放 token
const srcReg = /^https?:\/\/([^/]+)\/([^?]+)/;
const ciHostReg = /^[^.]+\.ci\.[^.]+\.myqcloud\.com$/;
const getToken = function ({publicKey, protectContentKey, bucket, region, src}) {
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
    let hash = crypto.createHmac('sha256', config.PlayKey).update(data).digest();
    let Signature = base64Url.encode(hash);
    let token = Header + '.' + PayLoad + '.' + Signature
    const authOpt = {
        SecretId: config.SecretId,
        SecretKey: config.SecretKey,
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


// 1. 先发起边转边播任务
const generatePlayList = function (sourceKey, callback) {
    console.log('[step1] 发起边转边播任务 ')
    console.log('原视频：', sourceKey)
    const fileName = sourceKey.replace(/^(.*\/)?(.*)$/, '$2').replace(/\.[^.]+$/, '');
    const targetPrefix = `${sourceKey.replace(/\.[^.]+$/, '')}-transcoding-${Date.now()}/${fileName}`;
    const targetKeyTpl = targetPrefix + '.${ext}';
    console.log('目标边转边播文件：', targetPrefix + '.m3u8');
    const host = config.Bucket + '.ci.' + config.Region + '.myqcloud.com/jobs';
    const url = 'https://' + host;
    const body = COS.util.json2xml({
        Request: {
            Tag: 'GeneratePlayList',
            Input: {
                Object: sourceKey   // 待操作的媒体文件名
            },
            Operation: {
                Transcode: {
                    Container: {
                        Format: 'hls',  // 封装格式，取值范围 hls，默认 hls
                        ClipConfig: {
                            Duration: '5' // 分片时长，单位秒，默认 5s，取值范围 [3, 8]
                        }
                    },
                    Video: {
                        Codec: 'H.264', // 编码格式，默认 H.264 ，目前仅支持 H.264
                        Width: '1080', // 视频宽，单位 px ，范围 [256, 4096], 如果只设置 Width，Height 按照视频原始比例计算，必须为 8 的倍数，默认原视频宽
                        Height: '1920', // 视频高，单位 px ，范围 [256, 4096], 如果只设置 Width 按照视频原始比例计算，必须为 8 的倍数，默认原视频宽
                    },
                    TransConfig: {
                        InitialClipNum: '0', // 初始转码分片个数，默认 0
                        HlsEncrypt: {
                            IsHlsEncrypt: true        // hls私有加密
                        }
                    }
                },
                Output: {
                    Region: config.Region, // 地域名，目前仅支持北京和上海
                    Bucket: config.Bucket, // 存储桶名称
                    Object: targetKeyTpl // 文件输出路径
                }
            }
        },
    });
    cos.request({
        Method: 'POST',
        Key: 'jobs',
        Url: url,
        Body: body,
        ContentType: 'application/xml',
    }, function (err, data) {
        if (err) {
            // 处理请求出错
            callback(null, err);
        } else {
            // 处理请求成功
            if (data.Response.JobsDetail.Code === 'Success') {
                callback(data.Response.JobsDetail.JobId, null)
            } else {
                callback(null, data)
            }
        }
    });
}

// 2. 查询任务结果
const pollQueryJobStatus = function (jobId, callback) {
    console.log('[step2] 查询任务结果，jobId：', jobId)
    const maxRetries = 60;
    const interval = 3000;
    let timeoutId = null;
    const host = config.Bucket + '.ci.' + config.Region + '.myqcloud.com/jobs/' + jobId;
    const url = 'https://' + host;

    let retryCount = 0;
    const describeMediaJob = function () {
        // 检查是否超过最大重试次数
        if (retryCount >= maxRetries) {
            timeoutId && clearTimeout(timeoutId);
            callback(null, new Error(`Max retries (${maxRetries}) exceeded`));
            return;
        }
        cos.request({
            Method: 'GET',
            Key: 'jobs/' + jobId,
            Url: url,
        }, function (err, data) {
            if (err) {
                // 处理请求出错
                timeoutId && clearTimeout(timeoutId);
                callback(null, err);
            } else {
                // 处理请求成功
                const status = data.Response.JobsDetail.State;
                if (status === 'Success') {
                    timeoutId && clearTimeout(timeoutId);
                    return callback(data.Response.JobsDetail.Operation.Output, null);
                } else if (status === 'Failed' || status === 'Pause' || status === 'Cancel') {
                    // 任务失败，任务暂停，任务取消：停止轮询
                    timeoutId && clearTimeout(timeoutId);
                    return callback(null, data.Response.JobsDetail);
                } else {
                    // 继续轮询
                    retryCount++;
                    timeoutId = setTimeout(describeMediaJob, interval);
                }
            }
        });
    }
    describeMediaJob();
}

// 3. 如果任务成功，则获取播放体验链接地址
var getPlayList = function (output) {
    console.log('[step3] 任务执行成功后，获取播放体验链接地址：')
    var key = output.Object.replace('${ext}', 'm3u8')
    var auth = COS.getAuthorization({
        Bucket: output.Bucket,
        Region: output.Region,
        Method: 'GET',
        Key: key,
        Query: {
            'ci-process': 'getplaylist',
            expires: 43200,
        },
        Headers: { 'User-Agent': 'cos-nodejs-sdk-v5-2.15.0' },
        SignHost: `${output.Bucket}.cos.${output.Region}.myqcloud.com`,
        Expires: 7776000,           // 保留一个长时间的有效期
        SecretId: config.SecretId,
        SecretKey: config.SecretKey,
    })

    const playUrl = `https://${output.Bucket}.cos.${output.Region}.myqcloud.com/${key}?ci-process=getplaylist&expires=43200&${auth}`;
    console.log(`[step4] 边转边播播放地址：${playUrl}`)
    return playUrl;
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
    // 只有白名单的浏览器，才放通 protectContentKey:0，走标准加密
    if (!protectContentKey && !isUaAllow) {
        res.status(400);
        return res.send({code: -1, message: 'protectContentKey=0 not allowed'});
    }

    // src 链接校验
    if (!src || !srcReg.test(src)) return res.send({code: -1, message: 'src format error'});
    if (!publicKey) return res.send({code: -1, message: 'publicKey empty'});

    // 解析 url
    const { token, authorization } = getToken({publicKey, protectContentKey, bucket: config.Bucket, region: config.Region, src}, res)

    res.send({code: 0, message: 'ok', token, authorization});
});

// 提供接口，给前端/App播放器，获取播放 token
app.post('/hls/playUrl', (req, res, next) => {

    const sourceKey = req.body.sourceKey;
    // 启动
    generatePlayList(sourceKey, function (jobId, err) {
        if(err) {
            console.log('[error] ', err)
        } else {
            // 查询任务是否执行完成
            pollQueryJobStatus(jobId, function (output, err2) {
                if(err2) {
                    console.log('[error] ', err2)
                } else {
                    // 获取播放体验链接地址
                    const playUrl = getPlayList(output);
                    res.send({code: 0, message: 'ok', playUrl});
                }
            })
        }
    });
});

app.use(express.static('./www'));

app.all('*', function (req, res, next) {
    res.send({code: -1, message: '404 Not Found'});
});

// 启动签名服务
app.listen(3001);
console.log('app is listening at http://127.0.0.1:3001');
