var playerProxy = require('cos-hls-player-proxy');

playerProxy.start(function (err, data) {
    if (err) return console.error('playerProxy start error', err);
    console.log('play proxy ready!', data.url);
});
