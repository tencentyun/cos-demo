// HLS加解密服务例子
const base64Url = require('base64-url');
const express = require('express');
const crypto = require('crypto');

// 配置参数
var config = {
    // 获取腾讯云密钥，建议使用限定权限的子用户的密钥 https://console.cloud.tencent.com/cam/capi
    secretId: process.env.SecretId,
    secretKey: process.env.SecretKey,
    // 播放秘钥，可通过接口获取或在控制台查看
    playerKey: process.env.playerKey
};
// 计算签名
var getAuth = function (opt) {
	opt = opt || {};

	  var secretId = opt.secretId;
	  var secretKey = opt.secretKey;
	  var method = opt.method || 'get';
	  method = method.toLowerCase();
	  var pathname = opt.pathname || '/';
	  var queryParams = opt.params || '';
	  var headers = opt.headers || '';
	  var getObjectKeys = function (obj) {
		  var list = [];
		  for (var key in obj) {
			  if (obj.hasOwnProperty(key)) {
				  list.push(key);
			  }
		  }
		  return list.sort();
	  };
	  var obj2str = function (obj) {
		  var i, key, val;
		  var list = [];
		  var keyList = Object.keys(obj);
		  for (i = 0; i < keyList.length; i++) {
			  key = keyList[i];
			  val = obj[key] || '';
			  key = key.toLowerCase();
			  key = encodeURIComponent(key);
			  list.push(key + '=' + encodeURIComponent(val));
		  }
		  return list.join('&');
	  };
	  // 签名有效起止时间
	  var now = parseInt(new Date().getTime() / 1000) - 1;
	  var expired = now; // now + ';' + (now + 60) + ''; // 签名过期时间为当前 + 3600s
	  if (opt.expires) {
		  expired += (opt.expires * 1);
	  } else {
		  expired += 3600;
	  }
	  // 要用到的 Authorization 参数列表
	  var qSignAlgorithm = 'sha1';
	  var qAk = secretId;
	  var qSignTime = now + ';' + expired;
	  var qKeyTime = now + ';' + expired;
	  var qHeaderList = getObjectKeys(headers).join(';').toLowerCase();
	  var qUrlParamList = getObjectKeys(queryParams).join(';').toLowerCase();
	  // 签名算法说明文档：https://www.qcloud.com/document/product/436/7778
	  // 步骤一：计算 SignKey
	  var signKey = crypto.createHmac('sha1', secretKey).update(qKeyTime).digest('hex');//CryptoJS.HmacSHA1(qKeyTime, secretKey).toString();
	  // 新增修改，formatString 添加 encodeURIComponent
	  //pathname = encodeURIComponent(pathname);
	  // 步骤二：构成 FormatString
	  var formatString = [method, pathname, obj2str(queryParams), obj2str(headers), ''].join('\n');
	  formatString = Buffer.from(formatString, 'utf8');
	  // 步骤三：计算 StringToSign
	  var sha1Algo = crypto.createHash('sha1');
	  sha1Algo.update(formatString);
	  var res = sha1Algo.digest('hex');
	  var stringToSign = ['sha1', qSignTime, res, ''].join('\n');
	  // 步骤四：计算 Signature
	  var qSignature = crypto.createHmac('sha1', signKey).update(stringToSign).digest('hex');//CryptoJS.HmacSHA1(stringToSign, signKey).toString();
	  // 步骤五：构造 Authorization
	  var authorization = [
		  'q-sign-algorithm=' + qSignAlgorithm,
		  'q-ak=' + qAk,
		  'q-sign-time=' + qSignTime,
		  'q-key-time=' + qKeyTime,
		  'q-header-list=' + qHeaderList,
		  'q-url-param-list=' + qUrlParamList,
		  'q-signature=' + qSignature
	].join('&');
	  return authorization;
};

function getToken({publicKey, protectContentKey, bucket, region, objectKey}) {
    let header = {
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
        ProtectContentKey: protectContentKey || 1,
        UsageLimit: 50,
        Object: objectKey,
    };
    let Header = base64Url.encode(JSON.stringify(header))
    let PayLoad = base64Url.encode(JSON.stringify(payload))
    let data = Header + "." + PayLoad
    let hash = crypto.createHmac('sha256', config.playKey).update(data).digest();
    let Signature = base64Url.encode(hash);
    let token = Header + '.' + PayLoad + '.' + Signature
    let authorization = getAuth({
        secretId: config.SecretId,
        secretKey: config.SecretKey,
        method: 'get',
        pathname: `/${objectKey}`,
        params: {
            'ci-process': 'pm3u8'
        },
    });
    return {token, authorization};
}


router.post('/hls/token', (req, res, next) => {
    const body = req.body;
    const src = body.src;
    const publicKey = body.publicKey;
    const protectContentKey = body.protectContentKey;
    const reg = /^https?:\/\/([a-z0-9-]+)\.cos\.([a-z0-9-]+)\.myqcloud\.com\/([^?]+)/;
    if (!reg.test(src)) return res.send({code: -1, message: 'src format error'});
    if (!publicKey) return res.send({code: -1, message: 'publicKey empty'});

    // 解析 url
    const [bucket, region, objectKey] = src.match(reg) || [];
    
    const {token, authorization} = getToken({publicKey, protectContentKey, bucket, region, objectKey}, res)
    res.send({code: 0, message: 'ok', data: {token, authorization}});
});

// 创建临时密钥服务和用于调试的静态服务
var app = express();


app.all('*', function (req, res, next) {
    res.send({code: -1, message: '404 Not Found'});
});

// 启动签名服务
app.listen(3000);
console.log('app is listening at http://127.0.0.1:3000');
