# 定义新的多项式
CRC64_POLY = 0xc96c5795d7870f42

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
            crc = 0
            while True:
                chunk = file.read(4096)
                if not chunk:
                    break
                for byte in chunk:
                    crc = (crc >> 8) ^ crc64_table[(crc ^ byte) & 0xff]
            return crc, None
    except FileNotFoundError as e:
        return 0, e


def data_crc64(data):
    """
    计算字节数据的 CRC64 值
    :param data: 字节数据
    :return: CRC64 值
    """
    crc = 0
    for byte in data:
        crc = (crc >> 8) ^ crc64_table[(crc ^ byte) & 0xff]
    return crc


def stream_crc64(r):
    """
    流式计算 CRC64 值
    :param r: 可迭代的字节流对象
    :return: CRC64 值和可能的错误信息
    """
    crc = 0
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

def combine_crc64(crc1, crc2, len2):
    """
    合并两个 CRC64 值
    :param crc1: 第一个 CRC64 值
    :param crc2: 第二个 CRC64 值
    :param len2: 第二个数据块的长度
    :return: 合并后的 CRC64 值
    """
    delta = [0] * 8
    for i in range(8):
        delta[i] = 1 << (56 - i)
        for _ in range(8):
            if delta[i] & (1 << 63):
                delta[i] = (delta[i] << 1) ^ CRC64_POLY
            else:
                delta[i] = delta[i] << 1

    for _ in range(len2):
        for _ in range(8):
            if crc1 & (1 << 63):
                crc1 = (crc1 << 1) ^ CRC64_POLY
            else:
                crc1 = crc1 << 1

    return crc1 ^ crc2


if __name__ == "__main__":
    # 测试文件 CRC64 计算
    file_path = "image.png"
    file_crc, err = file_crc64(file_path)
    if err:
        print(f"计算文件 CRC64 时出错: {err}")
    else:
        print(f"文件 {file_path} 的 CRC64 值为: {hex(file_crc)}")

    # 测试字节数据 CRC64 计算
    data = b"Hello, World!"
    data_crc = data_crc64(data)
    print(f"数据 {data} 的 CRC64 值为: {hex(data_crc)}")

    # 测试 CRC64 值合并
    if not err:
        combined_crc = combine_crc64(file_crc, data_crc, len(data))
        print(f"合并后的 CRC64 值为: {hex(combined_crc)}")
