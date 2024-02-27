// 临时密钥服务例子
var STS = require('qcloud-cos-sts');
var express = require('express');
var crypto = require('crypto');

// 配置参数
var config = {
  secretId: process.env.SecretId,
  secretKey: process.env.SecretKey,
  proxy: process.env.Proxy,
  durationSeconds: 1800,
  bucket: process.env.Bucket,
  region: process.env.Region,
  // 密钥的权限列表
  allowActions: [
    // 所有 action 请看文档
    // COS actions: https://cloud.tencent.com/document/product/436/31923
    // CI actions: https://cloud.tencent.com/document/product/460/41741
    // 简单上传
    'name/cos:PutObject',
    'name/cos:PostObject',
  ],
  // 限制的上传后缀
  extWhiteList: ['jpg', 'jpeg', 'png', 'gif', 'bmp'],
};

function camSafeUrlEncode(str) {
  return encodeURIComponent(str)
    .replace(/!/g, '%21')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
    .replace(/\*/g, '%2A');
}

var getObjectKeys = function (obj, forKey) {
  var list = [];
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      list.push(forKey ? camSafeUrlEncode(key).toLowerCase() : key);
    }
  }
  return list.sort(function (a, b) {
    a = a.toLowerCase();
    b = b.toLowerCase();
    return a === b ? 0 : a > b ? 1 : -1;
  });
};

/**
 * obj转为string
 * @param  {Object}  obj                需要转的对象，必须
 * @param  {Boolean} lowerCaseKey       key是否转为小写，默认false，非必须
 * @return {String}  data               返回字符串
 */
var obj2str = function (obj, lowerCaseKey) {
  var i, key, val;
  var list = [];
  var keyList = getObjectKeys(obj);
  for (i = 0; i < keyList.length; i++) {
    key = keyList[i];
    val = obj[key] === undefined || obj[key] === null ? '' : '' + obj[key];
    key = lowerCaseKey ? camSafeUrlEncode(key).toLowerCase() : camSafeUrlEncode(key);
    val = camSafeUrlEncode(val) || '';
    list.push(key + '=' + val);
  }
  return list.join('&');
};

// 生成要上传的 COS 文件路径文件名
var generateCosKey = function (ext) {
  var date = new Date();
  var m = date.getMonth() + 1;
  var ymd = `${date.getFullYear()}${m < 10 ? `0${m}` : m}${date.getDate()}`;
  var r = ('000000' + Math.random() * 1000000).slice(-6);
  var cosKey = `file/${ymd}/${ymd}_${r}${ext ? `.${ext}` : ''}`;
  return cosKey;
};
var cosHost = `${config.bucket}.cos.${config.region}.myqcloud.com`;

// 创建临时密钥服务和用于调试的静态服务
var app = express();

app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});


// 获取临时密钥
function getSts({ cosKey, condition }) {
  return new Promise((resolve, reject) => {
    // 获取临时密钥
    var AppId = config.bucket.substr(config.bucket.lastIndexOf('-') + 1);
    // 数据万象DescribeMediaBuckets接口需要resource为*,参考 https://cloud.tencent.com/document/product/460/41741
    var policy = {
      version: '2.0',
      statement: [
        {
          action: config.allowActions,
          effect: 'allow',
          resource: [
            // cos相关授权路径
            'qcs::cos:' + config.region + ':uid/' + AppId + ':' + config.bucket + '/' + cosKey,
            // ci相关授权路径 按需使用
            // 'qcs::ci:' + config.region + ':uid/' + AppId + ':bucket/' + config.bucket + '/' + 'job/*',
          ],
          condition,
        },
      ],
    };
    var startTime = Math.round(Date.now() / 1000);
    STS.getCredential(
      {
        secretId: config.secretId,
        secretKey: config.secretKey,
        proxy: config.proxy,
        region: config.region,
        durationSeconds: config.durationSeconds,
        // endpoint: 'sts.internal.tencentcloudapi.com', // 支持设置sts内网域名
        policy: policy,
      },
      function (err, tempKeys) {
        if (tempKeys) tempKeys.startTime = startTime;
        if (err) {
          reject(err);
        } else {
          resolve(tempKeys);
        }
      }
    );
  });
}

/**
 * 1. put 上传签名计算
 * 生成put上传签名，客户端传递文件后缀，这里生成随机Key
 * */

// 计算签名逻辑
function calcPutSign({ cosKey, ak, sk }) {
  var qSignAlgorithm = 'sha1';
  var method = 'put';
  var pathname = cosKey;
  pathname.indexOf('/') !== 0 && (pathname = '/' + pathname);
  var qAk = ak;
  var now = Math.round(new Date().getTime() / 1000) - 1;
  var exp = now + 900; // 默认900s过期
  var qSignTime = now + ';' + exp;
  var qKeyTime = now + ';' + exp;
  var queryParams = {};
  var headers = {
    host: cosHost,
  };
  var qHeaderList = getObjectKeys(headers, true).join(';').toLowerCase();
  var qUrlParamList = getObjectKeys(queryParams, true).join(';').toLowerCase();

  // 签名算法说明文档：https://www.qcloud.com/document/product/436/7778
  // 步骤一：计算 SignKey
  var signKey = crypto.createHmac('sha1', sk).update(qKeyTime).digest('hex');

  // 步骤二：构成 FormatString
  var formatString = [method, pathname, obj2str(queryParams, true), obj2str(headers, true), ''].join('\n');
  formatString = Buffer.from(formatString, 'utf8');

  // 步骤三：计算 StringToSign
  var r = crypto.createHash('sha1').update(formatString).digest('hex');
  var stringToSign = ['sha1', qSignTime, r, ''].join('\n');

  // 步骤四：计算 Signature
  var qSignature = crypto.createHmac('sha1', signKey).update(stringToSign).digest('hex');

  // 步骤五：构造 Authorization
  var authorization = [
    'q-sign-algorithm=' + qSignAlgorithm,
    'q-ak=' + qAk,
    'q-sign-time=' + qSignTime,
    'q-key-time=' + qKeyTime,
    'q-header-list=' + qHeaderList,
    'q-url-param-list=' + qUrlParamList,
    'q-signature=' + qSignature,
  ].join('&');
  return authorization;
}

// 1.1 不受限制的上传
app.all('/put-sign', async function (req, res, next) {
  var ext = req.query.ext;

  // 判断异常情况
  if (!config.secretId || !config.secretKey)
    return res.send({ code: '-1', message: 'secretId or secretKey not ready' });
  if (!config.bucket || !config.region) return res.send({ code: '-1', message: 'bucket or regions not ready' });
  // if (!config.extWhiteList.includes(ext)) return res.send({code: '-1', message: 'ext not allow'});

  var cosKey = generateCosKey(ext);

  let ak = config.secretId;
  let sk = config.secretKey;
  // 开始计算签名
  var authorization = calcPutSign({ cosKey, ak, sk });

  res.send({
    cosHost,
    cosKey,
    authorization,
  });
});

// 1.2 通过临时密钥限制上传文件的 content-type 和 content-length
app.all('/put-sign-limit', async function (req, res, next) {
  var ext = req.query.ext;

  // 判断异常情况
  if (!config.secretId || !config.secretKey)
    return res.send({ code: '-1', message: 'secretId or secretKey not ready' });
  if (!config.bucket || !config.region) return res.send({ code: '-1', message: 'bucket or regions not ready' });
  // if (!config.extWhiteList.includes(ext)) return res.send({code: '-1', message: 'ext not allow'});

  var cosKey = generateCosKey(ext);

  let ak = config.secretId;
  let sk = config.secretKey;
  let securityToken = '';

  // 使用临时密钥传入condition来限制上传文件的content-type和content-length
  try {
    var tmpData = await getSts({
      cosKey,
      condition: {
        // 限制上传文件小于 5MB
        'numeric_less_than_equal': {
          'cos:content-length': 5 * 1024 * 1024
        },
        // 限制上传文件 content-type 必须为图片类型
        'string_like': {
          'cos:content-type': 'image/*'
        }
      }
    });
    ak = tmpData.credentials.tmpSecretId;
    sk = tmpData.credentials.tmpSecretKey;
    securityToken = tmpData.credentials.sessionToken;
  } catch (e) {
    return res.send({ code: '-1', message: 'get sts error' });
  }

  // 开始计算签名
  var authorization = calcPutSign({ cosKey, ak, sk });

  res.send({
    cosHost,
    cosKey,
    authorization,
    securityToken: securityToken, // 如果使用临时密钥，要返回在这个资源 sessionToken 的值
  });
});

/***
 * 2. post 上传签名计算
 * 生成post上传签名，客户端传递文件后缀，这里生成随机Key
 * */

// 计算签名
function calcPostSign({ policy, qKeyTime, sk }) {
  // 签名算法说明文档：https://www.qcloud.com/document/product/436/7778
  // 步骤一：生成 SignKey
  var signKey = crypto.createHmac('sha1', sk).update(qKeyTime).digest('hex');

  // 步骤二：生成 StringToSign
  var stringToSign = crypto.createHash('sha1').update(policy).digest('hex');

  // 步骤三：生成 Signature
  var qSignature = crypto.createHmac('sha1', signKey).update(stringToSign).digest('hex');
  return qSignature;
}

// 2.1 不受限制的上传
app.all('/post-policy', async function (req, res, next) {
  var query = req.query;
  var ext = query.ext;

  // 判断异常情况
  if (!config.secretId || !config.secretKey)
    return res.send({ code: '-1', message: 'secretId or secretKey not ready' });
  if (!config.bucket || !config.region) return res.send({ code: '-1', message: 'bucket or regions not ready' });
  // if (!config.extWhiteList.includes(ext)) return res.send({code: '-1', message: 'ext not allow'});

  // 服务端生成随机Key并计算签名
  var cosKey = generateCosKey(ext);

  var ak = config.secretId;
  var sk = config.secretKey;

  var now = Math.round(Date.now() / 1000);
  var exp = now + 900;
  var qKeyTime = now + ';' + exp;
  var qSignAlgorithm = 'sha1';
  var policy = JSON.stringify({
    expiration: new Date(exp * 1000).toISOString(),
    conditions: [
      // {'acl': query.ACL},
      // ['starts-with', '$Content-Type', 'image/*'],
      // ['starts-with', '$success_action_redirect', redirectUrl],
      // ['eq', '$x-cos-server-side-encryption', 'AES256'],
      // ['content-length-range', 1, 5 * 1024 * 1024], // 可限制上传文件大小范围比如1 - 5MB
      { 'q-sign-algorithm': qSignAlgorithm },
      { 'q-ak': ak },
      { 'q-sign-time': qKeyTime },
      { bucket: config.bucket },
      { key: cosKey },
    ],
  });

  var qSignature = calcPostSign({ policy, qKeyTime, sk });

  res.send({
    cosHost,
    cosKey,
    policyObj: JSON.parse(policy),
    policy: Buffer.from(policy).toString('base64'),
    qSignAlgorithm: qSignAlgorithm,
    qAk: ak,
    qKeyTime: qKeyTime,
    qSignature: qSignature,
  });
});

// 2.2 限制上传文件的大小和类型
app.all('/post-policy-limit', async function (req, res, next) {
  var query = req.query;
  var ext = query.ext;

  // 判断异常情况
  if (!config.secretId || !config.secretKey)
    return res.send({ code: '-1', message: 'secretId or secretKey not ready' });
  if (!config.bucket || !config.region) return res.send({ code: '-1', message: 'bucket or regions not ready' });
  // if (!config.extWhiteList.includes(ext)) return res.send({code: '-1', message: 'ext not allow'});

  // 服务端生成随机Key并计算签名
  var cosKey = generateCosKey(ext);

  var ak = config.secretId;
  var sk = config.secretKey;

  var now = Math.round(Date.now() / 1000);
  var exp = now + 900;
  var qKeyTime = now + ';' + exp;
  var qSignAlgorithm = 'sha1';
  var policy = JSON.stringify({
    expiration: new Date(exp * 1000).toISOString(),
    conditions: [
      // {'acl': query.ACL},
      ['starts-with', '$Content-Type', 'image/*'], // 限制上传文件类型
      // ['starts-with', '$success_action_redirect', redirectUrl],
      // ['eq', '$x-cos-server-side-encryption', 'AES256'],
      ['content-length-range', 1, 5 * 1024 * 1024], // 可限制上传文件大小范围比如1 - 5MB
      { 'q-sign-algorithm': qSignAlgorithm },
      { 'q-ak': ak },
      { 'q-sign-time': qKeyTime },
      { bucket: config.bucket },
      { key: cosKey },
    ],
  });

  var qSignature = calcPostSign({ policy, qKeyTime, sk });

  res.send({
    cosHost,
    cosKey,
    policyObj: JSON.parse(policy),
    policy: Buffer.from(policy).toString('base64'),
    qSignAlgorithm: qSignAlgorithm,
    qAk: ak,
    qKeyTime: qKeyTime,
    qSignature: qSignature,
  });
});

app.all('*', function (req, res, next) {
  res.send({ code: -1, message: '404 Not Found' });
});

// 启动签名服务
app.listen(3000);
console.log('app is listening at http://127.0.0.1:3000');
