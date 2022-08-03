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
import android.util.DisplayMetrics;
import android.view.WindowManager;

import java.text.DecimalFormat;
import java.util.Locale;

public class Utils {
    /**
     * 将byte转换为更加友好的单位
     *
     * @param sizeInB byte
     * @return 更加友好的单位（KB、GB等）
     */
    public static String readableStorageSize(long sizeInB) {
        float floatSize = sizeInB;
        int index = 0;
        String[] units = new String[]{"B", "KB", "MB", "GB", "TB", "PB"};

        while (floatSize > 1000 && index < 5) {
            index++;
            floatSize /= 1024;
        }

        String capacityText = new DecimalFormat("###,###,###.##").format(floatSize);
        return String.format(Locale.ENGLISH, "%s%s", capacityText, units[index]);
    }

    /**
     * 根据手机的分辨率从 dp 的单位 转成为 px(像素)
     */
    public static int dip2px(Context context, float dpValue) {
        DisplayMetrics displayMetrics = new DisplayMetrics();
        ((WindowManager) context.getApplicationContext().getSystemService(Context.WINDOW_SERVICE))
                .getDefaultDisplay().getMetrics(displayMetrics);
        final float scale = displayMetrics.density;
        return (int) (dpValue * scale + 0.5f);
    }
}
