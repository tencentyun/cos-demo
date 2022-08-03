// 临时密钥服务例子
const express = require('express');
const request = require('request');
const util = require('./lib/util');

const config = {
    // 获取腾讯云密钥，建议使用限定权限的子用户的密钥 https://console.cloud.tencent.com/cam/capi
    secretId: "AKIxxxxxx",
    secretKey: "xxxxxx",
}

// 创建临时密钥服务和用于调试的静态服务
const app = express();

// 获取签名接口
app.all('/getSign', function (req, res, next) {
    const { method, query: { objectUrl, exp }} = req;
    const pathname = objectUrl.substring(objectUrl.lastIndexOf('/'), objectUrl.length);
    const opt = {
        SecretId: config.secretId,
        SecretKey: config.secretKey,
        method,
        Pathname: pathname,
        Expires: exp,
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

// 获取 Token 方法
app.all('/refreshToken', function (req, res, next) {
    const { query: { objectUrl, copyable, htmlwaterword, htmlfillstyle, htmlfront, htmlrotate, htmlhorizontal, htmlvertical, tokenuid, sign }} = req;
    const params = {
        copyable,
        htmlwaterword,
        htmlfillstyle,
        htmlfront,
        htmlrotate,
        htmlhorizontal,
        htmlvertical,
        tokenuid,
    }
    // 获取签名
    request(`http://127.0.0.1:3000/getSign?objectUrl=${objectUrl}`, { json: true }, (err, result, body) => {
        if (err) { return console.log(err); }
        const { body: { data: { sign }}} = result;

        // 拼接请求url
        let url = ''.concat(objectUrl, '?ci-process=doc-preview&dstType=html&weboffice_url=1');
        if (params) {
            const paramsStr = util.queryStringify(params);

            if (paramsStr) {
                url += (url.indexOf('?') === -1 ? '?' : '&') + paramsStr;
            }
        }
        url = `${url}&sign=${util.camSafeUrlEncode(sign)}`;

        // 发起getObject请求，获取 Token
        request(url, (err, result) => {
            if (err) { return console.log(err); }

            // IE返回的是string
            if (typeof result.body === 'string') {
                result.body = JSON.parse(result.body);
            }

            const token = result.body && result.body.Token ? result.body.Token : '';

            // 如果需要返回跨域头
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', 'http://localhost:63342'); // 这里修改允许跨域访问的网站
            res.setHeader('Access-Control-Allow-Headers', 'origin,accept,content-type');

            // 返回 Token
            res.send({
                code: 0,
                data: {
                    Token: token
                },
            });
        });
    });
});

app.all('*', function (req, res, next) {
    res.send({code: -1, message: '404 Not Found'});
});

// 启动服务端token续期服务
app.listen(3000);
console.log('app is listening at http://127.0.0.1:3000');
