let keyMap = {}


function decodePlay(param) {
  const {container, src, getToken, ProtectContentKey} = param
          var encryptor = new JSEncrypt();
          var privateKey = encryptor.getPrivateKey();
          var publicKey = encryptor.getPublicKey();
          var hls = ''
          var buf2str = function (buf) {
              return [].map.call(new Uint8Array(buf), function (char) {
                  return String.fromCharCode(char);
              }).join('');
          };
          var str2buf = function (str) {
              var buf = new ArrayBuffer(str.length);
              var arr = new Uint8Array(buf);
              str.split('').forEach(function (char, i) {
                  return arr[i] = char.charCodeAt(0);
              });
              return buf;
          };
          var keyDecode = function (data, token) {
              var base64str = window.btoa(buf2str(data));
              var decrypt = new JSEncrypt();
              decrypt.setPrivateKey(keyMap[token]);
              var str = decrypt.decrypt(base64str);

              return str2buf(str);
          };

          var srcFormat = function(src) {
            let urlList = src.split("myqcloud.com/")
            if (Array.isArray(urlList)) {
                return {bucketPath: urlList[0] + 'myqcloud.com', urlPath: urlList[1]}
            } else {
                return {bucketPath: '', urlPath: ''}
            }
          }
          var playVideo = function (url, token) {
                keyMap[token] = privateKey;
              var video = document.getElementById(container);
              
              if (Hls.isSupported()) {
                    
                  hls = new Hls({});
                  hls.loadSource(url);
                  hls.token = token
                  hls.attachMedia(video);
                  hls.on(Hls.Events.MEDIA_ATTACHED, function () {
                      video.muted = true;
                      video.play();
                  });
              } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                  video.src = url;
                  video.addEventListener('canplay', function () {
                      video.play();
                  });
              }
          };

          var load = Hls.DefaultConfig.loader.prototype.load;
          Hls.DefaultConfig.id = publicKey
          Hls.DefaultConfig.loader.prototype.load = function (context, config, callbacks) {
              var onSuccess = callbacks.onSuccess;
              callbacks.onSuccess = function (response, stats, ctx, xhr) {
                  if (ctx.keyInfo && ProtectContentKey === 1) {
                      response.data = keyDecode(response.data, hls.token);
                  }
                  onSuccess.call(this, response, stats, ctx, xhr);
              };
              load.call(this, context, config, callbacks);
          };
          let urlObject = srcFormat(src);
          getToken({
              publicKey: publicKey,
              src: src,
              ProtectContentKey: ProtectContentKey
          }, function (err, data) {
                
              if (err) return console.log(err);
              playVideo(`${src}?ci-process=pm3u8&expires=43200&tokenType=JwtToken&${data.authorization}&token=${data.token}`, data.token);
          });
}

window.cosHls = {
    play: function (param) {
        setTimeout(function() {
          decodePlay(param)
        }, 500)
    }
};
