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

## Usage
#### 以下为部分代码，可运行的完整代码为[android_playerDemo](https://github.com/tencentyun/cos-demo/tree/main/cos-video/examples/android_playerDemo)
### [ExoPlayer](https://exoplayer.dev/)
```
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
```
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
```
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

## More
更多示例请查看 [android_playerDemo](https://github.com/tencentyun/cos-demo/tree/main/cos-video/examples/android_playerDemo)
