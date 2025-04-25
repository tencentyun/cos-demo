# 定义新的多项式
CRC64_POLY = 0xc96c5795d7870f42
XOR_OUT = 0xFFFFFFFFFFFFFFFF
INIT = 0xFFFFFFFFFFFFFFFF
GF2_DIM = 64
# 生成 CRC64 表
crc64_table = [0] * 256
for i in range(256):
    crc = i
    for _ in range(8):
        if crc & 1:
            crc = (crc >> 1) ^ CRC64_POLY
        else:
            crc >>= 1
    crc64_table[i] = crc


def file_crc64(path):
    """
    计算文件的 CRC64 值
    :param path: 文件路径
    :return: CRC64 值和可能的错误信息
    """
    try:
        with open(path, 'rb') as file:
            crc = INIT
            while True:
                chunk = file.read(4096)
                if not chunk:
                    break
                for byte in chunk:
                    crc = (crc >> 8) ^ crc64_table[(crc ^ byte) & 0xff]
            return crc ^ XOR_OUT, None
    except FileNotFoundError as e:
        return 0, e


def data_crc64(data):
    """
    计算字节数据的 CRC64 值
    :param data: 字节数据
    :return: CRC64 值
    """
    crc = INIT
    for byte in data:
        crc = (crc >> 8) ^ crc64_table[(crc ^ byte) & 0xff]
    return crc ^ XOR_OUT


def stream_crc64(r):
    """
    流式计算 CRC64 值
    :param r: 可迭代的字节流对象
    :return: CRC64 值和可能的错误信息
    """
    crc = INIT
    try:
        while True:
            chunk = r.read(4096)
            if not chunk:
                break
            for byte in chunk:
                crc = (crc >> 8) ^ crc64_table[(crc ^ byte) & 0xff]
        return crc, None
    except Exception as e:
        return 0, e


def gf2_matrix_square(square, mat):
    for n in range(GF2_DIM):
        square[n] = gf2_matrix_times(mat, mat[n])


def gf2_matrix_times(mat, vec):
    summary = 0
    mat_index = 0

    while vec:
        if vec & 1:
            summary ^= mat[mat_index]

        vec >>= 1
        mat_index += 1

    return summary


def combine_crc64(crc1, crc2, len2):
    if len2 == 0:
        return crc1

    # 调整初始状态
    crc1 ^= (0xFFFFFFFFFFFFFFFF ^ 0xFFFFFFFFFFFFFFFF)

    # 初始化 GF(2) 矩阵
    even = [0] * 64
    odd = [0] * 64

    # 构建反转多项式矩阵
    odd[0] = CRC64_POLY
    row = 1
    for n in range(1, 64):
        odd[n] = row
        row <<= 1

    # 矩阵平方运算
    gf2_matrix_square(even, odd)
    gf2_matrix_square(odd, even)

    # 合并运算
    while True:
        gf2_matrix_square(even, odd)
        if len2 & 1:
            crc1 = gf2_matrix_times(even.copy(), crc1)
        len2 >>= 1
        if len2 == 0:
            break

        gf2_matrix_square(odd, even)
        if len2 & 1:
            crc1 = gf2_matrix_times(odd.copy(), crc1)
        len2 >>= 1
        if len2 == 0:
            break

    return crc1 ^ crc2


if __name__ == "__main__":
    # 测试文件 CRC64 计算
    file_path = "image.png"
    file_crc, err = file_crc64(file_path)
    if err:
        print(f"计算文件 CRC64 时出错: {err}")
    else:
        print(f"文件 {file_path} 的 CRC64 值为: {int(file_crc)}")

    # 测试字节数据 CRC64 计算
    data = b"123456789"
    data_crc = data_crc64(data)
    print(f"数据 {data} 的 CRC64 值为: {int(data_crc)}")

    # 测试 CRC64 值合并
    data1 = b"123456"
    data_crc1 = data_crc64(data1)
    data2 = b"789"
    data_crc2 = data_crc64(data2)
    if not err:
        combined_crc = combine_crc64(data_crc1, data_crc2, len(data2))
        print(f"合并后的 CRC64 值为: {int(combined_crc)}")