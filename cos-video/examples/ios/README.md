<p align="center">
  <a href="https://cloud.tencent.com/act/pro/cos-video" target="_blank" rel="noopener noreferrer">
    <img width="400" src="https://upload-dianshi-1255598498.file.myqcloud.com/upload/nodir/%E4%B8%BB%E4%BD%93%E5%9B%BE%E5%BD%A2%E9%9D%99%E6%80%81%E5%9B%BE-a1f13b58aa5ddb94cad0e5f594100bb0d2d8ec42.png" alt="Cos Video logo">
  </a>
</p>
<br/>
<p align="center">
  <a href="https://cloud.tencent.com/product/cos"><img src="https://img.shields.io/badge/对象存储(cos)-docs-blue" alt="cos"></a>
    <a href="https://cloud.tencent.com/product/ci"><img src="https://img.shields.io/badge/数据万象(ci)-docs-red" alt="ci"></a>
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
- 🔑 支持设置封面图
- 📚 支持切换视频清晰度
- ✨ 支持设置动态水印
- 📰 支持设置 LOGO

## Usage
### [TXLiteAVSDK_Player](https://cloud.tencent.com/document/product/881/20211)
```
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
```
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
```
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
