const { crc64, crc64Calculator, crc64Concat, crc64Combine, crc64File } = require('./crc64');

// 1. crc64 计算 字符串、Buffer
// 123456789 的 crc64 值为 11051210869376104954
// 中文 的 crc64 值为 16371802884590399230
console.log(
    '1. crc64 123456789:',
    crc64('123456789'),
    crc64(Buffer.from('123456789')),
    '中文:',
    crc64('中文'),
    crc64(Buffer.from('中文')),
);

// 2. crc64 计算 字符串、Buffer
// 123456789 的 crc64 值为 11051210869376104954
// 中文 的 crc64 值为 16371802884590399230
const hash21 = crc64Calculator().update('123').update('456').update('789').digest();
const hash22 = crc64Calculator().update('中').update('文').digest();
console.log('2. crc64Calculator 123456789:', hash21, '中文:', hash22);

// 4. crc64Concat 追加 crc64 计算，计算后 7138526414024387452
const hash3 = crc64Concat(crc64('123456'), crc64('789'), 3);
console.log('3. crc64Concat 123456789:', hash3);

// 4. crc64Combine 合并 crc64 数组，合并值为 7138526414024387452
const hash4 = crc64Combine([
    {hash: crc64('12'), size: 2},
    {hash: crc64('345'), size: 3},
    {hash: crc64('6789'), size: 4},
]);
console.log('4. crc64Combine 123456789:', hash4);


// 5. crc64File 计算文件 crc64.js 值 13835856697459921550
crc64File('./crc64.js', (err, hash5) => {
    console.log('5. crc64File crc64.js:', hash5);
});
