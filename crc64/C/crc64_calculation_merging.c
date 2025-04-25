#include <stdio.h>
#include <stdint.h>
#include <stdlib.h>
#include <string.h>

// CRC64 参数 (ECMA-182)
#define CRC64_POLY 0xC96C5795D7870F42ULL
#define CRC64_INIT 0xFFFFFFFFFFFFFFFFULL
#define CRC64_XOR_OUT 0xFFFFFFFFFFFFFFFFULL
#define GF2_DIM 64

// 预计算表
static uint64_t crc_table[256];

// CRC 计算上下文
typedef struct {
    uint64_t crc;
} CRC64_CTX;

// 生成预计算表
static void generate_table() {
    for (int i = 0; i < 256; i++) {
        uint64_t crc = i;
        for (int j = 0; j < 8; j++) {
            if (crc & 1)
                crc = (crc >> 1) ^ CRC64_POLY;
            else
                crc >>= 1;
        }
        crc_table[i] = crc;
    }
}

// 初始化上下文
void crc64_init(CRC64_CTX *ctx) {
    ctx->crc = CRC64_INIT;
    // 确保表只生成一次
    static int table_generated = 0;
    if (!table_generated) {
        generate_table();
        table_generated = 1;
    }
}

// 更新数据块
void crc64_update(CRC64_CTX *ctx, const void *data, size_t len) {
    const uint8_t *bytes = (const uint8_t *)data;
    for (size_t i = 0; i < len; i++) {
        uint8_t idx = (ctx->crc ^ bytes[i]) & 0xFF;
        ctx->crc = (ctx->crc >> 8) ^ crc_table[idx];
    }
}

// 获取最终结果
uint64_t crc64_final(CRC64_CTX *ctx) {
    return ctx->crc ^ CRC64_XOR_OUT;
}

// GF(2) 矩阵运算
static uint64_t gf2_matrix_times(uint64_t *mat, uint64_t vec) {
    uint64_t sum = 0;
    int idx = 0;
    while (vec) {
        if (vec & 1)
            sum ^= mat[idx];
        vec >>= 1;
        idx++;
    }
    return sum;
}

static void gf2_matrix_square(uint64_t *square, uint64_t *mat) {
    for (int n = 0; n < GF2_DIM; n++)
        square[n] = gf2_matrix_times(mat, mat[n]);
}

// 合并两个 CRC 值
uint64_t crc64_combine(uint64_t crc1, uint64_t crc2, uint64_t len2) {
    if (len2 == 0) return crc1;

    // 调整初始状态
    crc1 ^= (CRC64_INIT ^ CRC64_XOR_OUT);

    // 初始化 GF(2) 矩阵
    uint64_t even[GF2_DIM] = {0};
    uint64_t odd[GF2_DIM] = {0};

    // 构建反转多项式矩阵
    odd[0] = CRC64_POLY;
    uint64_t row = 1;
    for (int n = 1; n < GF2_DIM; n++) {
        odd[n] = row;
        row <<= 1;
    }

    // 矩阵平方运算
    gf2_matrix_square(even, odd);
    gf2_matrix_square(odd, even);

    // 合并运算
    while (1) {
        gf2_matrix_square(even, odd);
        if (len2 & 1)
            crc1 = gf2_matrix_times(even, crc1);
        len2 >>= 1;
        if (len2 == 0) break;

        gf2_matrix_square(odd, even);
        if (len2 & 1)
            crc1 = gf2_matrix_times(odd, crc1);
        len2 >>= 1;
        if (len2 == 0) break;
    }

    return crc1 ^ crc2;
}

// 文件校验函数
uint64_t file_crc(const char *path) {
    FILE *file = fopen(path, "rb");
    if (!file) {
        fprintf(stderr, "文件打开失败: %s\n", path);
        exit(EXIT_FAILURE);
    }

    CRC64_CTX ctx;
    crc64_init(&ctx);

    uint8_t buffer[4096];
    size_t bytes_read;
    while ((bytes_read = fread(buffer, 1, sizeof(buffer), file)) > 0) {
        crc64_update(&ctx, buffer, bytes_read);
    }

    fclose(file);
    return crc64_final(&ctx);
}

int main() {
    // 测试用例
    CRC64_CTX ctx;

    // 测试字符串 "123456789"
    crc64_init(&ctx);
    const char *test_str1 = "123456789";
    crc64_update(&ctx, test_str1, strlen(test_str1));
    printf("123456789: %llu\n", (unsigned long long)crc64_final(&ctx));

    // 测试中文
    crc64_init(&ctx);
    const char *test_str = "中文";
    crc64_update(&ctx, test_str, strlen(test_str));
    printf("中文: %llu\n", (unsigned long long)crc64_final(&ctx));

    // 流式处理测试
    crc64_init(&ctx);
    crc64_update(&ctx, "123456", 6);
    crc64_update(&ctx, "789", 3);
    printf("流式校验123456789: %llu\n", (unsigned long long)crc64_final(&ctx));

    // 文件校验测试
    const char *filename = "image.png";
    printf("文件校验 %s: %llu\n", filename, (unsigned long long)file_crc(filename));

    // 合并测试
    CRC64_CTX part1, part2;
    crc64_init(&part1);
    crc64_update(&part1, "123456", 6);
    uint64_t crc1 = crc64_final(&part1);

    crc64_init(&part2);
    crc64_update(&part2, "789", 3);
    uint64_t crc2 = crc64_final(&part2);

    uint64_t combined = crc64_combine(crc1, crc2, 3);
    printf("合并结果: %llu\n", (unsigned long long)combined);

    return 0;
}
