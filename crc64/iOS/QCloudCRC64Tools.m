#import "QCloudCRC64Tools.h"
#include "QCloudCRC64.h"
@implementation QCloudCRC64Tools
+ (uint64_t)qcloud_crc64:(NSMutableData *)data {
    return qcloud_aos_crc64(0, data.mutableBytes, data.length);
}

+ (uint64_t)qcloud_crc64ForCombineCRC1:(uint64_t)crc1 CRC2:(uint64_t)crc2 length:(size_t)len2 {
    return qcloud_aos_crc64_combine(crc1, crc2, len2);
}

+ (uint64_t)crc64_filePath:(NSString *)filePath{
    // 1. 打开文件
    NSFileHandle *fileHandle = [NSFileHandle fileHandleForReadingAtPath:filePath];
    if (!fileHandle) {
        return 0;
    }
    
    // 2. 获取文件大小
    unsigned long long fileSize = QCloudFileSize(filePath);
    
    // 3. 初始化CRC和偏移量
    uint64_t combinedCRC = 0;
    unsigned long long offset = 0;
    
    @try {
        while (offset < fileSize) {
            @autoreleasepool {
                // 4. 读取数据块
                NSUInteger remaining = (NSUInteger)(fileSize - offset);
                NSUInteger readLength = MIN(remaining, 10 * 1024 * 1024);
                [fileHandle seekToFileOffset:offset];
                NSData *chunk = [fileHandle readDataOfLength:readLength];
                if (chunk.length == 0) break;
                
                // 5. 计算当前块CRC
                NSMutableData *mutableChunk = [chunk mutableCopy];
                uint64_t chunkCRC = [QCloudCRC64Tools qcloud_crc64:mutableChunk];
                
                // 6. 合并CRC
                if (offset == 0) {
                    combinedCRC = chunkCRC;
                } else {
                    combinedCRC = [QCloudCRC64Tools qcloud_crc64ForCombineCRC1:combinedCRC
                                                                     CRC2:chunkCRC
                                                                  length:chunk.length];
                }
                
                offset += chunk.length;
            }
        }
    } @catch (NSException *exception) {
        return 0;
    } @finally {
        [fileHandle closeFile];
    }
    return combinedCRC;
}

uint64_t QCloudFileSize(NSString *path) {
    if (path.length == 0) {
        return 0;
    }
    BOOL isDirectory = NO;
    if ([[NSFileManager defaultManager] fileExistsAtPath:path isDirectory:&isDirectory]) {
        if (isDirectory) {
            return 0;
        }
        NSDictionary *attribute = [[NSFileManager defaultManager] attributesOfItemAtPath:path error:nil];
        return [attribute fileSize];
    }
    return 0;
}
@end
