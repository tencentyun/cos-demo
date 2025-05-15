package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/tencentyun/cos-go-sdk-v5"
	sts "github.com/tencentyun/qcloud-cos-sts-sdk"
	"math/rand"
	"net/http"
	"net/url"
	"os"
	"reflect"
	"strings"
	"time"
	"unicode"
)

type Config struct {
	filename        string
	appId           string
	SecretId        string
	SecretKey       string
	Proxy           string
	DurationSeconds int
	Bucket          string
	Region          string
	AllowActions    []string
}

type Permission struct {
	LimitExt           bool     `json:"limitExt"`
	ExtWhiteList       []string `json:"extWhiteList"`
	LimitContentType   bool     `json:"limitContentType"`
	LimitContentLength bool     `json:"limitContentLength"`
}

func generateCosKey(ext string) string {
	date := time.Now()
	m := int(date.Month()) + 1
	ymd := fmt.Sprintf("%d%02d%d", date.Year(), m, date.Day())
	r := fmt.Sprintf("%06d", rand.Intn(1000000))
	cosKey := fmt.Sprintf("file/%s/%s_%s.%s", ymd, ymd, r, ext)
	return cosKey
}

func getPermission() Permission {
	permission := Permission{
		LimitExt:           true,
		ExtWhiteList:       []string{"jpg", "jpeg", "png", "gif", "bmp"},
		LimitContentType:   false,
		LimitContentLength: false,
	}
	return permission
}

func getConfig() Config {
	config := Config{
		filename:        "test.jpg",
		appId:           "12500000000",
		SecretId:        os.Getenv("SECRETID"),  // 用户的 SecretId，建议使用子账号密钥，授权遵循最小权限指引，降低使用风险。子账号密钥获取可参考https://cloud.tencent.com/document/product/598/37140
		SecretKey:       os.Getenv("SECRETKEY"), // 用户的 SecretKey，建议使用子账号密钥，授权遵循最小权限指引，降低使用风险。子账号密钥获取可参考https://cloud.tencent.com/document/product/598/37140
		Proxy:           os.Getenv("Proxy"),
		DurationSeconds: 1800,
		Bucket:          "0-1253960454",
		Region:          "ap-guangzhou",
		AllowActions: []string{
			"name/cos:PutObject",
			"name/cos:InitiateMultipartUpload",
			"name/cos:ListMultipartUploads",
			"name/cos:ListParts",
			"name/cos:UploadPart",
			"name/cos:CompleteMultipartUpload",
		},
	}
	return config
}

func stringInSlice(str string, list []string) bool {
	for _, v := range list {
		if v == str {
			return true
		}
	}
	return false
}

func StructToCamelMap(input interface{}) map[string]interface{} {
	v := reflect.ValueOf(input)
	if v.Kind() == reflect.Ptr {
		v = v.Elem()
	}

	result := make(map[string]interface{})
	typ := v.Type()

	for i := 0; i < v.NumField(); i++ {
		field := typ.Field(i)
		fieldValue := v.Field(i)

		// 转换字段名为小驼峰
		key := toLowerCamel(field.Name)

		// 处理嵌套结构体
		if fieldValue.Kind() == reflect.Struct ||
			(fieldValue.Kind() == reflect.Ptr && fieldValue.Elem().Kind() == reflect.Struct) {

			if fieldValue.IsNil() && fieldValue.Kind() == reflect.Ptr {
				result[key] = nil
				continue
			}

			result[key] = StructToCamelMap(fieldValue.Interface())
		} else {
			// 处理基本类型
			result[key] = fieldValue.Interface()
		}
	}

	return result
}

// 转换为小驼峰格式（首字母小写）
func toLowerCamel(s string) string {
	if s == "" {
		return s
	}

	// 处理全大写单词（如 ID）
	if strings.ToUpper(s) == s {
		return strings.ToLower(s)
	}

	// 普通小驼峰转换
	runes := []rune(s)
	runes[0] = unicode.ToLower(runes[0])
	return string(runes)
}

func getStsCredential() (map[string]interface{}, error) {
	config := getConfig()

	permission := getPermission()

	c := sts.NewClient(
		// 通过环境变量获取密钥, os.Getenv 方法表示获取环境变量
		config.SecretId,  //os.Getenv("SECRETID"),  // 用户的 SecretId，建议使用子账号密钥，授权遵循最小权限指引，降低使用风险。子账号密钥获取可参考https://cloud.tencent.com/document/product/598/37140
		config.SecretKey, //os.Getenv("SECRETKEY"),                 // 用户的 SecretKey，建议使用子账号密钥，授权遵循最小权限指引，降低使用风险。子账号密钥获取可参考https://cloud.tencent.com/document/product/598/37140
		nil,
		// sts.Host("sts.internal.tencentcloudapi.com"), // 设置域名, 默认域名sts.tencentcloudapi.com
		// sts.Scheme("http"),      // 设置协议, 默认为https，公有云sts获取临时密钥不允许走http，特殊场景才需要设置http
	)

	condition := make(map[string]map[string]interface{})

	segments := strings.Split(config.filename, ".")
	if len(segments) == 0 {
		//ext := ""
	}
	ext := segments[len(segments)-1]

	if permission.LimitExt {
		extInvalid := ext == "" || !stringInSlice(ext, permission.ExtWhiteList)
		if extInvalid {
			return nil, errors.New("非法文件，禁止上传")
		}
	}

	if permission.LimitContentType {
		condition["string_like_if_exist"] = map[string]interface{}{
			// 只允许上传 content-type 为图片类型
			"cos:content-type": "image/*",
		}
	}

	// 3. 限制上传文件大小
	if permission.LimitContentLength {
		condition["numeric_less_than_equal"] = map[string]interface{}{
			// 上传大小限制不能超过 5MB(只对简单上传生效)
			"cos:content-length": 5 * 1024 * 1024,
		}
	}

	key := generateCosKey(ext)
	// 策略概述 https://cloud.tencent.com/document/product/436/18023
	opt := &sts.CredentialOptions{
		DurationSeconds: int64(config.DurationSeconds),
		Region:          config.Region,
		Policy: &sts.CredentialPolicy{
			Version: "2.0",
			Statement: []sts.CredentialPolicyStatement{
				{
					// 密钥的权限列表。简单上传和分片需要以下的权限，其他权限列表请看 https://cloud.tencent.com/document/product/436/31923
					Action: config.AllowActions,
					Effect: "allow",
					Resource: []string{
						// 这里改成允许的路径前缀，可以根据自己网站的用户登录态判断允许上传的具体路径，例子： a.jpg 或者 a/* 或者 * (使用通配符*存在重大安全风险, 请谨慎评估使用)
						// 存储桶的命名格式为 BucketName-APPID，此处填写的 bucket 必须为此格式
						"qcs::cos:ap-guangzhou:uid/" + config.appId + ":" + config.Bucket + "/" + key,
					},
					// 开始构建生效条件 condition
					// 关于 condition 的详细设置规则和COS支持的condition类型可以参考https://cloud.tencent.com/document/product/436/71306
					Condition: condition,
				},
			},
		},
	}

	// case 1 请求临时密钥
	res, err := c.GetCredential(opt)
	if err != nil {
		return nil, err
	}
	// 转换为小驼峰 map
	resultMap := StructToCamelMap(res)
	resultMap["bucket"] = config.Bucket
	resultMap["region"] = config.Region
	resultMap["key"] = key

	return resultMap, nil
}

func main() {
	result, err := getStsCredential()
	if err != nil {
		fmt.Printf("请求临时密钥失败: %v\n", err)
		return // 根据上下文决定是否退出
	}

	// 类型断言 credentials 为 map[string]interface{}
	credentials, ok := result["credentials"].(map[string]interface{})
	if !ok {
		fmt.Println("凭证格式错误")
		return
	}
	// 带类型检查的字段获取
	tak, tok := credentials["tmpSecretID"].(string)
	tsk, tskok := credentials["tmpSecretKey"].(string)
	token, tokenok := credentials["sessionToken"].(string)
	if !tok || !tskok || !tokenok {
		fmt.Println("临时凭证字段缺失或类型错误")
		return
	}
	host := "https://" + result["bucket"].(string) + ".cos." + result["region"].(string) + ".myqcloud.com"
	u, _ := url.Parse(host)
	b := &cos.BaseURL{BucketURL: u}
	c := cos.NewClient(b, &http.Client{})
	name := result["key"].(string)
	ctx := context.Background()
	opt := &cos.PresignedURLOptions{
		Query:  &url.Values{},
		Header: &http.Header{},
	}
	opt.Query.Add("x-cos-security-token", token)
	signature := c.Object.GetSignature(ctx, http.MethodPut, name, "tak", "tsk", time.Hour, opt, true)
	fmt.Printf("%s%s%s%s", tak, tsk, signature, token)
	data := make(map[string]string)

	// 添加token和sign
	data["securityToken"] = token
	data["authorization"] = signature
	data["cosHost"] = host
	data["cosKey"] = name
	// 转换为JSON
	jsonData, err := json.MarshalIndent(data, "", "  ")
	if err != nil {
		fmt.Println("JSON编码失败:", err)
		return
	}
	fmt.Println(string(jsonData))
}
