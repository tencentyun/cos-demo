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

import static com.tencent.liteav.demo.superplayer.SuperPlayerModel.PLAY_ACTION_AUTO_PLAY;
import static com.tencent.liteav.demo.superplayer.SuperPlayerModel.PLAY_ACTION_MANUAL_PLAY;

import android.os.Bundle;
import android.view.View;
import android.widget.LinearLayout;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.tencent.liteav.demo.superplayer.SuperPlayerModel;
import com.tencent.liteav.demo.superplayer.SuperPlayerView;
import com.tencent.qcloud.infinite.sample.R;

/**
 * 腾讯云超级播放器
 */
public class SuperPlayerFragment extends BasePlayerFragment {
    SuperPlayerView mSuperPlayerView;
    private LinearLayout llError;
    private TextView tvError;

    public SuperPlayerFragment() {
        super(R.layout.fragment_tx_superplayer);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        llError = view.findViewById(R.id.llError);
        tvError = view.findViewById(R.id.tvError);

        mSuperPlayerView = view.findViewById(R.id.super_player);
        mSuperPlayerView.showOrHideBackBtn(false);

        loadUrl();

        if(videoPlayerActivity.isDASH()){
            llError.setVisibility(View.VISIBLE);
            tvError.setText("该播放器不支持DASH");
        }

        view.findViewById(R.id.btnReload).setOnClickListener(view1 -> loadUrl());
    }

    private void loadUrl(){
        SuperPlayerModel model = new SuperPlayerModel();
        model.url = videoPlayerActivity.getUrl();
        mSuperPlayerView.playWithModel(model);
        if(videoPlayerActivity.isCoverImage()){
            model.playAction = PLAY_ACTION_MANUAL_PLAY;
            model.coverPictureUrl = COVER_PICTURE_URL;
        } else {
            model.playAction = PLAY_ACTION_AUTO_PLAY;
        }
        mSuperPlayerView.playWithModel(model);
    }

    @Override
    public void onPause() {
        super.onPause();
        mSuperPlayerView.onPause();
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        mSuperPlayerView.resetPlayer();
    }
}
