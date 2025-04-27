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

package com.tencent.cos.xml.utils;

import java.io.IOException;
import java.io.InputStream;

public class CRC64Calculator {
    public static long getCRC64(InputStream inputStream) {
        try {
            CRC64 crc64 = new CRC64();
            int readLen;
            byte[] buff = new byte[8 * 1024];
            while ((readLen = inputStream.read(buff)) != -1){
                crc64.update(buff, readLen);
            }
            return crc64.getValue();
        } catch (IOException e) {
            e.printStackTrace();
        }
        return -1;
    }

    public static long getCRC64(InputStream inputStream, long skip, long size) {

        try {
            long skipNumber = inputStream.skip(skip);
            if (skipNumber != skip) {
                return -1;
            }
            CRC64 crc64 = new CRC64();
            byte[] buff = new byte[8 * 1024];
            int readLen;
            long remainLength = size >= 0 ? size : Long.MAX_VALUE;
            int needSize = (int) Math.min(remainLength, buff.length);

            while (remainLength > 0L && (readLen = inputStream.read(buff, 0, needSize))!= -1){
                crc64.update(buff, readLen);
                remainLength -= readLen;
            }
            return crc64.getValue();
        } catch (IOException e) {
            e.printStackTrace();
        }
        return -1;
    }

    /**
     * 合并两个CRC64校验值
     * @param crc1 第一个CRC值
     * @param crc2 第二个CRC值
     * @param length2 第二个CRC值对应的数据长度
     * @return 合并后的CRC64值
     */
    public static long combineCRC64(long crc1, long crc2, long length2) {
        // 如果其中一个CRC为0，直接返回另一个
        if (crc1 == 0) return crc2;
        if (crc2 == 0) return crc1;

        // CRC64合并算法实现
        long[] x = new long[2];
        x[0] = crc1;
        x[1] = crc2;

        // 多项式: x^64 + x^4 + x^3 + x + 1 (ECMA标准)
        final long poly = 0xC96C5795D7870F42L;

        // 计算2^length2 mod poly
        long[] mat = new long[2];
        mat[0] = poly;  // 多项式
        mat[1] = 1L;    // 初始值

        while (length2 > 0) {
            if ((length2 & 1) != 0) {
                x[0] = multModPoly(mat[0], x[0], poly);
                x[1] = (multModPoly(mat[1], x[0], poly) ^ x[1]);
            }
            length2 >>>= 1;
            mat[1] = (multModPoly(mat[0], mat[1], poly) ^ mat[1]);
            mat[0] = multModPoly(mat[0], mat[0], poly);
        }
        return x[1];
    }

    /**
     * 多项式乘法模运算
     */
    private static long multModPoly(long a, long b, long poly) {
        long res = 0;
        while (b != 0) {
            if ((b & 1) != 0) {
                res ^= a;
            }
            a = (a << 1) ^ ((a < 0) ? poly : 0);
            b >>>= 1;
        }
        return res;
    }
}
