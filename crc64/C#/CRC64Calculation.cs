using System;
using System.IO;
using System.Text;

namespace CRC64Calculation
{
    public class CRC64Calculator
    {
        // CRC64 参数 (ECMA-182)
        private const ulong Poly = 0xC96C5795D7870F42UL;
        private const ulong Init = 0xFFFFFFFFFFFFFFFFUL;
        private const ulong XorOut = 0xFFFFFFFFFFFFFFFFUL;
        private const int GF2Dim = 64;

        // 预计算表
        private static readonly ulong[] Table = new ulong[256];

        // 静态构造函数初始化表
        static CRC64Calculator()
        {
            for (int i = 0; i < 256; i++)
            {
                ulong crc = (ulong)i;
                for (int j = 0; j < 8; j++)
                {
                    if ((crc & 1) == 1)
                        crc = (crc >> 1) ^ Poly;
                    else
                        crc >>= 1;
                }

                Table[i] = crc;
            }
        }

        private ulong _crc;

        public CRC64Calculator()
        {
            Reset();
        }

        public void Reset()
        {
            _crc = Init;
        }

        public void Update(byte[] data)
        {
            Update(data, 0, data.Length);
        }

        public void Update(byte[] data, int offset, int length)
        {
            for (int i = offset; i < offset + length; i++)
            {
                _crc = Table[(_crc ^ data[i]) & 0xFF] ^ (_crc >> 8);
            }
        }

        public ulong Final()
        {
            return _crc ^ XorOut;
        }

        public static ulong Combine(ulong crc1, ulong crc2, ulong len2)
        {
            if (len2 == 0)
                return crc1;

            // 调整初始状态
            crc1 ^= (Init ^ XorOut);

            // 初始化 GF(2) 矩阵
            ulong[] even = new ulong[GF2Dim];
            ulong[] odd = new ulong[GF2Dim];

            // 构建反转多项式矩阵
            odd[0] = Poly;
            ulong row = 1;
            for (int n = 1; n < GF2Dim; n++)
            {
                odd[n] = row;
                row <<= 1;
            }

            // 矩阵平方运算
            GF2MatrixSquare(even, odd);
            GF2MatrixSquare(odd, even);

            // 合并运算
            while (true)
            {
                GF2MatrixSquare(even, odd);
                if ((len2 & 1) == 1)
                    crc1 = GF2MatrixTimes(even, crc1);
                len2 >>= 1;
                if (len2 == 0) break;

                GF2MatrixSquare(odd, even);
                if ((len2 & 1) == 1)
                    crc1 = GF2MatrixTimes(odd, crc1);
                len2 >>= 1;
                if (len2 == 0) break;
            }

            return crc1 ^ crc2;
        }

        private static ulong GF2MatrixTimes(ulong[] mat, ulong vec)
        {
            ulong sum = 0;
            int index = 0;
            while (vec != 0)
            {
                if ((vec & 1) == 1)
                    sum ^= mat[index];
                vec >>= 1;
                index++;
            }

            return sum;
        }

        private static void GF2MatrixSquare(ulong[] square, ulong[] mat)
        {
            for (int n = 0; n < GF2Dim; n++)
            {
                square[n] = GF2MatrixTimes(mat, mat[n]);
            }
        }

        // 文件校验方法
        public static ulong ComputeFile(string path)
        {
            using (FileStream stream = File.OpenRead(path))
            {
                CRC64Calculator crc = new CRC64Calculator();
                byte[] buffer = new byte[4096];
                int bytesRead;
                while ((bytesRead = stream.Read(buffer, 0, buffer.Length)) > 0)
                {
                    crc.Update(buffer, 0, bytesRead);
                }

                return crc.Final();
            }
        }
    }

    class Program
    {
        static void Main()
        {
            // 标准测试
            TestString("123456789", 11051210869376104954);
            TestString("中文", 16371802884590399230); // 需要实际测试值

            // 流式处理测试
            TestStream();

            // 文件校验测试
            TestFile("/Users/garenwang/RiderProjects/ConsoleApp2/ConsoleApp2/image.png");

            // 合并测试
            TestCombine();
        }

        static void TestString(string data, ulong expected)
        {
            CRC64Calculator crc = new CRC64Calculator();
            byte[] bytes = Encoding.UTF8.GetBytes(data);
            crc.Update(bytes);
            ulong result = crc.Final();
            Console.WriteLine($"{data}: {result} ({(result == expected ? "通过" : "失败")})");
        }

        static void TestStream()
        {
            CRC64Calculator crc = new CRC64Calculator();
            crc.Update(Encoding.ASCII.GetBytes("123456"));
            crc.Update(Encoding.ASCII.GetBytes("789"));
            ulong result = crc.Final();
            Console.WriteLine($"流式校验: {result}");
        }

        static void TestFile(string path)
        {
            try
            {
                ulong crc = CRC64Calculator.ComputeFile(path);
                Console.WriteLine($"文件 {path} 的 CRC64: {crc}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"文件校验失败: {ex.Message}");
            }
        }

        static void TestCombine()
        {
            CRC64Calculator crc1 = new CRC64Calculator();
            crc1.Update(Encoding.ASCII.GetBytes("123456"));
            ulong sum1 = crc1.Final();

            CRC64Calculator crc2 = new CRC64Calculator();
            crc2.Update(Encoding.ASCII.GetBytes("789"));
            ulong sum2 = crc2.Final();

            ulong combined = CRC64Calculator.Combine(sum1, sum2, 3);
            Console.WriteLine($"合并结果: {combined}");
        }
    }
}