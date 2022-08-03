/*
 * Copyright (c) 2010-2020 Tencent Cloud. All rights reserved.
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the "Software"), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 *  The above copyright notice and this permission notice shall be included in all
 *  copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 *  SOFTWARE.
 */

package com.tencent.qcloud.infinite.sample.player;

import android.graphics.Point;
import android.os.Bundle;
import android.view.View;
import android.widget.ImageButton;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.bumptech.glide.Glide;
import com.tencent.qcloud.infinite.sample.R;
import com.tencent.qcloud.infinite.sample.base.ResolutionPopupWindow;
import com.tencent.rtmp.ITXLivePlayListener;
import com.tencent.rtmp.TXBitrateItem;
import com.tencent.rtmp.TXLiveConstants;
import com.tencent.rtmp.TXVodPlayer;
import com.tencent.rtmp.ui.TXCloudVideoView;

import java.util.ArrayList;
import java.util.List;

/**
 * 腾讯云TXCloud播放器
 */
public class TXPlayerFragment extends BasePlayerFragment {
    protected ImageView coverImage;
    protected ImageButton ibPlay;
    protected TextView tvResolution;
    private LinearLayout llError;
    private TextView tvError;

    TXCloudVideoView mPlayerView;
    //创建 player 对象
    TXVodPlayer mVodPlayer;

    public TXPlayerFragment() {
        super(R.layout.fragment_tx_video);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        coverImage = view.findViewById(R.id.cover_image);
        ibPlay = view.findViewById(R.id.ibPlay);
        tvResolution = view.findViewById(R.id.resolution);
        if (videoPlayerActivity.isSwitchResolution()) {
            tvResolution.setVisibility(View.VISIBLE);
        }

        llError = view.findViewById(R.id.llError);
        tvError = view.findViewById(R.id.tvError);

        mPlayerView = view.findViewById(R.id.video_view);
        mVodPlayer = new TXVodPlayer(getActivity());
        //关联 player 对象与视频渲染 view
        mVodPlayer.setPlayerView(mPlayerView);
        // 将图像等比例铺满整个屏幕
        mVodPlayer.setRenderMode(TXLiveConstants.RENDER_MODE_ADJUST_RESOLUTION);
        mVodPlayer.setPlayListener(new ITXLivePlayListener() {
            @Override
            public void onPlayEvent(int i, Bundle bundle) {
                if (i == TXLiveConstants.PLAY_EVT_VOD_PLAY_PREPARED) {
                    // 收到播放器已经准备完成事件，此时可以调用pause、resume、getWidth、getSupportedBitrates 等接口
                    if (videoPlayerActivity.isCoverImage()) {
                        ibPlay.setVisibility(View.VISIBLE);
                    }

                    //获取视频的清晰度列表
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
                        //弹出清晰度选择列表
                        resolutionPopupWindow = new ResolutionPopupWindow(getActivity(), resolutions);
                        resolutionPopupWindow.setListener(resolution -> {
                                    //切换清晰度
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

        if(videoPlayerActivity.isDASH()){
            llError.setVisibility(View.VISIBLE);
            tvError.setText("该播放器不支持DASH");
        }

        loadUrl();

        view.findViewById(R.id.btnReload).setOnClickListener(view1 -> loadUrl());
        ibPlay.setOnClickListener(view1 -> mVodPlayer.startPlay(videoPlayerActivity.getUrl()));
    }

    private void loadUrl() {
        //设置封面图片
        if (videoPlayerActivity.isCoverImage()) {
            coverImage.setVisibility(View.VISIBLE);
            Glide.with(getActivity())
                    .load(COVER_PICTURE_URL)
                    .into(coverImage);
        }
        mVodPlayer.startPlay(videoPlayerActivity.getUrl());
    }

    @Override
    public void onPause() {
        super.onPause();
        mVodPlayer.pause();
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        mVodPlayer.stopPlay(true);
        mPlayerView.onDestroy();
    }
}
