package main

import (
	"context"
	"fmt"
	"net/http"
	"net/url"
	"time"

	"github.com/dgrijalva/jwt-go"
	"github.com/tencentyun/cos-go-sdk-v5"
)

type JwtTokens struct {
	// base info
	Type     string `json:"Type"`
	AppId    string `json:"AppId"`
	BucketId string `json:"BucketId"`
	Object   string `json:"Object"`
	Issuer   string `json:"Issuer"`
	// time info
	IssuedTimeStamp int64 `json:"IssuedTimeStamp"`
	ExpireTimeStamp int64 `json:"ExpireTimeStamp"`
	// other info
	Random int64 `json:"Random"`
	// times info
	UsageLimit int `json:"UsageLimit"`
	// secret info
	ProtectSchema     string `json:"ProtectSchema"`
	PublicKey         string `json:"PublicKey"`
	ProtectContentKey int    `json:"ProtectContentKey"`
}

// 播放秘钥，可通过到控制台（存储桶详情->数据处理->媒体处理）获取填写到这里，也可以调用万象 API 获取
var Secret = []byte("xxx")

func (token JwtTokens) Valid() error {
	return nil
}

// 生成jwt
func GenerateToken() (string, error) {
	t := time.Now()
	now := t.Unix()
	payLoad := JwtTokens{
		// 固定为 CosCiToken， 必填参数
		Type: "CosCiToken",
		// app id，必填参数
		AppId: "1234567890",
		// 播放文件所在的BucketId， 必填参数
		BucketId: "test-1234567890",
		// 播放文件名
		Object: "hls_test/no_uri_key.m3u8",
		// 固定为client，必填参数
		Issuer: "client",
		// token颁发时间戳，必填参数
		IssuedTimeStamp: now,
		// token过期时间戳，非必填参数，默认1天过期
		ExpireTimeStamp: t.Add(time.Hour * 24 * 6).Unix(),
		// token使用次数限制，非必填参数，默认限制100次
		UsageLimit: 20,
		// 保护模式，填写为 rsa1024 ，则表示使用 RSA 非对称加密的方式保护，公私钥对长度为 1024 bit
		ProtectSchema: "rsa1024",
		// 公钥。1024 bit 的 RSA 公钥，需使用 Base64 进行编码
		PublicKey: "xxx",
		// 是否加密解密密钥（播放时解密ts视频流的密钥），1表示对解密密钥加密，0表示不对解密密钥加密。
		ProtectContentKey: 0,
	}
	//使用指定的签名方法创建签名对象
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, payLoad)

	//使用指定的secret签名并获得完成的编码后的字符串token
	return token.SignedString(Secret)
}

type URLToken struct {
	SessionToken string `url:"x-cos-security-token,omitempty" header:"-"`
}

func GetURL() {
	// 替换成您的腾讯云密钥
	secretId := "xxx"
	secretKey := "xxx"
	token := &URLToken{
		SessionToken: "",
	}

	// 替换成您的桶名称
	bucketName := "test-1234567890"
	// 替换成您桶所在的region
	region := "ap-chongqing"
	// 替换成您需要播放的视频名称
	objectName := "hls_test/no_uri_key.m3u8"

	u, _ := url.Parse("https://" + bucketName + ".cos." + region + ".myqcloud.com")
	b := &cos.BaseURL{BucketURL: u}
	c := cos.NewClient(b, &http.Client{})
	ctx := context.Background()

	// 获取预签名，需要安装cos go sdk https://github.com/tencentyun/cos-go-sdk-v5/tree/master
	presignedURL, err := c.Object.GetPresignedURL(ctx, http.MethodGet, objectName, secretId, secretKey, time.Hour, token)
	if err != nil {
		fmt.Printf("Error: %v\n", err)
		return
	}
	// 生成token
	ciToken, _ := GenerateToken()
	// 生成播放链接
	resultUrl := presignedURL.String() + "&tokenType=JwtToken&expires=3600&ci-process=pm3u8&token=" + ciToken
	fmt.Println(resultUrl)
}

func main() {
	GetURL()
}
