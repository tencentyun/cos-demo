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

- 🚀 支持 web、android、ios 多端播放
- 💡 支持播放 MP4 格式视频
- ⚡️ 支持播放 M3U8 格式视频
- 🛠️ 支持播放 PM3U8(私有M3U8) 视频。关于 PM3U8，详情请查看[相关文档](https://cloud.tencent.com/document/product/436/73189)
- 📦 支持播放 FLV 格式视频
- 🔩 支持播放 DASH 格式视频
- 🔑 支持设置封面图
- 📚 支持切换视频清晰度
- ✨ 支持设置动态水印
- 📰 支持设置 LOGO
- 🎈 支持设置进度预览图
- ⛱️ 支持设置字幕
- 🎊 支持设置多语言
- 💰 支持设置贴片广告

## Web
### [TcPlayer](https://cloud.tencent.com/document/product/881/30818)
```html
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

### [DPlayer](https://dplayer.js.org/)
```html
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

### [VideojsPlayer](https://videojs.com/)
```html
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

## Android
### [ExoPlayer](https://exoplayer.dev/)
```java
// 创建播放器
PlayerView playerView = view.findViewById(R.id.video_view);
ExoPlayer player = new ExoPlayer.Builder(getActivity()).build();
playerView.setPlayer(player);

// 设置播放器回调
player.addListener(new Player.Listener() {
    // 码率切换回调
    @Override
    public void onTrackSelectionParametersChanged(@NonNull TrackSelectionParameters parameters) {
        Toast.makeText(getActivity(), String.format("清晰度切换为：%d x %d", parameters.maxVideoWidth, parameters.maxVideoHeight), Toast.LENGTH_LONG).show();
    }
    // 播放状态回调
    @Override
    public void onPlaybackStateChanged(int playbackState) {
        if (playbackState == STATE_READY) {
            if (videoPlayerActivity.isCoverImage()) {
                ibPlay.setVisibility(View.VISIBLE);
            }
            // 获取视频的清晰度列表
            List<Point> resolutions = new ArrayList<>();
            for (Tracks.Group trackGroup : player.getCurrentTracks().getGroups()) {
                if (trackGroup.isAdaptiveSupported()) {
                    for (int i = 0; i < trackGroup.length; i++) {
                        if (trackGroup.isTrackSupported(i)) {
                            Format trackFormat = trackGroup.getTrackFormat(i);
                            resolutions.add(new Point(trackFormat.width, trackFormat.height));
                        }
                    }
                }
            }
            tvResolution.setOnClickListener(view1 -> {
                if(resolutionPopupWindow != null && resolutionPopupWindow.isShowing()){
                    resolutionPopupWindow.dismiss();
                    return;
                }
                // 弹出清晰度选择列表
                resolutionPopupWindow = new ResolutionPopupWindow(getActivity(), resolutions);
                resolutionPopupWindow.setListener(resolution -> {
                            // 切换清晰度
                            player.setTrackSelectionParameters(
                                    player.getTrackSelectionParameters()
                                            .buildUpon()
                                            .setMaxVideoSize(resolution.x, resolution.y)
                                            .build());
                            resolutionPopupWindow.dismiss();
                            tvResolution.setText(resolution.x + "P");
                        }
                );
                resolutionPopupWindow.showAsDropDown(tvResolution, 0, 0);
            });
        }
    }
});

// 设置播放源并准备
MediaItem mediaItem = MediaItem.fromUri(videoPlayerActivity.getUrl());
player.setMediaItem(mediaItem);
player.prepare();

// 开始播放
player.play();

// 暂停播放
player.pause();

// 释放资源
player.release();
```

### [SuperPlayer](https://cloud.tencent.com/document/product/881/20213)
```java
@property (nonatomic, strong)SuperPlayerView * playerView;
// 创建播放器
SuperPlayerView mSuperPlayerView = view.findViewById(R.id.super_player);
mSuperPlayerView.showOrHideBackBtn(false);

// 创建播放资源
SuperPlayerModel model = new SuperPlayerModel();
model.url = videoPlayerActivity.getUrl();
mSuperPlayerView.playWithModel(model);
// 设置封面图连接
if(videoPlayerActivity.isCoverImage()){
    model.playAction = PLAY_ACTION_MANUAL_PLAY;
    model.coverPictureUrl = COVER_PICTURE_URL;
} else {
    model.playAction = PLAY_ACTION_AUTO_PLAY;
}

// 开始播放
mSuperPlayerView.playWithModel(model);

// 暂停播放
mSuperPlayerView.onPause();

// 释放资源
mSuperPlayerView.resetPlayer();
```

### [TXCloudPlayer](https://cloud.tencent.com/document/product/881/20216)
```java
// 创建播放器
TXCloudVideoView mPlayerView = view.findViewById(R.id.video_view);
TXVodPlayer mVodPlayer = new TXVodPlayer(getActivity());
// 关联 player 对象与视频渲染 view
mVodPlayer.setPlayerView(mPlayerView);
mVodPlayer.setRenderMode(TXLiveConstants.RENDER_MODE_ADJUST_RESOLUTION);

// 设置播放器回调
mVodPlayer.setPlayListener(new ITXLivePlayListener() {
    @Override
    public void onPlayEvent(int i, Bundle bundle) {
        if (i == TXLiveConstants.PLAY_EVT_VOD_PLAY_PREPARED) {
            // 收到播放器已经准备完成事件，此时可以调用pause、resume、getWidth、getSupportedBitrates 等接口
            if (videoPlayerActivity.isCoverImage()) {
                ibPlay.setVisibility(View.VISIBLE);
            }
            // 获取视频的清晰度列表
            ArrayList<TXBitrateItem> bitrates = mVodPlayer.getSupportedBitrates();
            List<Point> resolutions = new ArrayList<>();
            for (TXBitrateItem item : bitrates) {
                resolutions.add(new Point(item.height, item.width));
            }
            tvResolution.setOnClickListener(view1 -> {
                if (resolutionPopupWindow != null && resolutionPopupWindow.isShowing()) {
                    resolutionPopupWindow.dismiss();
                    return;
                }
                // 弹出清晰度选择列表
                resolutionPopupWindow = new ResolutionPopupWindow(getActivity(), resolutions);
                resolutionPopupWindow.setListener(resolution -> {
                            // 切换清晰度
                            int bitratesIndex = 0;
                            for (TXBitrateItem item : bitrates) {
                                if (item.width == resolution.x && item.height == resolution.y) {
                                    bitratesIndex = item.index;
                                }
                            }
                            // 切换码率到想要的清晰度
                            mVodPlayer.setBitrateIndex(bitratesIndex);
                            resolutionPopupWindow.dismiss();
                            tvResolution.setText(resolution.x + "P");
                        }
                );
                resolutionPopupWindow.showAsDropDown(tvResolution, 0, 0);
            });
        } else if (i == TXLiveConstants.PLAY_EVT_PLAY_BEGIN) {
            // 收到开始播放事件
            coverImage.setVisibility(View.GONE);
            ibPlay.setVisibility(View.GONE);
        }
    }
    @Override
    public void onNetStatus(Bundle bundle) {
    }
});

// 设置封面图片
if (videoPlayerActivity.isCoverImage()) {
    coverImage.setVisibility(View.VISIBLE);
    Glide.with(getActivity())
            .load(COVER_PICTURE_URL)
            .into(coverImage);
}

// 开始播放
mVodPlayer.startPlay(videoPlayerActivity.getUrl());

// 暂停播放
mVodPlayer.pause();

// 释放资源
mVodPlayer.stopPlay(true);
mPlayerView.onDestroy();
```

## iOS
### [TXLiteAVSDK_Player](https://cloud.tencent.com/document/product/881/20211)
```Objective-C
@property(nonatomic,strong)TXVodPlayer *txVodPlayer;

// 创建播放器
self.txVodPlayer = [[TXVodPlayer alloc] init];
// 添加播放器到页面
[_txVodPlayer setupVideoWidget:self.playerContentView insertIndex:0];
// 开始播放链接
[_txVodPlayer startPlay:self.videoLink];
// 暂停播放
[self.txVodPlayer stopPlay];

// 获取多码率视频数组
NSArray *bitrates = [_txVodPlayer supportedBitrates];
// 播放指定码率视频
[_txVodPlayer setBitrateIndex:index - 1];
```

### [SuperPlayer](https://cloud.tencent.com/document/product/881/20208)
```Objective-C
@property (nonatomic, strong)SuperPlayerView * playerView;
// 创建播放器
_playerView = [[SuperPlayerView alloc] init];
_playerView.fatherView = self.playerContentView;

// 创建播放资源
SuperPlayerModel *playermodel = [[SuperPlayerModel alloc] init];
playermodel.videoURL = self.videoLink;
playermodel.action  = PLAY_ACTION_AUTO_PLAY;

// 设置动态水印
DynamicWaterModel *model = [[DynamicWaterModel alloc] init];
model.dynamicWatermarkTip = @"数据万象";
model.textFont = 30;
model.textColor = [UIColor colorWithRed:255.0/255.0 green:255.0/255.0 blue:255.0/255.0 alpha:0.8];
playermodel.dynamicWaterModel = model;

// 设置封面图连接
playermodel.customCoverImageUrl = @"https://cos-video-1258344699.cos.ap-guangzhou.myqcloud.com/poster.png";
playermodel.action  = PLAY_ACTION_MANUAL_PLAY;
// 开始播放
[self.playerView playWithModel:playermodel];

// 暂停播放
[self.playerView pause];
```

### AVPlayer
```Objective-C
@property (no
natomic, strong)AVPlayerViewController *playerVc;
// 创建播放器
_playerVc = [[AVPlayerViewController alloc] init];
_playerVc.view.backgroundColor = [UIColor whiteColor];
_playerVc.view.frame = self.playerContentView.bounds;
// 添加播放器到页面
[self.playerContentView addSubview:self.playerVc.view];
// 播放链接
AVPlayer *player = [AVPlayer playerWithURL:[NSURL URLWithString:self.videoLink]];
self.playerVc.player = player;
[self.playerVc.player play];
```

## More
更多示例请查看 [examples目录](https://github.com/tencentyun/cos-demo/tree/main/cos-video/examples)