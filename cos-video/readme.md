<p align="center">
  <a href="https://cloud.tencent.com/act/pro/cos-video" target="_blank" rel="noopener noreferrer">
    <img width="400" src="https://upload-dianshi-1255598498.file.myqcloud.com/upload/nodir/%E4%B8%BB%E4%BD%93%E5%9B%BE%E5%BD%A2%E9%9D%99%E6%80%81%E5%9B%BE-a1f13b58aa5ddb94cad0e5f594100bb0d2d8ec42.png" alt="Cos Video logo">
  </a>
</p>
<br/>
<p align="center">
  <a href="https://cloud.tencent.com/product/cos"><img src="https://img.shields.io/badge/对象存储(cos)-docs-blue" alt="cos"></a>
    <a href="https://cloud.tencent.com/product/ci"><img src="https://img.shields.io/badge/数据万象(ci)-docs-red" alt="ci"></a>
  <a href="https://cloud.tencent.com/document/product/881/30818"><img src="https://img.shields.io/badge/tcplayer-docs-green" alt="tcplayer"></a>
  <a href="https://dplayer.js.org/"><img src="https://img.shields.io/badge/dplayer-docs-brightgreen" alt="dplayer"></a>
  <a href="https://videojs.com/"><img src="https://img.shields.io/badge/videojs-docs-red" alt="videojs"></a>
</p>
<br/>

# [COS 音视频体验馆](https://cloud.tencent.com/act/pro/cos-video) 📹

## Desc
欢迎体验 COS 音视频播放器解决方案，为了获取更好的产品功能及播放性能体验，建议结合[腾讯云数据万象(CI)](https://cloud.tencent.com/document/product/460/47503)使用。

## Feature

- 💡 支持播放 MP4 格式视频
- ⚡️ 支持播放 M3U8 格式视频
- 🛠️ 支持播放 PM3U8(私有M3U8) 视频。关于 PM3U8，详情请查看[相关文档](https://cloud.tencent.com/document/product/436/73189)
- 📦 支持播放 FLV 格式视频
- 🔩 支持播放 DASH 格式视频
- 🔑 支持设置封面图
- 📚 支持切换视频清晰度
- ✨ 支持设置动态水印
- 📰 支持设置 LOGO

## Usage
### TcPlayer
```
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, shrink-to-fit=no">
  <title>COS 音视频</title>
  <link href="https://web.sdk.qcloud.com/player/tcplayer/release/v4.2.1/tcplayer.min.css" rel="stylesheet">
  <!--如果需要在 Chrome 和 Firefox 等现代浏览器中通过 H5 播放 HLS 格式的视频，需要在 tcplayer.v4.2.min.js 之前引入 hls.min.0.13.2m.js。-->
  <script src="https://web.sdk.qcloud.com/player/tcplayer/release/v4.2.1/libs/hls.min.0.13.2m.js"></script>
  <!--播放器脚本文件-->
  <script src="https://web.sdk.qcloud.com/player/tcplayer/release/v4.5.0/tcplayer.v4.5.0.min.js"></script>
  <style>
    html,body {
      margin: 0;
      padding: 0;
      overflow: hidden;
    }
    .tcplayer {
      margin: 0 auto;
      width: 100%;
    }
  </style>
</head>
<body>
<!-- 设置播放器容器 -->
<video id="player-container-id" preload="auto" width="100%" height="450" playsinline webkit-playsinline>
</video>
<!--
注意事项：
* 播放器容器必须为 video 标签
* player-container-id 为播放器容器的ID，可自行设置
* 播放器区域的尺寸请按需设置，建议通过 css 进行设置，通过css可实现容器自适应等效果
* playsinline webkit-playsinline 这几个属性是为了在标准移动端浏览器不劫持视频播放的情况下实现行内播放，此处仅作示例，请按需使用
* 设置 x5-playsinline 属性会使用 X5 UI 的播放器
* 右键点击视频画面可选镜像
-->
<script>
  var player = TCPlayer("player-container-id", {});
  player.src('https://cos-video-1258344699.cos.ap-guangzhou.tencentcos.cn/test.mp4')
</script>
</body>
</html>

```

### DPlayer
```
<!DOCTYPE html>
<html lang="en">
  <head>
    <title>COS 音视频</title>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width" />
    <style>
      html, body {
        margin: 0;
        padding: 0;
        overflow: hidden;
        width: 100%;
      }
    </style>
  </head>
  <body>
    <div id="dplayer" style="width: 100%; height:450px"></div>
    <script src="https://cdn.jsdelivr.net/npm/dplayer@1.26.0/dist/DPlayer.min.js"></script>
    <script>
      const dp = new DPlayer({
        container: document.getElementById('dplayer'),
        video: {
          url: 'https://cos-video-1258344699.cos.ap-guangzhou.tencentcos.cn/test.mp4',
        },
      });
    </script>
  </body>
</html>

```

### VideojsPlayer
```
<!DOCTYPE html>
<html lang="en">
  <head>
    <title>COS 音视频</title>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width" />
    <!--
      Need a visual blank slate?
      Remove all code in `styles.css`!
    -->
    <link href="https://vjs.zencdn.net/7.19.2/video-js.css" rel="stylesheet" />
    <!-- If you'd like to support IE8 (for Video.js versions prior to v7) -->
    <!-- <script src="https://vjs.zencdn.net/ie8/1.1.2/videojs-ie8.min.js"></script> -->
    <style>
      html, body {
        margin: 0;
        padding: 0;
        overflow: hidden;
        width: 100%;
      }
      .video-js {
        width: 100%;
      }
      .video-js .vjs-big-play-button {
        top: 50%;
        left: 50%;
        margin-top: -0.81666em;
        margin-left: -1.5em;
      }
    </style>
  </head>

  <body>
    <video
      id="my-video"
      class="video-js"
      controls
      preload="auto"
      width="100%"
      height="450"
      data-setup="{}"
    >
      <source
        src="https://cos-video-1258344699.cos.ap-guangzhou.tencentcos.cn/test.mp4"
        type="video/mp4"
      />
      <p class="vjs-no-js">
        To view this video please enable JavaScript, and consider upgrading to a
        web browser that
        <a href="https://videojs.com/html5-video-support/" target="_blank"
          >supports HTML5 video</a
        >
      </p>
    </video>

    <script src="https://vjs.zencdn.net/7.19.2/video.min.js"></script>
  </body>
</html>
```

## More
更多示例请查看 [examples目录](https://github.com/tencentyun/cos-demo/tree/main/cos-video/examples)