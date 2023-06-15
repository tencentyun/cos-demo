// 临时密钥服务例子
const COS = require('cos-nodejs-sdk-v5');
const bodyParser = require('body-parser');
const STS = require('qcloud-cos-sts');
const express = require('express');
const crypto = require('crypto');
const moment = require('moment');
const pathLib = require('path');

// 配置参数
const config = {
    secretId: process.env.SecretId,
    secretKey: process.env.SecretKey,
    proxy: process.env.Proxy,
    durationSeconds: 1800,
    bucket: process.env.Bucket,
    region: process.env.Region,
    allowExtList: ['jpg', 'jpeg', 'png', 'gif', 'mp4'], // 限制上传文件的后缀
};

const ALG_STRING = 'aes-128-cbc',
    KEY = '6FAX&S$2z3yx2Sw%j@fCXJwXM8$H5e@a',
    IV = Buffer.from('45ef62082fc8d141545ddab1331a82ac', 'hex');

const util = {
    md5: function (str) {
        return crypto.createHash('md5')
            .update(str)
            .digest('hex')
            .slice(0, 16);
    },
    aesEncrypt: function (str) {
        const key = util.md5(KEY);
        // key和IV 必须是16位或32位
        const cipher = crypto.createCipheriv(ALG_STRING, key, Buffer.from(IV));
        cipher.setAutoPadding(true);
        const cipherChunks = [];
        cipherChunks.push(cipher.update(str, 'utf8', 'binary'));
        cipherChunks.push(cipher.final('binary'));
        return Buffer.from(cipherChunks.join(''), 'binary').toString('base64');
    },
    aesDecrypt: function (str) {
        const key = util.md5(KEY);
        const decipher = crypto.createDecipheriv(ALG_STRING, key, Buffer.from(IV));
        decipher.setAutoPadding(true);
        const cipherChunks = [];
        cipherChunks.push(decipher.update(Buffer.from(str, 'base64').toString('binary'), 'binary', 'utf8'));
        cipherChunks.push(decipher.final('utf8'));
        return cipherChunks.join('');
    },
    decodeToken: function (token) {
        let info = {};
        try {
            info = JSON.parse(util.aesDecrypt(token));
        } catch(e) {}
        return info;
    },
    // 生成要上传的 COS 文件路径文件名
    generateCosKey: function (ext) {
        const ymd = moment().format('YYYYMMDD');
        const timeStr = moment().format('YYYYMMDD_HHmmss');
        const rand = ('000000' + Math.random() * 1000000).slice(-6);
        return `images/${ymd}/IMG_${timeStr}_${rand}.${ext}`;
    },
    // 生成 STS policy 的 resource 六段式字符串
    generateResource: function (resourceProduct, resourcePath) {
        const {bucket, region} = config;
        const appId = config.bucket.substr(config.bucket.lastIndexOf('-') + 1);
        let resource = '';
        if (resourceProduct === 'cos') {
            resource = `qcs::cos:${region}:uid/${appId}:${bucket}${resourcePath||'/'}`;
        } else if (resourceProduct === 'ci') {
            resource = `qcs::ci:${region}:uid/${appId}:bucket/${bucket}${resourcePath||'/'}`;
        }
        return resource;
    },
    getCredential: function (opt, callback) {
        const {Action, Resource} = opt;
        // 数据万象DescribeMediaBuckets接口需要resource为*,参考 https://cloud.tencent.com/document/product/460/41741
        const policy = {
            'version': '2.0',
            'statement': [{
                'effect': 'allow',
                'action': Action,
                'resource': Resource,
            }],
        };
        const startTime = Math.round(Date.now() / 1000);
        console.log(`[sts-policy] ${JSON.stringify(policy, null, 2)}`);
        // 调用 sts/GetFederationToken 获取临时密钥
        STS.getCredential({
            secretId: config.secretId,
            secretKey: config.secretKey,
            proxy: config.proxy,
            region: config.region,
            durationSeconds: config.durationSeconds,
            // endpoint: 'sts.internal.tencentcloudapi.com', // 支持设置sts内网域名
            policy: policy,
        }, function (err, tempKeys) {
            if (err) return callback({
                code: err && err.code || -1,
                message: err && err.message || 'get credential error',
            });
            if (tempKeys) tempKeys.startTime = startTime;
            callback(null, tempKeys);
        });
    },
    getSignedUrl: function (opt, callback) {
        util.getCredential(opt, function (err, tempKeys) {
            if (err) return callback(err);
            const {tmpSecretId, tmpSecretKey, sessionToken: securityToken} = tempKeys.credentials;
            const {Method, Key, Query, Headers} = opt;
            const {bucket, region} = config;
            console.log(`[sign-opt] ${JSON.stringify({Method, Key, Query, Headers}, null, 2)}`);
            const authorization = COS.getAuthorization({
                SecretId: tmpSecretId,
                SecretKey: tmpSecretKey,
                SecurityToken: securityToken,
                Method, Key, Query, Headers,
            });
            const objectUrl = `https://${bucket}.cos.${region}.myqcloud.com/${opt.Key}`;
            const signedUrl = `${objectUrl}?${authorization}&x-cos-security-token=${securityToken}`;
            const result = {
                bucket,
                region,
                key: Key,
                objectUrl,
                signedUrl,
                authorization,
                securityToken,
            };
            console.log(`[sign-result] ${JSON.stringify(result, null, 2)}`);
            callback(null, result)
        });
    },
};


// 创建临时密钥服务和用于调试的静态服务
const sts = express();
sts.use('/server', (req, res) => res.send(`${req.path} deny`)); // 限制 /server 目录被当作静态访问
sts.use(express.static(pathLib.resolve(__dirname, '../'))); // 对项目跟路径放开静态访问
sts.use(bodyParser.json());
sts.use((req, res, next) => {
    console.log(`[access] ${req.method} ${req.url}`);
    next();
});

// 获取上传用的路径和签名
sts.get('/api/sign/upload', function (req, res, next) {
    const ext = req.query.ext;
    if (!config.allowExtList.includes(ext)) return res.send({code: -1, message: '上传不支持该格式'});
    const cosKey = util.generateCosKey(ext);
    // 获取上传的签名
    util.getSignedUrl({
        // STS policy 需要的参数
        Action: 'cos:PutObject',
        Resource: util.generateResource('cos', '/' + cosKey),
        // 生成签名需要的参数
        Method: 'PUT',
        Key: cosKey,
    }, function (err, data) {
        if (err) return res.send(err);
        // 获取下载的签名
        util.getSignedUrl({
            Action: 'cos:GetObject',
            Resource: util.generateResource('cos', '/' + cosKey),
            Method: 'GET',
            Key: cosKey,
        }, function (err, data2) {
            if (err) return res.send(err);
            data.downloadUrl = data2.signedUrl;
            data.objectToken = util.aesEncrypt(JSON.stringify({ bucket: data.bucket, region: data.region, key: data.key }));
            res.send({code: 0, message: 'ok', data});
        });
    });
});

// 获取上传用的路径和签名
sts.get('/api/sign/download', function (req, res, next) {
    const cosKey = req.query.key;
    // 获取上传的签名
    util.getSignedUrl({
        // STS policy 需要的参数
        Action: 'cos:GetObject',
        Resource: util.generateResource('cos', '/' + cosKey),
        // 生成签名需要的参数
        Method: 'GET',
        Key: cosKey,
    }, function (err, data) {
        if (err) return res.send(err);
        res.send({code: 0, message: 'ok', data});
    });
});

// 获取上传用的路径和签名
sts.get('/api/sign/AISuperResolution2', function (req, res, next) {
    util.getSignedUrl({
        // STS policy 需要的参数
        Action: 'cos:GetObject',
        Resource: util.generateResource('cos', '/'),
        // 生成签名需要的参数
        Method: 'GET',
        Key: '',
        Query: {
            'ci-process': 'AISuperResolution',
        },
    }, function (err, data) {
        if (err) return res.send(err);
        res.send({code: 0, message: 'ok', data});
    });
});

sts.all('*', (req, res) => res.send('404 not found!'));

// 启动签名服务
sts.listen(3000);
console.log('app is listening at http://127.0.0.1:3000');
