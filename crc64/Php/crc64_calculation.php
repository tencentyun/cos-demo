<?php
// 定义 ECMA 多项式
define('CRC64_POLY', gmp_init('c96c5795d7870f42', 16));

// 生成 CRC64 表
function generate_crc64_table() {
    $crc64_table = [];
    for ($i = 0; $i < 256; $i++) {
        $crc = gmp_init($i);
        for ($j = 0; $j < 8; $j++) {
            if (gmp_testbit($crc, 0)) {
                $crc = gmp_xor(gmp_div_q($crc, 2), CRC64_POLY);
            } else {
                $crc = gmp_div_q($crc, 2);
            }
        }
        $crc64_table[$i] = $crc;
    }
    return $crc64_table;
}

// 计算字节数据的 CRC64 值
function calculate_crc64($data, $crc64_table) {
    $crc = gmp_init(0);
    $length = strlen($data);
    for ($i = 0; $i < $length; $i++) {
        $crc = gmp_xor(gmp_div_q($crc, 256), $crc64_table[gmp_intval(gmp_xor($crc, gmp_init(ord($data[$i])))) & 0xff]);
    }
    return $crc;
}

// 计算文件的 CRC64 值
function calculate_file_crc64($file_path, $crc64_table) {
    if (!file_exists($file_path)) {
        return null;
    }
    $crc = gmp_init(0);
    $handle = fopen($file_path, 'rb');
    if ($handle) {
        $file_size = filesize($file_path);
        $total_read = 0;
        while ($total_read < $file_size) {
            $buffer = fread($handle, min(4096, $file_size - $total_read));
            if ($buffer === false) {
                break;
            }
            $crc = calculate_crc64_chunk($buffer, $crc64_table, $crc);
            $total_read += strlen($buffer);
        }
        fclose($handle);
    }
    return $crc;
}

// 新增一个函数，用于基于已有的 CRC64 值继续计算
function calculate_crc64_chunk($data, $crc64_table, $initial_crc) {
    $crc = $initial_crc;
    $length = strlen($data);
    for ($i = 0; $i < $length; $i++) {
        $crc = gmp_xor(gmp_div_q($crc, 256), $crc64_table[gmp_intval(gmp_xor($crc, gmp_init(ord($data[$i])))) & 0xff]);
    }
    return $crc;
}

// 合并两个 CRC64 值
function combine_crc64($crc1, $crc2, $len2) {
    $delta = [];
    for ($i = 0; $i < 8; $i++) {
        $delta[$i] = gmp_pow(2, 56 - $i);
        for ($j = 0; $j < 8; $j++) {
            if (gmp_testbit($delta[$i], 63)) {
                $delta[$i] = gmp_xor(gmp_mul($delta[$i], 2), CRC64_POLY);
            } else {
                $delta[$i] = gmp_mul($delta[$i], 2);
            }
        }
    }

    for ($i = 0; $i < $len2; $i++) {
        for ($j = 0; $j < 8; $j++) {
            if (gmp_testbit($crc1, 63)) {
                $crc1 = gmp_xor(gmp_mul($crc1, 2), CRC64_POLY);
            } else {
                $crc1 = gmp_mul($crc1, 2);
            }
        }
    }

    return gmp_xor($crc1, $crc2);
}

// 主程序
$crc64_table = generate_crc64_table();

// 计算字节数据的 CRC64 值
$data = "Hello, World!";
$data_crc = calculate_crc64($data, $crc64_table);
echo "数据的 CRC64 值为: ". gmp_strval($data_crc, 16). "\n";

// 计算文件的 CRC64 值
$file_path = '/Users/garenwang/PhpstormProjects/crc64demo/image.png';
$file_crc = calculate_file_crc64($file_path, $crc64_table);
if ($file_crc!== null) {
    echo "文件的 CRC64 值为: ". gmp_strval($file_crc, 16). "\n";
} else {
    echo "文件 $file_path 不存在。\n";
}

// 合并两个 CRC64 值
$combined_crc = combine_crc64($file_crc,$data_crc, strlen($data));
echo "合并后的 CRC64 值为: ". gmp_strval($combined_crc, 16). "\n";
?>