<?php
// CRC64 参数
define('CRC64_POLY', gmp_init('0xC96C5795D7870F42', 16));
define('XOR_OUT', gmp_init('0xFFFFFFFFFFFFFFFF', 16));
define('INIT', gmp_init('0xFFFFFFFFFFFFFFFF', 16));
define('GF2_DIM', 64);

// 生成 CRC64 表 (使用 GMP)
$crc64_table = array();
for ($i = 0; $i < 256; $i++) {
    $crc = gmp_init($i);
    for ($j = 0; $j < 8; $j++) {
        $lsb = gmp_and($crc, 1);
        $crc = gmp_div($crc, 2); // 等价于右移1位
        if (gmp_cmp($lsb, 0) != 0) {
            $crc = gmp_xor($crc, CRC64_POLY);
        }
    }
    $crc64_table[$i] = $crc;
}

// 文件 CRC64 计算
function file_crc64($path) {
    global $crc64_table;
    try {
        $file = fopen($path, 'rb');
        if (!$file) throw new Exception("File not found");

        $crc = INIT;
        while (!feof($file)) {
            $chunk = fread($file, 4096);
            for ($i = 0; $i < strlen($chunk); $i++) {
                $byte = ord($chunk[$i]);
                $idx = gmp_intval(gmp_xor($crc, $byte)) & 0xFF;
                $crc = gmp_xor(
                    gmp_div($crc, 256), // 等价于右移8位
                    $crc64_table[$idx]
                );
            }
        }
        fclose($file);
        $result = gmp_xor($crc, XOR_OUT);
        return array(gmp_strval($result, 10), null);
    } catch (Exception $e) {
        return array(0, $e->getMessage());
    }
}

// 数据 CRC64 计算
function data_crc64($data) {
    global $crc64_table;
    $crc = INIT;
    for ($i = 0; $i < strlen($data); $i++) {
        $byte = ord($data[$i]);
        $idx = gmp_intval(gmp_xor($crc, $byte)) & 0xFF;
        $crc = gmp_xor(gmp_div($crc, 256), $crc64_table[$idx]);
    }
    return gmp_strval(gmp_xor($crc, XOR_OUT), 10);
}

// 合并 CRC 值 (使用 GMP)
function combine_crc64($crc1, $crc2, $len2) {
    $crc1 = gmp_init($crc1);
    $crc2 = gmp_init($crc2);

    $crc1 = gmp_xor($crc1, gmp_xor(INIT, XOR_OUT));
    $crc2 = gmp_xor($crc2, XOR_OUT);

    $even = array_fill(0, GF2_DIM, gmp_init(0));
    $odd = array_fill(0, GF2_DIM, gmp_init(0));
    $odd[0] = CRC64_POLY;
    $row = gmp_init(1);
    for ($n = 1; $n < GF2_DIM; $n++) {
        $odd[$n] = $row;
        $row = gmp_mul($row, 2);
    }

    gf2_matrix_square($even, $odd);
    gf2_matrix_square($odd, $even);

    while (true) {
        gf2_matrix_square($even, $odd);
        if ($len2 & 1) {
            $crc1 = gf2_matrix_times($even, $crc1);
        }
        $len2 >>= 1;
        if ($len2 == 0) break;

        gf2_matrix_square($odd, $even);
        if ($len2 & 1) {
            $crc1 = gf2_matrix_times($odd, $crc1);
        }
        $len2 >>= 1;
        if ($len2 == 0) break;
    }

    $result = gmp_xor(gmp_xor($crc1, $crc2), XOR_OUT);
    return gmp_strval($result, 10);
}

// GMP 矩阵运算函数
function gf2_matrix_times($mat, $vec) {
    $sum = gmp_init(0);
    $idx = 0;
    $tmp = $vec;
    while (gmp_cmp($tmp, 0) != 0) {
        if (gmp_cmp(gmp_and($tmp, 1), 0) != 0) {
            $sum = gmp_xor($sum, $mat[$idx]);
        }
        $tmp = gmp_div($tmp, 2);
        $idx++;
    }
    return $sum;
}

function gf2_matrix_square(&$square, $mat) {
    for ($n = 0; $n < GF2_DIM; $n++) {
        $square[$n] = gf2_matrix_times($mat, $mat[$n]);
    }
}

/****************** 测试用例 ******************/
// 测试文件计算
$file_result = file_crc64("image.png");
echo "文件 CRC: " . $file_result[0] . PHP_EOL;

// 标准测试数据
$data_crc = data_crc64("123456789");
echo "数据 CRC: " . $data_crc . PHP_EOL;

// 合并测试
$crc1 = data_crc64("123456");
$crc2 = data_crc64("789");
$combined = combine_crc64($crc1, $crc2, 3);
echo "合并结果: " . $combined . PHP_EOL;
?>