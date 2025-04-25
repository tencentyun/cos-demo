using System;
using System.IO;

namespace CRC64Calculation
{
    public class CRC64Calculator
    {
        // 定义 ECMA 多项式
        private const ulong CRC64_POLY = 0xc96c5795d7870f42L;
        private static readonly ulong[] CRC64_TABLE = new ulong[256];

        static CRC64Calculator()
        {
            // 生成 CRC64 表
            for (ulong i = 0; i < 256; i++)
            {
                ulong crc = i;
                for (int j = 0; j < 8; j++)
                {
                    if ((crc & 1) == 1)
                    {
                        crc = (crc >> 1) ^ CRC64_POLY;
                    }
                    else
                    {
                        crc >>= 1;
                    }
                }
                CRC64_TABLE[i] = crc;
            }
        }

        /// <summary>
        /// 计算字节数组的 CRC64 值
        /// </summary>
        /// <param name="data">字节数组</param>
        /// <returns>CRC64 值</returns>
        public static ulong CalculateCRC64(byte[] data)
        {
            ulong crc = 0;
            foreach (byte b in data)
            {
                crc = (crc >> 8) ^ CRC64_TABLE[(crc ^ b) & 0xff];
            }
            return crc;
        }

        /// <summary>
        /// 计算文件的 CRC64 值
        /// </summary>
        /// <param name="filePath">文件路径</param>
        /// <returns>CRC64 值</returns>
        public static ulong CalculateFileCRC64(string filePath)
        {
            ulong crc = 0;
            try
            {
                using (FileStream fs = new FileStream(filePath, FileMode.Open, FileAccess.Read))
                {
                    byte[] buffer = new byte[4096];
                    int bytesRead;
                    while ((bytesRead = fs.Read(buffer, 0, buffer.Length)) > 0)
                    {
                        for (int i = 0; i < bytesRead; i++)
                        {
                            crc = (crc >> 8) ^ CRC64_TABLE[(crc ^ buffer[i]) & 0xff];
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"文件读取错误: {ex.Message}");
            }
            return crc;
        }

        /// <summary>
        /// 合并两个 CRC64 值
        /// </summary>
        /// <param name="crc1">第一个 CRC64 值</param>
        /// <param name="crc2">第二个 CRC64 值</param>
        /// <param name="len2">第二个数据块的长度</param>
        /// <returns>合并后的 CRC64 值</returns>
        public static ulong CombineCRC64(ulong crc1, ulong crc2, int len2)
        {
            ulong[] delta = new ulong[8];
            for (int i = 0; i < 8; i++)
            {
                delta[i] = 1UL << (56 - i);
                for (int j = 0; j < 8; j++)
                {
                    if ((delta[i] & (1UL << 63)) != 0)
                    {
                        delta[i] = (delta[i] << 1) ^ CRC64_POLY;
                    }
                    else
                    {
                        delta[i] <<= 1;
                    }
                }
            }

            for (int i = 0; i < len2; i++)
            {
                for (int j = 0; j < 8; j++)
                {
                    if ((crc1 & (1UL << 63)) != 0)
                    {
                        crc1 = (crc1 << 1) ^ CRC64_POLY;
                    }
                    else
                    {
                        crc1 <<= 1;
                    }
                }
            }

            return crc1 ^ crc2;
        }
    }

    class CRC64Calculation
    {
        static void Main()
        {
            // 测试数据
            byte[] data = System.Text.Encoding.UTF8.GetBytes("Hello, World!");

            // 计算数据的 CRC64 值
            ulong dataCRC = CRC64Calculator.CalculateCRC64(data);
            Console.WriteLine($"数据的 CRC64 值为: {dataCRC:X16}");

            // 计算文件的 CRC64 值
            string filePath = "/Users/garenwang/RiderProjects/ConsoleApp2/ConsoleApp2/image.png";
            ulong fileCRC = CRC64Calculator.CalculateFileCRC64(filePath);
            Console.WriteLine($"文件的 CRC64 值为: {fileCRC:X16}");

            // 合并两个 CRC64 值
            ulong combinedCRC = CRC64Calculator.CombineCRC64(dataCRC, fileCRC, data.Length);
            Console.WriteLine($"合并后的 CRC64 值为: {combinedCRC:X16}");
        }
    }
}    