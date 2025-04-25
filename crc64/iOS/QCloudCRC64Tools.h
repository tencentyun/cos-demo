#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface QCloudCRC64Tools : NSObject

/// 计算Data64
+ (uint64_t)qcloud_crc64:(NSMutableData *)data;

/// 计算文件CRC64
+ (uint64_t)crc64_filePath:(NSString *)filePath;

/// 合并crc64
+ (uint64_t)qcloud_crc64ForCombineCRC1:(uint64_t)crc1 CRC2:(uint64_t)crc2 length:(size_t)len2;

@end

NS_ASSUME_NONNULL_END
