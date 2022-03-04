// 临时密钥服务例子
var express = require('express');
var crypto = require('crypto');
var moment = require('moment');

// 配置参数
var config = {
    // 获取腾讯云密钥，建议使用限定权限的子用户的密钥 https://console.cloud.tencent.com/cam/capi
    secretId: process.env.SecretId,
    secretKey: process.env.SecretKey,
    // 这里填写存储桶、地域，例如：test-1250000000、ap-guangzhou
    bucket: process.env.Bucket,
    region: process.env.Region,
    // 限制的上传后缀
	extWhiteList: ['jpg', 'jpeg', 'png', 'gif', 'bmp'],
};

// 生成要上传的 COS 文件路径文件名
var generateCosKey = function (ext) {
	var ymd = moment().format('YYYYMMDD');
	var ymd = moment().format('YYYYMMDD_HHmmss_');
	var r = ('000000' + Math.random() * 1000000).slice(-6);
	var cosKey = `images/${ymd}/IMG_${ymd}_${r}.${ext}`;
	return cosKey;
};

// 创建临时密钥服务和用于调试的静态服务
var app = express();
app.all('/post-policy', function (req, res, next) {
	var ext = req.query.ext;
    // 判断异常情况
    if (!config.secretId || !config.secretKey) return res.send({code: '-1', message: 'secretId or secretKey not ready'});
    if (!config.bucket || !config.region) return res.send({code: '-1', message: 'bucket or regions not ready'});
    if (!config.extWhiteList.includes(ext)) return res.send({code: '-1', message: 'ext not allow'});
    // 开始计算凭证
	var cosHost = `${config.bucket}.cos.${config.region}.myqcloud.com`;
	var cosKey = generateCosKey(ext);
    var now = Math.round(Date.now() / 1000);
    var exp = now + 900;
    var qKeyTime = now + ';' + exp;
    var qSignAlgorithm = 'sha1';
    // 生成上传要用的 policy
    // PostObject 签名保护文档 https://cloud.tencent.com/document/product/436/14690#.E7.AD.BE.E5.90.8D.E4.BF.9D.E6.8A.A4
    var policy = JSON.stringify({
        'expiration': new Date(exp * 1000).toISOString(),
        'conditions': [
            // {'acl': query.ACL},
            // ['starts-with', '$Content-Type', 'image/'],
            // ['starts-with', '$success_action_redirect', redirectUrl],
            // ['eq', '$x-cos-server-side-encryption', 'AES256'],
            {'q-sign-algorithm': qSignAlgorithm},
            {'q-ak': config.secretId},
            {'q-sign-time': qKeyTime},
            {'bucket': config.bucket},
            {'key': cosKey},
        ]
    });

    // 步骤一：生成 SignKey
    var signKey = crypto.createHmac('sha1', config.secretKey).update(qKeyTime).digest('hex');

    // 步骤二：生成 StringToSign
    var stringToSign = crypto.createHash('sha1').update(policy).digest('hex');

    // 步骤三：生成 Signature
    var qSignature = crypto.createHmac('sha1', signKey).update(stringToSign).digest('hex');

    // 如果需要返回跨域头
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', 'http://127.0.0.1:8080'); // 这里修改允许跨域访问的网站
    res.setHeader('Access-Control-Allow-Headers', 'origin,accept,content-type');

    // 返回域名、文件路径、凭证信息
    res.send({
		code: 0,
        data: {
            cosHost: cosHost,
            cosKey: cosKey,
            policy: Buffer.from(policy).toString('base64'),
            qSignAlgorithm: qSignAlgorithm,
            qAk: config.secretId,
            qKeyTime: qKeyTime,
            qSignature: qSignature,
            // securityToken: securityToken, // 如果 SecretId、SecretKey 是临时密钥，要返回对应的 sessionToken 的值
        },
    });
});

app.all('*', function (req, res, next) {
    res.send({code: -1, message: '404 Not Found'});
});

// 启动签名服务
app.listen(3000);
console.log('app is listening at http://127.0.0.1:3000');
