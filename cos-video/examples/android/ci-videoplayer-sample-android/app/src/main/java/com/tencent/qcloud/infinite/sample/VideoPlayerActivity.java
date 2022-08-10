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

import android.os.Bundle;
import android.widget.EditText;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.appcompat.app.ActionBar;
import androidx.fragment.app.Fragment;
import androidx.viewpager2.adapter.FragmentStateAdapter;
import androidx.viewpager2.widget.ViewPager2;

import com.google.android.material.tabs.TabLayout;
import com.google.android.material.tabs.TabLayoutMediator;
import com.tencent.qcloud.infinite.sample.base.BaseActivity;
import com.tencent.qcloud.infinite.sample.player.ExoPlayerFragment;
import com.tencent.qcloud.infinite.sample.player.SuperPlayerFragment;
import com.tencent.qcloud.infinite.sample.player.TXPlayerFragment;

public class VideoPlayerActivity extends BaseActivity {
    public static final String EXTRA_URL = "extra_url";
    public static final String EXTRA_TIP = "extra_tip";
    public static final String EXTRA_TAG = "extra_tag";

    private ViewPager2 viewPager;
    private String url;
    private String tip;
    private String tag;
    private EditText etUrl;

    private ViewPager2.OnPageChangeCallback onPageChangeCallback = null;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_video_player);

        url = getIntent().getStringExtra(EXTRA_URL);
        tip = getIntent().getStringExtra(EXTRA_TIP);
        tag = getIntent().getStringExtra(EXTRA_TAG);

        ActionBar actionBar = getSupportActionBar();
        if (actionBar != null) {
            actionBar.setTitle(tag);
        }

        etUrl = findViewById(R.id.etUrl);
        etUrl.setText(url);
        ((TextView)findViewById(R.id.tvTip)).setText(tip);

        TabLayout tabLayout = findViewById(R.id.tabLayout);
        viewPager = findViewById(R.id.viewPager);
        viewPager.setUserInputEnabled(false);

        viewPager.setAdapter(new FragmentStateAdapter(this) {
            @NonNull
            @Override
            public Fragment createFragment(int position) {
                getSupportFragmentManager().getFragments();
                switch (position) {
                    case 1:
                        return new SuperPlayerFragment();
                    case 2:
                        return new TXPlayerFragment();
                    default:
                        return new ExoPlayerFragment();
                }
            }

            @Override
            public int getItemCount() {
                return 3;
            }
        });

        new TabLayoutMediator(tabLayout, viewPager, false, false, (tab, position) -> {
            switch (position) {
                case 1:
                    tab.setText("TXSuper");
                    break;
                case 2:
                    tab.setText("TXCloud");
                    break;
                default:
                    tab.setText("Exo");
                    break;
            }
        }).attach();
    }

    public void setOnPageChangeCallback(@NonNull ViewPager2.OnPageChangeCallback onPageChangeCallback) {
        if(this.onPageChangeCallback != null){
            viewPager.unregisterOnPageChangeCallback(this.onPageChangeCallback);
        }
        this.onPageChangeCallback = onPageChangeCallback;
        viewPager.registerOnPageChangeCallback(onPageChangeCallback);
    }

    public String getUrl() {
        if(etUrl.getText() != null && !etUrl.getText().toString().isEmpty()){
            return etUrl.getText().toString();
        } else {
            return url;
        }
    }

    public boolean isCoverImage(){
        return "封面图".equals(tag);
    }

    public boolean isSwitchResolution(){
        return "切换清晰度".equals(tag);
    }

    public boolean isDASH(){
        return "DASH".equals(tag);
    }
}