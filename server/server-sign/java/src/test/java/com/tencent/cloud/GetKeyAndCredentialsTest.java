package com.tencent.cloud;

import com.qcloud.cos.COSClient;
import com.qcloud.cos.ClientConfig;
import com.qcloud.cos.auth.BasicSessionCredentials;
import com.qcloud.cos.auth.COSCredentials;
import com.qcloud.cos.http.HttpMethodName;
import com.qcloud.cos.region.Region;
import com.tencent.cloud.cos.util.Jackson;
import org.junit.Test;

import java.net.URL;
import java.text.SimpleDateFormat;
import java.util.*;

public class GetKeyAndCredentialsTest {

    public static String generateCosKey(String ext) {
        Date date = new Date();
        SimpleDateFormat dateFormat = new SimpleDateFormat("yyyyMMdd");
        String ymd = dateFormat.format(date);

        Random random = new Random();
        int r = random.nextInt(1000000);
        String rStr = String.format("%06d", r);

        String cosKey = String.format("file/%s/%s_%s.%s", ymd, ymd, rStr, ext != null ? ext : "");
        return cosKey;
    }

    // 获取配置信息
    public TreeMap<String,Object> getConfig(){

        String bucket = "0-1250000000";
        String appId = "1250000000";
        String filename = "test.jpg";
        String region = "ap-guangzhou";
        String secretId = "";
        String secretKey = "";
        String proxy  = "";
        int durationSeconds = 1800;

        String[] segments = filename.split("\\.");
        String ext = segments.length > 0 ? segments[segments.length - 1] : "";

        // 临时密钥限制
        Boolean limitExt = false; // 限制上传文件后缀
        List extWhiteList = Arrays.asList("jpg", "jpeg", "png", "gif", "bmp"); // 限制的上传后缀
        Boolean limitContentType = false; // 限制上传 contentType
        Boolean limitContentLength = false; // 限制上传文件大小


        Map<String, Object> condition = new HashMap();

        // 1. 限制上传文件后缀
        if (limitExt) {
            boolean extInvalid = ext == null || !extWhiteList.contains(ext);
            if (extInvalid) {
                System.out.println("非法文件，禁止上传");
                return null;
            }
        }

        // 2. 限制上传文件 content-type
        if (limitContentType) {
            condition.put("string_like_if_exist", new HashMap<String, String>() {{
                put("cos:content-type", "image/*");
            }});
        }

        // 3. 限制上传文件大小(只对简单上传生效)
        if (limitContentLength) {
            condition.put("numeric_less_than_equal", new HashMap<String, Long>() {{
                put("cos:content-length", 5L * 1024 * 1024);
            }});
        }
        String key = generateCosKey(ext);
        String resource = "qcs::cos:" + region + ":uid/" + appId + ':' + bucket + '/' + key;
        List allowActions = Arrays.asList(
                // 简单上传
                "name/cos:PutObject",
                // 分块上传
                "name/cos:InitiateMultipartUpload",
                "name/cos:ListMultipartUploads",
                "name/cos:ListParts",
                "name/cos:UploadPart",
                "name/cos:CompleteMultipartUpload"
        );

        // 构建policy
        Map<String, Object> policy = new HashMap();
        policy.put("version", "2.0");
        Map<String, Object> statement = new HashMap();
        statement.put("action", allowActions);
        statement.put("effect", "allow");
        List<String> resources = Arrays.asList(
                resource
        );
        statement.put("resource", resources);
        statement.put("condition", condition);
        policy.put("statement", Arrays.asList(statement));


        // 构建config
        TreeMap <String,Object> config = new TreeMap<String, Object>();
        config.put("secretId",secretId);
        config.put("secretKey",secretKey);
        config.put("proxy",proxy);
        config.put("duration",durationSeconds);
        config.put("bucket",bucket);
        config.put("region",region);
        config.put("key",key);
        config.put("policy",Jackson.toJsonPrettyString(policy));
        return config;
    }

    public TreeMap <String,Object> getKeyAndCredentials() {
        TreeMap config = this.getConfig();
        try {
            Response response = CosStsClient.getCredential(config);
            TreeMap <String,Object> credential = new TreeMap<String, Object>();
            TreeMap <String,Object> credentials = new TreeMap<String, Object>();
            credentials.put("tmpSecretId",response.credentials.tmpSecretId);
            credentials.put("tmpSecretKey",response.credentials.tmpSecretKey);
            credentials.put("sessionToken",response.credentials.sessionToken);
            credential.put("startTime",response.startTime);
            credential.put("expiredTime",response.expiredTime);
            credential.put("requestId",response.requestId);
            credential.put("expiration",response.expiration);
            credential.put("credentials",credentials);
            credential.put("bucket",config.get("bucket"));
            credential.put("region",config.get("region"));
            credential.put("key",config.get("key"));
            return credential;
        } catch (Exception e) {
            e.printStackTrace();
            throw new IllegalArgumentException("no valid secret !");
        }
    }
    /**
     * 基本的临时密钥申请示例，适合对一个桶内的一批对象路径，统一授予一批操作权限
     */
    @Test
    public void testGetKeyAndCredentials() {
        TreeMap <String,Object> credential = this.getKeyAndCredentials();
        TreeMap <String,Object> credentials = (TreeMap<String, Object>) credential.get("credentials");
        try {


            String tmpSecretId = (String) credentials.get("tmpSecretId");
            String tmpSecretKey = (String) credentials.get("tmpSecretKey");
            String sessionToken = (String) credentials.get("sessionToken");
            Date expiredTime = new Date((Long) credential.get("expiredTime"));
            String key = (String) credential.get("key");
            String bucket = (String) credential.get("bucket");
            String region = (String) credential.get("region");

            COSCredentials cred = new BasicSessionCredentials(tmpSecretId, tmpSecretKey, sessionToken);
            ClientConfig clientConfig = new ClientConfig();
            clientConfig.setRegion(new Region(region));

            COSClient cosClient = new COSClient(cred, clientConfig);


            Map<String, String> headers = new HashMap<String,String>();
            Map<String, String> params = new HashMap<String,String>();
            params.put("x-cos-security-token",sessionToken);
            URL url = cosClient.generatePresignedUrl(bucket, key, expiredTime, HttpMethodName.PUT, headers, params);
            String host = "https://" + url.getHost();
            String query = url.toString().split("\\?")[1];
            String sign = query.split("&x-cos-security-token")[0];
            TreeMap <String,Object> result = new TreeMap<String, Object>();
            result.put("cosHost",host);
            result.put("cosKey",key);
            result.put("authorization",sign);
            result.put("securityToken",sessionToken);
            System.out.println(Jackson.toJsonPrettyString(result));
        } catch (Exception e) {
        	    e.printStackTrace();
            throw new IllegalArgumentException("no valid sign !");
        }
    }
}