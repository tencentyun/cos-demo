<template>
  <view class="content">
    <button type="default" @click="selectUpload">选择文件上传</button>
    <image v-if="fileUrl" class="image" :src="fileUrl"></image>
  </view>
</template>

<script>
export default {
  data() {
    return {
      title: 'Hello',
      fileUrl: ''
    };
  },
  onLoad() {

  },
  methods: {
    selectUpload() {

      var vm = this;

      // 对更多字符编码的 url encode 格式
      var camSafeUrlEncode = function (str) {
        return encodeURIComponent(str)
            .replace(/!/g, '%21')
            .replace(/'/g, '%27')
            .replace(/\(/g, '%28')
            .replace(/\)/g, '%29')
            .replace(/\*/g, '%2A');
      };

      // 获取上传路径、上传凭证L
      var getUploadInfo = function (extName, callback) {
        // 传入文件后缀，让后端生成随机的 COS 对象路径，并返回上传域名、PostObject 接口要用的 policy 签名
        // 参考服务端示例：https://github.com/tencentyun/cos-demo/server/post-policy/
        uni.request({
          url: 'http://127.0.0.1:3000/post-policy?ext=' + extName,
          success: (res) => {
            callback && callback(null, res.data.data);
          },
          error(err) {
            callback && callback(err);
          },
        });
      };

      // 发起上传请求，上传使用 PostObject 接口，使用 policy 签名保护
      // 接口文档：https://cloud.tencent.com/document/product/436/14690#.E7.AD.BE.E5.90.8D.E4.BF.9D.E6.8A.A4
      var uploadFile = function (opt, callback) {
        var formData = {
          key: opt.cosKey,
          policy: opt.policy, // 这个传 policy 的 base64 字符串
          success_action_status: 200,
          'q-sign-algorithm': opt.qSignAlgorithm,
          'q-ak': opt.qAk,
          'q-key-time': opt.qKeyTime,
          'q-signature': opt.qSignature,
        };
        // 如果服务端用了临时密钥计算，需要传 x-cos-security-token
        if (opt.securityToken) formData['x-cos-security-token'] = formData.securityToken;
        uni.uploadFile({
          url: 'https://' + opt.cosHost, //仅为示例，非真实的接口地址
          filePath: opt.filePath,
          name: 'file',
          formData: formData,
          success: (res) => {
            if (![200, 204].includes(res.statusCode)) return callback && callback(res);
            var fileUrl = 'https://' + opt.cosHost + '/' + camSafeUrlEncode(opt.cosKey).replace(/%2F/g, '/');
            callback && callback(null, fileUrl);
          },
          error(err) {
            callback && callback(err);
          },
        });
      };

      // 选择文件
      uni.chooseImage({
        success: (chooseImageRes) => {
          var file = chooseImageRes.tempFiles[0];
          if (!file) return;
          // 获取要上传的本地文件路径
          var filePath = chooseImageRes.tempFilePaths[0];
          // 获取上传的文件后缀，然后后端生成随机 COS 路径地址
          var fileName = file.name;
          var lastIndex = fileName.lastIndexOf('.');
          var extName = lastIndex > -1 ? fileName.slice(lastIndex + 1) : '';
          // 获取预上传用的域名、路径、凭证
          getUploadInfo(extName, function (err, info) {
            // 上传文件
            info.filePath = filePath;
            uploadFile(info, function (err, fileUrl) {
              vm.fileUrl = fileUrl;
            });
          });
        }
      });
    },
  }
}
</script>

<style>
.content {
  padding: 20px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.image {
  margin-top: 20px;
  margin-left: auto;
  margin-right: auto;
}
</style>
