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

package com.tencent.qcloud.infinite.sample.base;

import android.content.Context;
import android.graphics.Color;
import android.graphics.Point;
import android.util.DisplayMetrics;
import android.view.Gravity;
import android.view.View;
import android.view.WindowManager;
import android.widget.LinearLayout;
import android.widget.PopupWindow;
import android.widget.TextView;

import java.util.List;

/**
 * 清晰度切换弹窗
 */
public class ResolutionPopupWindow extends PopupWindow {
    private OnResolutionListener listener;
    private List<Point> resolutions;
    public ResolutionPopupWindow(Context context, List<Point> resolutions) {
        super(context);
        this.resolutions = resolutions;
        setContentView(getView(context));
    }

    private View getView(Context context) {
        LinearLayout linearLayout = new LinearLayout(context);
        linearLayout.setOrientation(LinearLayout.VERTICAL);
        linearLayout.setBackgroundColor(Color.parseColor("#303030"));

        for (int i = 0; i < resolutions.size(); i++){
            TextView textView = new TextView(context);
            textView.setTextColor(Color.WHITE);
            textView.setText(resolutions.get(i).x + "P");
            textView.setPadding(dp2px(context, 10), 0, dp2px(context, 10), 0);
            textView.setGravity(Gravity.CENTER);
            LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(dp2px(context, 80), dp2px(context, 30));
            textView.setLayoutParams(params);
            int finalI = i;
            textView.setOnClickListener(view -> {
                if(listener != null){
                    listener.onResolutionSelect(resolutions.get(finalI));
                }
            });

            View line = new View(context);
            LinearLayout.LayoutParams paramsLine = new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, 1);
            line.setLayoutParams(paramsLine);
            line.setBackgroundColor(Color.parseColor("#eeeeee"));

            linearLayout.addView(textView);
            if(i < resolutions.size() -1) {
                linearLayout.addView(line);
            }
        }

        return linearLayout;
    }

    public void setListener(OnResolutionListener listener) {
        this.listener = listener;
    }

    public interface OnResolutionListener {
        void onResolutionSelect(Point resolution);
    }

    private int dp2px(Context context, float dp) {
        final float screenDensity = getDisplayMetrics(context).density;
        return (int) (dp * screenDensity);
    }

    private DisplayMetrics getDisplayMetrics(Context context) {
        WindowManager manager = (WindowManager) context.getSystemService(Context.WINDOW_SERVICE);
        DisplayMetrics displayMetrics = new DisplayMetrics();
        if (manager != null) {
            manager.getDefaultDisplay().getMetrics(displayMetrics);
            return displayMetrics;
        }
        return displayMetrics;
    }
}
