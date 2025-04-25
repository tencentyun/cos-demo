#include <iostream>
#include <fstream>
#include <cstdint>
#include <array>

class CRC64_ECMA {
public:
    // ECMA-182 标准参数
    static const uint64_t POLY = 0xC96C5795D7870F42ULL;
    static const uint64_t INIT = 0xFFFFFFFFFFFFFFFFULL;
    static const uint64_t XOR_OUT = 0xFFFFFFFFFFFFFFFFULL;
    static const int GF2_DIM = 64;
private:
    // 预计算表 (256 entries)
    static const std::array<uint64_t, 256> crc_table_;

    // 生成预计算表
    static std::array<uint64_t, 256> generate_table() {
        std::array<uint64_t, 256> table = {0};
        for (uint32_t i = 0; i < 256; ++i) {
            uint64_t crc = i;
            for (int j = 0; j < 8; ++j) {
                if (crc & 1) {
                    crc = (crc >> 1) ^ POLY;
                } else {
                    crc >>= 1;
                }
            }
            table[i] = crc;
        }
        return table;
    }

    uint64_t crc;

public:
    CRC64_ECMA() : crc(INIT) {}

    // 更新数据块
    void update(const void* data, size_t len) {
        const uint8_t* bytes = static_cast<const uint8_t*>(data);
        for (size_t i = 0; i < len; ++i) {
            uint8_t index = (crc ^ bytes[i]) & 0xFF;
            crc = (crc >> 8) ^ crc_table_[index];
        }
    }

    // 获取最终结果
    uint64_t finalize() const {
        return crc ^ XOR_OUT;
    }

    static uint64_t gf2_matrix_times(uint64_t *mat, uint64_t vec)
    {
        uint64_t sum;
        sum = 0;
        while (vec) {
            if (vec & 1)
                sum ^= *mat;
            vec >>= 1;
            mat++;
        }
        return sum;
    }

    static void gf2_matrix_square(uint64_t *square, uint64_t *mat)
    {
        unsigned n;
        for (n = 0; n < GF2_DIM; n++)
            square[n] = gf2_matrix_times(mat, mat[n]);
    }
    // 合并两个 CRC 值
    static uint64_t combine(uint64_t crc1, uint64_t crc2, uint64_t len2) {
        if (len2 == 0) return crc1;

        // 调整初始状态
        crc1 ^= (INIT ^ XOR_OUT);

        // 初始化 GF(2) 矩阵
        uint64_t even[GF2_DIM] = {0};
        uint64_t odd[GF2_DIM] = {0};

        // 构建反转多项式矩阵
        odd[0] = POLY;
        uint64_t row = 1;
        for (int n = 1; n < GF2_DIM; n++) {
            odd[n] = row;
            row <<= 1;
        }

        // 矩阵平方运算
        gf2_matrix_square(even, odd);
        gf2_matrix_square(odd, even);

        // 合并运算
        while (true) {
            gf2_matrix_square(even, odd);
            if (len2 & 1) {
                crc1 = gf2_matrix_times(even, crc1);
            }
            len2 >>= 1;
            if (len2 == 0) break;

            gf2_matrix_square(odd, even);
            if (len2 & 1) {
                crc1 = gf2_matrix_times(odd, crc1);
            }
            len2 >>= 1;
            if (len2 == 0) break;
        }

        return (crc1 ^ crc2);
    }
};

// 初始化静态表
const std::array<uint64_t, 256> CRC64_ECMA::crc_table_ = CRC64_ECMA::generate_table();

// 文件校验函数
uint64_t file_crc(const char* path) {
    std::ifstream file(path, std::ios::binary);
    if (!file) throw std::runtime_error("文件打开失败");

    CRC64_ECMA crc;
    char buffer[4096];
    while (file.read(buffer, sizeof(buffer))) {
        crc.update(buffer, file.gcount());
    }
    crc.update(buffer, file.gcount()); // 处理最后一块
    return crc.finalize();
}

int main() {
    // 测试用例

    const char* test_str1 = "123456789";
    CRC64_ECMA crc1;
    crc1.update(test_str1, strlen(test_str1));
    std::cout << "123456789: "
              << std::dec << crc1.finalize() << std::endl;

    const char* test_str = "中文";
    CRC64_ECMA crc;
    crc.update(test_str, strlen(test_str));
    std::cout << "中文: "
              << std::dec << crc.finalize() << std::endl;



    // 流式计算
    CRC64_ECMA stream_crc;
    stream_crc.update("123456", 6);
    stream_crc.update("789", 3);
    std::cout << "流式校验123456789: "
              << std::dec << stream_crc.finalize() << std::endl;

    // 文件校验
    try {
        std::cout << "文件校验: "
                  << std::dec << file_crc("image.png") << std::endl;
    } catch (const std::exception& e) {
        std::cerr << e.what() << std::endl;
    }

    // 合并测试
    CRC64_ECMA part1, part2;
    part1.update("123456", 6);
    part2.update("789", 3);
    uint64_t combined = CRC64_ECMA::combine(
            part1.finalize(),
            part2.finalize(),
            3 // 第二个数据块长度
    );
    std::cout << "合并结果: " << std::dec << combined << std::endl;

    return 0;
}