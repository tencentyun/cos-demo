// 临时密钥服务例子
const express = require('express');
const request = require('request');
const util = require('./util');

const config = {
    // 获取腾讯云密钥，建议使用限定权限的子用户的密钥 https://console.cloud.tencent.com/cam/capi
    secretId: "AKIxxxxxx",
    secretKey: "xxxxxx",
}

const signExp = 10 * 60; // 签名过期时间

// 创建token续期服务和用于调试的静态服务
const app = express();

// 获取签名接口
app.all('/getSign', function (req, res, next) {
    // 从请求中获取请求方法与请求参数
    const { method, query: { filePath }} = req;
    const pathname = filePath.substring(1);
    // 计算签名需要的参数
    const opt = {
        SecretId: config.secretId,
        SecretKey: config.secretKey,
        method,
        Pathname: pathname,
        Expires: signExp,
    }
    // 计算得到签名
    const sign = util.getAuth(opt);

    // 如果需要返回跨域头
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:63342'); // 这里修改允许跨域访问的网站
    res.setHeader('Access-Control-Allow-Headers', 'origin,accept,content-type');

    // 返回签名信息
    res.send({
		code: 0,
        data: {
            sign
        },
    });
});

// 获取 Token 接口
app.all('/refreshToken', function (req, res, next) {
    // 服务端在此处可以进行自己的逻辑处理，如鉴别客户端身份，是否继续提供token续期服务
    /* Write your code here... */

    // 从请求中获取参数
    const { query: { Bucket, Region, filePath, tokenuid }} = req;

    // 根据 Bucket, Region, filePath 拼接文件完整路径
    const pathname = filePath.substring(1);
    const encodeKey = util.camSafeUrlEncode(pathname).replace(/%2F/g, "/");
    let domain = "";
    if (Region.includes("cos-cdc")) {
        domain = `${Bucket}.${Region}.myqcloud.com`;
    } else {
        domain = `${Bucket}.cos.${Region}.myqcloud.com`;
    }
    const objectUrl = "https://" + domain + "/" + encodeKey;

    // 计算签名需要的参数
    const opt = {
        SecretId: config.secretId,
        SecretKey: config.secretKey,
        method: "get",
        Pathname: pathname,
        Expires: signExp,
    }
    // 计算得到签名
    const sign = util.getAuth(opt);

    // 拼接getObject请求的url
    const url = `${objectUrl}?ci-process=doc-preview&dstType=html&weboffice_url=1&tokenuid=${tokenuid}&sign=${util.camSafeUrlEncode(sign)}`;

    // 发起getObject请求，获取 Token
    request(url, (err, result) => {
        if (err) {
            return console.log(err);
        }

        // IE返回的是string
        if (typeof result.body === 'string') {
            result.body = JSON.parse(result.body);
        }
        console.log(result.body)

        // 从返回结果中获取 Token 和 Token过期时间戳
        const Token = result.body && result.body.Token ? result.body.Token : '';
        const TokenExpireTime = result.body && result.body.TokenExpireTime ? result.body.TokenExpireTime : '';

        // 如果需要返回跨域头
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', 'http://localhost:63342'); // 这里修改允许跨域访问的网站
        res.setHeader('Access-Control-Allow-Headers', 'origin,accept,content-type');

        // 返回 Token 与 Token过期时间戳
        res.send({
            code: 0,
            data: {
                Token,
                TokenExpireTime
            },
        });
    });
});

app.all('*', function (req, res, next) {
    res.send({code: -1, message: '404 Not Found'});
});

// 启动服务端token续期服务
app.listen(3000);
console.log('app is listening at http://127.0.0.1:3000');
