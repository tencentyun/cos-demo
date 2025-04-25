package main

import (
	"fmt"
	"hash"
	"io"
	"os"
)

// CRC64 参数 (ECMA-182)
const (
	CRC64Poly   = 0xC96C5795D7870F42
	CRC64Init   = 0xFFFFFFFFFFFFFFFF
	CRC64XorOut = 0xFFFFFFFFFFFFFFFF
	GF2Dim      = 64
)

var crcTable = generateTable()

type CRC64 struct {
	sum uint64
}

// 生成预计算表
func generateTable() [256]uint64 {
	var table [256]uint64
	for i := 0; i < 256; i++ {
		crc := uint64(i)
		for j := 0; j < 8; j++ {
			if crc&1 == 1 {
				crc = (crc >> 1) ^ CRC64Poly
			} else {
				crc >>= 1
			}
		}
		table[i] = crc
	}
	return table
}

// 创建新的 CRC64 计算器
func NewCRC64() hash.Hash64 {
	return &CRC64{sum: CRC64Init}
}

func (c *CRC64) Write(p []byte) (n int, err error) {
	c.Update(p)
	return len(p), nil
}

func (c *CRC64) Sum(b []byte) []byte {
	s := c.Sum64()
	return append(b, byte(s>>56), byte(s>>48), byte(s>>40), byte(s>>32),
		byte(s>>24), byte(s>>16), byte(s>>8), byte(s))
}

func (c *CRC64) Reset() {
	c.sum = CRC64Init
}

func (c *CRC64) Size() int {
	return 8
}

func (c *CRC64) BlockSize() int {
	return 1
}

func (c *CRC64) Sum64() uint64 {
	return c.sum ^ CRC64XorOut
}

func (c *CRC64) Update(p []byte) {
	for _, b := range p {
		index := (c.sum ^ uint64(b)) & 0xFF
		c.sum = (c.sum >> 8) ^ crcTable[index]
	}
}

// 合并两个 CRC 值
func CombineCRC64(crc1, crc2 uint64, len2 uint64) uint64 {
	if len2 == 0 {
		return crc1
	}

	// 调整初始状态
	crc1 ^= CRC64Init ^ CRC64XorOut

	// 初始化 GF(2) 矩阵
	var even, odd [GF2Dim]uint64

	// 构建反转多项式矩阵
	odd[0] = CRC64Poly
	row := uint64(1)
	for n := 1; n < GF2Dim; n++ {
		odd[n] = row
		row <<= 1
	}

	gf2MatrixSquare(even[:], odd[:])
	gf2MatrixSquare(odd[:], even[:])

	for {
		gf2MatrixSquare(even[:], odd[:])
		if len2&1 != 0 {
			crc1 = gf2MatrixTimes(even[:], crc1)
		}
		len2 >>= 1
		if len2 == 0 {
			break
		}

		gf2MatrixSquare(odd[:], even[:])
		if len2&1 != 0 {
			crc1 = gf2MatrixTimes(odd[:], crc1)
		}
		len2 >>= 1
		if len2 == 0 {
			break
		}
	}

	return (crc1 ^ crc2)
}

func gf2MatrixTimes(mat []uint64, vec uint64) uint64 {
	sum := uint64(0)
	idx := 0
	for vec != 0 {
		if vec&1 != 0 {
			sum ^= mat[idx]
		}
		vec >>= 1
		idx++
	}
	return sum
}

func gf2MatrixSquare(square, mat []uint64) {
	for n := 0; n < GF2Dim; n++ {
		square[n] = gf2MatrixTimes(mat, mat[n])
	}
}

// 文件校验函数
func FileCRC(path string) (uint64, error) {
	file, err := os.Open(path)
	if err != nil {
		return 0, err
	}
	defer file.Close()

	crc := NewCRC64().(*CRC64)
	buf := make([]byte, 4096)
	for {
		n, err := file.Read(buf)
		if err != nil && err != io.EOF {
			return 0, err
		}
		if n == 0 {
			break
		}
		crc.Update(buf[:n])
	}
	return crc.Sum64(), nil
}

func main() {
	// 测试字符串计算
	testCRC64("123456789", 11051210869376104954)
	testCRC64("中文", 16371802884590399230) // 需要实际测试值

	// 流式处理测试
	testStreamCRC()

	// 文件校验测试
	if crc, err := FileCRC("image.png"); err == nil {
		fmt.Printf("文件校验结果: %d\n", crc)
	}

	// 合并测试
	testCombineCRC()
}

func testCRC64(data string, expected uint64) {
	crc := NewCRC64().(*CRC64)
	crc.Update([]byte(data))
	result := crc.Sum64()
	fmt.Printf("%s: %d (%v)\n", data, result, result == expected)
}

func testStreamCRC() {
	crc := NewCRC64().(*CRC64)
	crc.Update([]byte("123456"))
	crc.Update([]byte("789"))
	result := crc.Sum64()
	fmt.Printf("流式校验: %d\n", result)
}

func testCombineCRC() {
	crc1 := NewCRC64().(*CRC64)
	crc1.Update([]byte("123456"))
	sum1 := crc1.Sum64()

	crc2 := NewCRC64().(*CRC64)
	crc2.Update([]byte("789"))
	sum2 := crc2.Sum64()

	combined := CombineCRC64(sum1, sum2, 3)
	fmt.Printf("合并结果: %d\n", combined)
}
