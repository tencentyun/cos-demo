#include <iostream>
#include <fstream>
#include <cstdint>
#include <vector>
#include <string>
#include <array>  // 添加必要的头文件

class CRC64 {
public:
    // 使用正确的类型定义
    static const uint64_t POLY = 0xc96c5795d7870f42ULL;
    static const uint64_t INIT = 0xFFFFFFFFFFFFFFFFULL;
    static const uint64_t XOR_OUT = 0xFFFFFFFFFFFFFFFFULL;

private:
    // 预计算表
    static const std::array<uint64_t, 256> crc_table;

    // 生成预计算表 (C++11 兼容)
    static std::array<uint64_t, 256> generate_table() {
        std::array<uint64_t, 256> table = {{0}};
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
    CRC64() : crc(INIT) {}

    void update(const void* data, size_t length) {
        const uint8_t* bytes = static_cast<const uint8_t*>(data);
        for (size_t i = 0; i < length; ++i) {
            uint8_t index = (crc ^ bytes[i]) & 0xFF;
            crc = (crc >> 8) ^ crc_table[index];
        }
    }

    uint64_t finalize() const {
        return crc ^ XOR_OUT;
    }

    static uint64_t combine(uint64_t crc1, uint64_t crc2, uint64_t len2) {
        const uint64_t poly = POLY;
        crc1 ^= XOR_OUT;
        for (uint64_t i = 0; i < len2 * 8; ++i) {
            bool carry = crc1 & 0x8000000000000000ULL;
            crc1 = (crc1 << 1) ^ (carry ? poly : 0);
        }
        return (crc1 ^ crc2) ^ XOR_OUT;
    }
};

// 类外初始化静态成员
const std::array<uint64_t, 256> CRC64::crc_table = CRC64::generate_table();

// 实用函数：计算文件的 CRC64
uint64_t file_crc64(const std::string& filename) {
    std::ifstream file(filename, std::ios::binary);
    if (!file) {
        throw std::runtime_error("无法打开文件: " + filename);
    }

    CRC64 crc;
    char buffer[4096];
    while (file.read(buffer, sizeof(buffer))) {
        crc.update(buffer, file.gcount());
    }
    crc.update(buffer, file.gcount()); // 处理最后一块

    return crc.finalize();
}

int main() {
    // 示例 1：字符串计算
    const char* test_str = "Hello, World!";
    CRC64 crc1;
    crc1.update(test_str, strlen(test_str));
    std::cout << "字符串 CRC64: " << std::hex << crc1.finalize() << std::endl;
    // 输出: c99465aa178b6931

    // 示例 2：流式处理
    CRC64 crc2;
    crc2.update("hello ", 6);
    crc2.update("world", 5);
    std::cout << "流式 CRC64: " << std::hex << crc2.finalize() << std::endl;

    // 示例 3：文件计算
    try {
        std::cout << "文件 CRC64: " << file_crc64("image.png") << std::endl;
    } catch (const std::exception& e) {
        std::cerr << e.what() << std::endl;
    }

    // 示例 4：合并 CRC 值
    CRC64 part1, part2;
    part1.update("hello ", 6);
    part2.update("world", 5);
    uint64_t combined = CRC64::combine(
            part1.finalize(),
            part2.finalize(),
            5 // 第二个数据块长度
    );
    std::cout << "合并 CRC64: " << std::hex << combined << std::endl;

    return 0;
}