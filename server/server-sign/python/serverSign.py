#!/usr/bin/env python
# coding=utf-8
import json
import os
import datetime
import random
from urllib.parse import urlencode

from qcloud_cos import CosConfig, CosS3Client

from sts.sts import Sts


if __name__ == '__main__':

    # 配置参数
    config = {
        "filename":"test.jpg",
        "appId": "1250000000",
        "secretId": os.getenv("SecretId"),
        "secretKey": os.getenv("SecretKey"),
        "proxy": os.getenv("Proxy"),
        "durationSeconds": 1800,
        "bucket": "0-1253960454",
        "region": "ap-guangzhou",
        # 密钥的上传操作权限列表
        "allowActions": [
            # 简单上传
            "name/cos:PutObject",
            # 分块上传
            "name/cos:InitiateMultipartUpload",
            "name/cos:ListMultipartUploads",
            "name/cos:ListParts",
            "name/cos:UploadPart",
            "name/cos:CompleteMultipartUpload",
        ],
    }

    permission = {
        "limitExt": True,  # 限制上传文件后缀
        "extWhiteList": ["jpg", "jpeg", "png", "gif", "bmp"],  # 限制的上传后缀
        "limitContentType": False,  # 限制上传 contentType
        "limitContentLength": False,  # 限制上传文件大小
    }


    # 生成要上传的 COS 文件路径文件名
    def generate_cos_key(ext=None):
        date = datetime.datetime.now()
        ymd = date.strftime('%Y%m%d')
        r = str(int(random.random() * 1000000)).zfill(6)
        cos_key = f"file/{ymd}/{ymd}_{r}.{ext if ext else ''}"
        return cos_key


    segments = config['filename'].split(".")
    ext = segments[-1] if segments else ""
    key = generate_cos_key(ext)
    resource = f"qcs::cos:{config['region']}:uid/{config['appId']}:{config['bucket']}/{key}"

    condition = {}

    # 1. 限制上传文件后缀
    if permission["limitExt"]:
        ext_invalid = not ext or ext not in permission["extWhiteList"]
        if ext_invalid:
            print('非法文件，禁止上传')

    # 2. 限制上传文件 content-type
    if permission["limitContentType"]:
        condition.update({
            "string_like_if_exist": {
                # 只允许上传 content-type 为图片类型
                "cos:content-type": "image/*"
            }
        })

    # 3. 限制上传文件大小
    if permission["limitContentLength"]:
        condition.update({
            "numeric_less_than_equal": {
                # 上传大小限制不能超过 5MB(只对简单上传生效)
                "cos:content-length": 5 * 1024 * 1024
            }
        })


    def get_credential_demo():
        credentialOption = {
            # 临时密钥有效时长，单位是秒
            'duration_seconds': config.get('durationSeconds'),
            'secret_id': config.get("secretId"),
            # 固定密钥
            'secret_key': config.get("secretKey"),
            # 换成你的 bucket
            'bucket': config.get("bucket"),
            'proxy': config.get("proxy"),
            # 换成 bucket 所在地区
            'region': config.get("region"),
            "policy": {
                "version": '2.0',
                "statement": [
                    {
                        "action": config.get("allowActions"),
                        "effect": "allow",
                        "resource": [
                            resource
                        ],
                        "condition": condition
                    }
                ],
            },
        }

        try:

            sts = Sts(credentialOption)
            response = sts.get_credential()
            credential_dic = dict(response)
            credential_info = credential_dic.get("credentials")
            credential = {
                "bucket": config.get("bucket"),
                "region": config.get("region"),
                "key": key,
                "startTime": credential_dic.get("startTime"),
                "expiredTime": credential_dic.get("expiredTime"),
                "requestId": credential_dic.get("requestId"),
                "expiration": credential_dic.get("expiration"),
                "credentials": {
                    "tmpSecretId": credential_info.get("tmpSecretId"),
                    "tmpSecretKey": credential_info.get("tmpSecretKey"),
                    "sessionToken": credential_info.get("sessionToken"),
                },
            }
            return credential
        except Exception as e:
            print(e)


    result = get_credential_demo()
    credentials = result["credentials"]
    secret_id = credentials["tmpSecretId"]
    secret_key = credentials["tmpSecretKey"]
    token = credentials["sessionToken"]
    bucket = result["bucket"]
    region = result["region"]
    key = result["key"]
    expired = result["expiredTime"]

    config = CosConfig(Region=region, SecretId=secret_id, SecretKey=secret_key, Token=token)
    client = CosS3Client(config)
    sign = client.get_auth(Method='put',Bucket=bucket, Key=key, Expired=expired, Params={
        'x-cos-security-token': token
    },SignHost=True)
    sign = urlencode(dict([item.split('=', 1) for item in sign.split('&')]))
    host = "https://" + result["bucket"] + ".cos." + result["region"] + ".myqcloud.com"
    response = {
        "cosHost":host,
        "cosKey":key,
        "authorization":sign,
        "securityToken":token
    }
    print('get data : ' + json.dumps(response, indent=4))