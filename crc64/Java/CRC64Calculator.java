import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;

public class CRC64Calculator {
    // 定义 ECMA 多项式
    private static final long CRC64_POLY = 0xc96c5795d7870f42L;
    private static final long[] CRC64_TABLE = new long[256];

    static {
        // 生成 CRC64 表
        for (int i = 0; i < 256; i++) {
            long crc = i;
            for (int j = 0; j < 8; j++) {
                if ((crc & 1) == 1) {
                    crc = (crc >>> 1) ^ CRC64_POLY;
                } else {
                    crc >>>= 1;
                }
            }
            CRC64_TABLE[i] = crc;
        }
    }

    /**
     * 计算字节数据的 CRC64 值
     * @param data 字节数据
     * @return CRC64 值
     */
    public static long calculateCRC64(byte[] data) {
        long crc = 0;
        for (byte b : data) {
            crc = (crc >>> 8) ^ CRC64_TABLE[(int) ((crc ^ b) & 0xff)];
        }
        return crc;
    }

    /**
     * 计算文件的 CRC64 值
     * @param file 文件对象
     * @return CRC64 值
     * @throws IOException 如果文件读取出现错误
     */
    public static long calculateFileCRC64(File file) throws IOException {
        long crc = 0;
        try (FileInputStream fis = new FileInputStream(file)) {
            byte[] buffer = new byte[4096];
            int bytesRead;
            while ((bytesRead = fis.read(buffer)) != -1) {
                for (int i = 0; i < bytesRead; i++) {
                    crc = (crc >>> 8) ^ CRC64_TABLE[(int) ((crc ^ buffer[i]) & 0xff)];
                }
            }
        }
        return crc;
    }

    /**
     * 合并两个 CRC64 值
     * @param crc1 第一个 CRC64 值
     * @param crc2 第二个 CRC64 值
     * @param len2 第二个数据块的长度
     * @return 合并后的 CRC64 值
     */
    public static long combineCRC64(long crc1, long crc2, int len2) {
        long[] delta = new long[8];
        for (int i = 0; i < 8; i++) {
            delta[i] = 1L << (56 - i);
            for (int j = 0; j < 8; j++) {
                if ((delta[i] & (1L << 63)) != 0) {
                    delta[i] = (delta[i] << 1) ^ CRC64_POLY;
                } else {
                    delta[i] <<= 1;
                }
            }
        }

        for (int i = 0; i < len2; i++) {
            for (int j = 0; j < 8; j++) {
                if ((crc1 & (1L << 63)) != 0) {
                    crc1 = (crc1 << 1) ^ CRC64_POLY;
                } else {
                    crc1 <<= 1;
                }
            }
        }

        return crc1 ^ crc2;
    }

    public static void main(String[] args) {
        try {
            // 测试数据
            byte[] data = "Hello, World!".getBytes();

            // 计算数据的 CRC64 值
            long dataCRC = calculateCRC64(data);
            System.out.printf("数据的 CRC64 值为: %016x\n", dataCRC);

            // 计算文件的 CRC64 值
            File file = new File("image.png");
            long fileCRC = calculateFileCRC64(file);
            System.out.printf("文件的 CRC64 值为: %016x\n", fileCRC);

            // 模拟两个 CRC64 值合并
            long combinedCRC = combineCRC64(fileCRC, dataCRC, data.length);
            System.out.printf("合并后的 CRC64 值为: %016x\n", combinedCRC);
        } catch (IOException e) {
            System.err.println("文件读取错误: " + e.getMessage());
        }
    }
}
    