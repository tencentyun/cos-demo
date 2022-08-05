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

package com.tencent.qcloud.infinite.sample;

import static com.tencent.qcloud.infinite.sample.VideoPlayerActivity.EXTRA_TAG;
import static com.tencent.qcloud.infinite.sample.VideoPlayerActivity.EXTRA_TIP;
import static com.tencent.qcloud.infinite.sample.VideoPlayerActivity.EXTRA_URL;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;

import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity implements View.OnClickListener {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        findViewById(R.id.btn_video).setOnClickListener(this);
        findViewById(R.id.btn_pm3u8).setOnClickListener(this);
        findViewById(R.id.btn_cover_image).setOnClickListener(this);
        findViewById(R.id.btn_resolution).setOnClickListener(this);
        findViewById(R.id.btn_watermark).setOnClickListener(this);
    }

    @Override
    public void onClick(View v) {
        String url = "";
        String tip = "";
        String tag = "";
        switch (v.getId()) {
            case R.id.btn_video:
                url = "https://cos-video-1258344699.cos.ap-guangzhou.tencentcos.cn/test.mp4";
                tip = "支持播放HLS、MP4、flv、dash等格式视频文件";
                tag = "视频播放";
                break;
            case R.id.btn_pm3u8:
                // 关于 pm3u8 详情请查看相关文档：https://cloud.tencent.com/document/product/436/73189
                url = "https://cos-video-1258344699.cos.ap-guangzhou.myqcloud.com/hls/test.m3u8?ci-process=pm3u8&expires=3600";
                tip = "支持播放私有读权限m3u8视频文件";
                tag = "PM3U8";
                break;
            case R.id.btn_cover_image:
                url = "https://cos-video-1258344699.cos.ap-guangzhou.tencentcos.cn/test.mp4";
                tag = "封面图";
                tip = "支持为视频设置预览封面图";
                break;
            case R.id.btn_resolution:
                url = "https://cos-video-1258344699.cos.ap-guangzhou.myqcloud.com/multi-definition/test_i2dfb2ce3075811edb7d0525400ed8f15.m3u8";
                tag = "切换清晰度";
                tip = "播放HLS或DASH自适应码流文件时，播放清晰度将默认采用自动切换逻辑，此时播放器将根据当前带宽，动态选择最合适的码率播放，用户也可以选择自行切换不同清晰度的子流";
                break;
            case R.id.btn_watermark:
                url = "https://cos-video-1258344699.cos.ap-guangzhou.myqcloud.com/dynamicWatermark.mov";
                tip = "播放器支持为视频添加位置与速度产生变换的水印";
                tag = "动态水印";
                break;
        }
        Intent intent = new Intent(this, VideoPlayerActivity.class);
        intent.putExtra(EXTRA_URL, url);
        intent.putExtra(EXTRA_TIP, tip);
        intent.putExtra(EXTRA_TAG, tag);
        startActivity(intent);
    }
}