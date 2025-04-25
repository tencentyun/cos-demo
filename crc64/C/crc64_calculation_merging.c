#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <string.h>

// 定义 CRC64 多项式
#define CRC64_POLY 0xc96c5795d7870f42

// 生成 CRC64 表
uint64_t crc64_table[256];

void generate_crc64_table() {
    for (int i = 0; i < 256; i++) {
        uint64_t crc = (uint64_t)i;
        for (int j = 0; j < 8; j++) {
            if (crc & 1) {
                crc = (crc >> 1) ^ CRC64_POLY;
            } else {
                crc >>= 1;
            }
        }
        crc64_table[i] = crc;
    }
}

// 计算数据的 CRC64 值
uint64_t data_crc64(const uint8_t *data, size_t length) {
    uint64_t crc = 0;
    for (size_t i = 0; i < length; i++) {
        crc = (crc >> 8) ^ crc64_table[(crc ^ data[i]) & 0xff];
    }
    return crc;
}

// 计算文件的 CRC64 值
uint64_t file_crc64(const char *path) {
    FILE *file = fopen(path, "rb");
    if (file == NULL) {
        return 0;
    }

    uint64_t crc = 0;
    uint8_t buffer[4096];
    size_t bytes_read;

    while ((bytes_read = fread(buffer, 1, sizeof(buffer), file)) > 0) {
        crc = data_crc64(buffer, bytes_read) ^ (crc << 8);
    }

    fclose(file);
    return crc;
}

// 合并两个 CRC64 值
uint64_t combine_crc64(uint64_t crc1, uint64_t crc2, size_t len2) {
    uint64_t delta[8];
    for (int i = 0; i < 8; i++) {
        delta[i] = 1ULL << (56 - i);
        for (int j = 0; j < 8; j++) {
            if (delta[i] & (1ULL << 63)) {
                delta[i] = (delta[i] << 1) ^ CRC64_POLY;
            } else {
                delta[i] = delta[i] << 1;
            }
        }
    }

    for (size_t i = 0; i < len2; i++) {
        for (int j = 0; j < 8; j++) {
            if (crc1 & (1ULL << 63)) {
                crc1 = (crc1 << 1) ^ CRC64_POLY;
            } else {
                crc1 = crc1 << 1;
            }
        }
    }

    return crc1 ^ crc2;
}

int main() {
    // 生成 CRC64 表
    generate_crc64_table();

    // 计算文件的 CRC64 值
    const char *file_path = "image.png";
    uint64_t file_crc = file_crc64(file_path);
    printf("文件 %s 的 CRC64 值为: %016lx\n", file_path, file_crc);

    // 计算字节数据的 CRC64 值
    const uint8_t data[] = "Hello, World!";
    size_t data_length = strlen((const char *)data);
    uint64_t data_crc = data_crc64(data, data_length);
    printf("数据 %s 的 CRC64 值为: %016lx\n", data, data_crc);

    // 合并两个 CRC64 值
    uint64_t combined_crc = combine_crc64(file_crc, data_crc, data_length);
    printf("合并后的 CRC64 值为: %016lx\n", combined_crc);

    return 0;
}
