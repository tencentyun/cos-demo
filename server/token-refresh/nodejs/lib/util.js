const CryptoJS = require('./crypto');

const isArray = function(arr) {
    return arr instanceof Array;
};

const clone = function(obj) {
    return map(obj, function (v) {
        return typeof v === 'object' && v !== null ? clone(v) : v;
    });
};

const map = function(obj, fn) {
    const o = isArray(obj) ? [] : {};
    for (const i in obj) {
        if (obj.hasOwnProperty(i)) {
            o[i] = fn(obj[i], i);
        }
    }
    return o;
};
const signHeaders = ['content-disposition', 'content-encoding', 'content-length', 'content-md5',
    'expect', 'host', 'if-match', 'if-modified-since', 'if-none-match', 'if-unmodified-since',
    'origin', 'range', 'response-cache-control', 'response-content-disposition', 'response-content-encoding',
    'response-content-language', 'response-content-type', 'response-expires', 'transfer-encoding', 'versionid'];

const getSignHeaderObj = function (headers) {
    const signHeaderObj = {};
    for (const i in headers) {
        const key = i.toLowerCase();
        if (key.indexOf('x-cos-') > -1 || signHeaders.indexOf(key) > -1) {
            signHeaderObj[i] = headers[i];
        }
    }
    return signHeaderObj;
}

// 获取调正的时间戳
const getSkewTime = function (offset) {
    return Date.now() + (offset || 0);
};

const getObjectKeys = function (obj, forKey) {
    const list = [];
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            list.push(forKey ? camSafeUrlEncode(key).toLowerCase() : key);
        }
    }
    return list.sort(function (a, b) {
        a = a.toLowerCase();
        b = b.toLowerCase();
        return a === b ? 0 : (a > b ? 1 : -1);
    });
};

const camSafeUrlEncode = function (str) {
    return encodeURIComponent(str)
        .replace(/!/g, '%21')
        .replace(/'/g, '%27')
        .replace(/\(/g, '%28')
        .replace(/\)/g, '%29')
        .replace(/\*/g, '%2A');
}

const obj2str = function (obj, lowerCaseKey) {
    var i, key, val;
    var list = [];
    var keyList = getObjectKeys(obj);
    for (i = 0; i < keyList.length; i++) {
        key = keyList[i];
        val = (obj[key] === undefined || obj[key] === null) ? '' : ('' + obj[key]);
        key = lowerCaseKey? camSafeUrlEncode(key).toLowerCase() : camSafeUrlEncode(key);
        val = camSafeUrlEncode(val) || '';
        list.push(key + '=' + val)
    }
    return list.join('&');
};

//测试用的key后面可以去掉
const getAuth = function (opt) {
    opt = opt || {};

    const SecretId = opt.SecretId;
    const SecretKey = opt.SecretKey;
    const KeyTime = opt.KeyTime;
    const method = (opt.method || opt.Method || 'get').toLowerCase();
    const queryParams = clone(opt.Query || opt.params || {});
    const headers = getSignHeaderObj(clone(opt.Headers || opt.headers || {}));

    const Key = opt.Key || '';
    let pathname;
    if (opt.UseRawKey) {
        pathname = opt.Pathname || opt.pathname || '/' + Key;
    } else {
        pathname = opt.Pathname || opt.pathname || Key;
        pathname.indexOf('/') !== 0 && (pathname = '/' + pathname);
    }

    // ForceSignHost明确传入false才不加入host签名
    const forceSignHost = opt.ForceSignHost === false ? false : true;

    // 如果有传入存储桶且需要强制签名，那么签名默认加 Host 参与计算，避免跨桶访问
    if (!headers.Host && !headers.host && opt.Bucket && opt.Region && forceSignHost) headers.Host = opt.Bucket + '.cos.' + opt.Region + '.myqcloud.com';

    if (!SecretId) throw new Error('missing param SecretId');
    if (!SecretKey) throw new Error('missing param SecretKey');

    // 签名有效起止时间
    const now = Math.round(getSkewTime(opt.SystemClockOffset) / 1000) - 1;
    let exp = now;

    const Expires = opt.Expires || opt.expires;
    if (Expires === undefined) {
        exp += 900; // 签名过期时间为当前 + 900s
    } else {
        exp += (Expires * 1) || 0;
    }

    // 要用到的 Authorization 参数列表
    const qSignAlgorithm = 'sha1';
    const qAk = SecretId;
    const qSignTime = KeyTime || now + ';' + exp;
    const qKeyTime = KeyTime || now + ';' + exp;
    const qHeaderList = getObjectKeys(headers, true).join(';').toLowerCase();
    const qUrlParamList = getObjectKeys(queryParams, true).join(';').toLowerCase();

    // 签名算法说明文档：https://www.qcloud.com/document/product/436/7778
    // 步骤一：计算 SignKey
    const signKey = CryptoJS.HmacSHA1(qKeyTime, SecretKey).toString();

    // 步骤二：构成 FormatString
    const formatString = [method, pathname, obj2str(queryParams, true), obj2str(headers, true), ''].join('\n');

    // 步骤三：计算 StringToSign
    const stringToSign = ['sha1', qSignTime, CryptoJS.SHA1(formatString).toString(), ''].join('\n');

    // 步骤四：计算 Signature
    const qSignature = CryptoJS.HmacSHA1(stringToSign, signKey).toString();

    // 步骤五：构造 Authorization
    const authorization = [
        'q-sign-algorithm=' + qSignAlgorithm,
        'q-ak=' + qAk,
        'q-sign-time=' + qSignTime,
        'q-key-time=' + qKeyTime,
        'q-header-list=' + qHeaderList,
        'q-url-param-list=' + qUrlParamList,
        'q-signature=' + qSignature
    ].join('&');

    return authorization;

}

const getPreviewUrlAndToken = function getPreviewUrlAndToken(opts) {
    const { copyable, tokenuid, htmlwaterword, htmlfillstyle, htmlfront, htmlrotate, htmlhorizontal, htmlvertical } = opts;

    // 获取签名
    const auth = getAuth(opts);
    return new Promise((resolve, reject) => {
        REQUEST({
            method: 'GET',
            url: ''.concat(opts.objectUrl, '?ci-process=doc-preview&dstType=html&weboffice_url=1'),
            qs: {
                sign: auth,
                tokenuid,
                copyable,
                htmlwaterword,
                htmlfillstyle,
                htmlfront,
                htmlrotate,
                htmlhorizontal,
                htmlvertical,
            },
            dataType: 'json',
        }, (res) => {
            if (res.error) {
                console.error(res.error);
                reject(res.error);
                return;
            }

            // IE返回的是string
            if (typeof res.body === 'string') {
                res.body = JSON.parse(res.body);
            }

            resolve(res.body);
        });
    });
};

const stringifyPrimitive = function (v) {
    switch (typeof v ) {
        case 'string':
            return v;

        case 'boolean':
            return v ? 'true' : 'false';

        case 'number':
            return isFinite(v) ? v : '';

        default:
            return '';
    }
};

const queryStringify = function (obj, sep, eq, name) {
    sep = sep || '&';
    eq = eq || '=';

    if (obj === null) {
        obj = undefined;
    }

    if (typeof obj === 'object') {
        return Object.keys(obj).map((k) => {
            const ks = encodeURIComponent(stringifyPrimitive(k)) + eq;

            if (Array.isArray(obj[k])) {
                return obj[k].map(v => ks + encodeURIComponent(stringifyPrimitive(v))).join(sep);
            }

            return ks + encodeURIComponent(stringifyPrimitive(obj[k]));
        })
            .filter(Boolean)
            .join(sep);
    }

    if (!name) return '';
    return encodeURIComponent(stringifyPrimitive(name)) + eq + encodeURIComponent(stringifyPrimitive(obj));
};

const util = {
    getAuth,
    getPreviewUrlAndToken,
    queryStringify,
    camSafeUrlEncode
};

module.exports = util;
