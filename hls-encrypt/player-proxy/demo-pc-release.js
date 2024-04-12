/**
 * 当前示例用于最终 PC 端调用
 */

var playerProxy = require('cos-hls-player-proxy');

// 调用方式1：外部指定端口
playerProxy.start(function (err, data) {
    if (err) return console.error('playerProxy start error', err);
    console.log('play proxy ready!', data.url);
});

// 调用方式2：内部随机端口
// playerProxy.start(function (err, data) {
//     if (err) return console.error('playerProxy start error', err);
//     console.log('play proxy ready!', data.url);
// });
