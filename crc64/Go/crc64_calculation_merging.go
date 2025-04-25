package main

import (
	"fmt"
	"hash/crc64"
	"io"
	"os"
)

// 计算文件的 CRC64 值
func fileCRC64(path string) (uint64, error) {
	file, err := os.Open(path)
	if err != nil {
		return 0, err
	}
	defer file.Close()

	table := crc64.MakeTable(crc64.ECMA)
	hash := crc64.New(table)
	_, err = io.Copy(hash, file)
	if err != nil {
		return 0, err
	}
	return hash.Sum64(), nil
}

// 计算字节数据的 CRC64 值
func dataCRC64(data []byte) uint64 {
	table := crc64.MakeTable(crc64.ECMA)
	return crc64.Checksum(data, table)
}

// 流式计算 CRC64 值
func streamCRC64(r io.Reader) (uint64, error) {
	table := crc64.MakeTable(crc64.ECMA)
	hash := crc64.New(table)
	_, err := io.Copy(hash, r)
	if err != nil {
		return 0, err
	}
	return hash.Sum64(), nil
}

// 合并两个 CRC64 值
func combineCRC64(crc1, crc2 uint64, len2 uint64) uint64 {
	var delta [8]uint64
	for i := 0; i < 8; i++ {
		delta[i] = 1 << (56 - i)
		for j := 0; j < 8; j++ {
			if delta[i]&(1<<63) != 0 {
				delta[i] = (delta[i] << 1) ^ crc64.ECMA
			} else {
				delta[i] = delta[i] << 1
			}
		}
	}

	for ; len2 > 0; len2-- {
		for i := 0; i < 8; i++ {
			if crc1&(1<<63) != 0 {
				crc1 = (crc1 << 1) ^ crc64.ECMA
			} else {
				crc1 = crc1 << 1
			}
		}
	}
	return crc1 ^ crc2
}
func main() {
	// 计算文件的 CRC64
	filePath := "image.png"
	fileCRC, _ := fileCRC64(filePath)
	fmt.Printf("文件 %s 的 CRC64 值: %x\n", filePath, fileCRC)

	// 模拟流数据并计算 CRC64
	streamData := []byte("Hello, World!")
	streamCRC := dataCRC64(streamData)
	fmt.Printf("数据 CRC64 值: %x\n", streamCRC)

	// 合并两个 CRC64 值
	mergedCRC := combineCRC64(fileCRC, streamCRC, uint64(len("Hello, World!")))
	fmt.Printf("合并后的 CRC64 值: %x\n", mergedCRC)
}
