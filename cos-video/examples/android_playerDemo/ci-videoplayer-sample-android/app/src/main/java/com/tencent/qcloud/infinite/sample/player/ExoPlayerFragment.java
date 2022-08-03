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

import static com.google.android.exoplayer2.Player.STATE_READY;

import android.graphics.Point;
import android.os.Bundle;
import android.view.View;
import android.widget.ImageButton;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.bumptech.glide.Glide;
import com.google.android.exoplayer2.ExoPlayer;
import com.google.android.exoplayer2.Format;
import com.google.android.exoplayer2.MediaItem;
import com.google.android.exoplayer2.Player;
import com.google.android.exoplayer2.Tracks;
import com.google.android.exoplayer2.trackselection.TrackSelectionParameters;
import com.google.android.exoplayer2.ui.PlayerView;
import com.tencent.qcloud.infinite.sample.R;
import com.tencent.qcloud.infinite.sample.base.ResolutionPopupWindow;

import java.util.ArrayList;
import java.util.List;

/**
 * google exoplayer播放器页面
 */
public class ExoPlayerFragment extends BasePlayerFragment {
    protected ImageView coverImage;
    protected ImageButton ibPlay;
    protected TextView tvResolution;

    private ExoPlayer player;
    public ExoPlayerFragment() {
        super(R.layout.fragment_exo);
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

        PlayerView playerView = view.findViewById(R.id.video_view);
        player = new ExoPlayer.Builder(getActivity()).build();
        playerView.setPlayer(player);

        player.addListener(new Player.Listener() {
            @Override
            public void onTrackSelectionParametersChanged(@NonNull TrackSelectionParameters parameters) {
                Toast.makeText(getActivity(), String.format("清晰度切换为：%d x %d", parameters.maxVideoWidth, parameters.maxVideoHeight), Toast.LENGTH_LONG).show();
            }

            @Override
            public void onIsPlayingChanged(boolean isPlaying) {
                if (isPlaying) {
                    coverImage.setVisibility(View.GONE);
                    ibPlay.setVisibility(View.GONE);
                }
            }

            @Override
            public void onPlaybackStateChanged(int playbackState) {
                if (playbackState == STATE_READY) {
                    if (videoPlayerActivity.isCoverImage()) {
                        ibPlay.setVisibility(View.VISIBLE);
                    }

                    //获取视频的清晰度列表
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
                        //弹出清晰度选择列表
                        resolutionPopupWindow = new ResolutionPopupWindow(getActivity(), resolutions);
                        resolutionPopupWindow.setListener(resolution -> {
                                    //切换清晰度
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

        loadUrl();

        view.findViewById(R.id.btnReload).setOnClickListener(view1 -> loadUrl());
        ibPlay.setOnClickListener(view1 -> player.play());
    }

    /**
     * 加载视频url
     */
    private void loadUrl() {
        //设置封面图片
        if (videoPlayerActivity.isCoverImage()) {
            coverImage.setVisibility(View.VISIBLE);
            Glide.with(getActivity())
                    .load(COVER_PICTURE_URL)
                    .into(coverImage);
        }

        MediaItem mediaItem = MediaItem.fromUri(videoPlayerActivity.getUrl());
        player.setMediaItem(mediaItem);
        player.prepare();
        if (!videoPlayerActivity.isCoverImage()) {
            player.play();
        }
    }

    @Override
    public void onPause() {
        super.onPause();
        player.pause();
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        player.release();
        player = null;
    }
}
