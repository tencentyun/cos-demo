// 临时密钥服务例子
var express = require('express');
var crypto = require('crypto');
var moment = require('moment');
var STS = require('qcloud-cos-sts');
const url = require('url');
const { log } = require('console');

// 配置参数
var config = {
  // 获取腾讯云密钥，建议使用限定权限的子用户的密钥 https://console.cloud.tencent.com/cam/capi
  secretId: process.env.COS_SECRET_ID,
  secretKey: process.env.COS_SECRET_KEY,
  // 密钥有效期
  durationSeconds: 1800,
  // 这里填写存储桶、地域，例如：test-1250000000、ap-guangzhou
  bucket: process.env.PERSIST_BUCKET,
  region: process.env.PERSIST_BUCKET_REGION
};

// 获取临时秘钥
var getTempCredential = async function(cosKey){
  var shortBucketName = config.bucket.substr(0 , config.bucket.lastIndexOf('-'));
  var appId = config.bucket.substr(1 + config.bucket.lastIndexOf('-'));
  // 开始获取临时秘钥
  var policy = {
    "version": "2.0",
    "statement": [
      {
        "action": [
          // 上传需要的操作
          "name/cos:PutObject",
          "name/cos:InitiateMultipartUpload",
          "name/cos:ListMultipartUploads",
          "name/cos:ListParts",
          "name/cos:UploadPart",
          "name/cos:CompleteMultipartUpload"
        ],
        "effect": "allow",
        "resource": [
          // 仅限cosKey资源
          'qcs::cos:' + config.region + ':uid/' + appId + ':prefix//' + appId + '/' + shortBucketName + '/' + cosKey,
        ]
      }
    ]
  };
  let tempKeys = null;
  try{
    tempKeys = await STS.getCredential({
      secretId: config.secretId,
      secretKey: config.secretKey,
      durationSeconds: config.durationSeconds,
      policy: policy,
    });
    console.log(tempKeys);
    return tempKeys;
  } catch(err){
    console.log(err);
    res.send(JSON.stringify(err));
    return null;
  }
};

// 计算签名
var getSignature = function(tempCredential, httpMethod, cosHost, pathname) {
  const signAlgorithm = 'sha1';
  const credentials = tempCredential.credentials;
  const keyTime = `${tempCredential.startTime};${tempCredential.expiredTime}`;

  // 步骤一：生成 SignKey
  var signKey = crypto.createHmac(signAlgorithm, credentials.tmpSecretKey).update(keyTime).digest('hex');
  console.log("signKey:"+signKey);

  // 步骤二：生成 StringToSign
  const httpString = `${httpMethod.toLowerCase()}\n/${pathname}\n\nhost=${cosHost}\n`;
  console.log("httpString:"+httpString);
  const httpStringHash = crypto.createHash(signAlgorithm).update(httpString).digest('hex');
  const stringToSign = `${signAlgorithm}\n${keyTime}\n${httpStringHash}\n`;
  console.log("stringToSign:"+stringToSign);

  // 步骤三：生成 Signature
  var signature = crypto.createHmac(signAlgorithm, signKey).update(stringToSign).digest('hex');
  console.log("signature:"+signature);

  // 步骤四：生成 authorization
  let authorization = `q-sign-algorithm=${signAlgorithm}&
q-ak=${credentials.tmpSecretId}&
q-sign-time=${keyTime}&
q-key-time=${keyTime}&
q-header-list=host&q-url-param-list=&q-signature=${signature}`;

  // 去掉掉上面换行导致的\n
  authorization = authorization.replace(/\n/g, '');
  console.log("authorization:"+authorization);
  
  return authorization;
}

// 创建临时密钥服务和用于调试的静态服务
var app = express();
// 直传签名接口
app.all('/sts-server-sign', async function (req, res, next) {
  // 获取需要签名的字段
  var httpMethod = req.query.httpMethod;
  var cosHost = req.query.host;
  var cosKey = req.query.cosKey;

  console.log(httpMethod + " " + cosHost + " " + cosKey);

  cosHost = decodeURIComponent(cosHost);
  cosKey = decodeURIComponent(cosKey);

  console.log(httpMethod + " " + cosHost + " " + cosKey);

  // 判断异常情况
  if (!config.secretId || !config.secretKey) return res.send({ code: '-1', message: 'secretId or secretKey not ready' });
  if (!config.bucket || !config.region) return res.send({ code: '-1', message: 'bucket or regions not ready' });
  if (!httpMethod || !cosHost || !cosKey) return res.send({ code: '-1', message: 'httpMethod or host or coskey is not empty' });

  // 开始获取临时秘钥
  var tempCredential = await getTempCredential(cosKey);
  if(!tempCredential){
    res.send({ code: -1, message: 'get temp credentials fail' });
    return;
  }

  // 用临时秘钥计算签名
  let authorization = getSignature(tempCredential, httpMethod, cosHost, cosKey);

  // 返回域名、文件路径、签名、凭证信息
  res.send({
    code: 0,
    data: {
      cosHost: cosHost,
      cosKey: cosKey,
      authorization: authorization,
      securityToken: tempCredential.credentials.sessionToken
    },
  });
});

app.all('*', function (req, res, next) {
  res.send({ code: -1, message: '404 Not Found' });
});

// 启动签名服务
app.listen(3000);
console.log('app is listening at http://127.0.0.1:3000');
