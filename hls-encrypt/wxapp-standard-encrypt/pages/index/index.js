Page({
    data: {
        m3u8Url: 'https://ci-h5-bj-1258125638.cos.ap-beijing.myqcloud.com/hls/BigBuckBunny.m3u8',
        src: '',
    },
    onReady: async function () {
        wx.request({
            method: 'POST',
            url: 'https://carsonxu.com/cos/samples/hls/token',
            data: JSON.stringify({
                src: this.data.m3u8Url,
                protectContentKey: 0,
            }),
            header: {
                'Content-Type': 'application/json',
            },
            dataType: 'json',
            success: (res) => {
                const {token, authorization} = res.data;
                const url = `${this.data.m3u8Url}?ci-process=pm3u8&expires=43200&tokenType=JwtToken&token=${encodeURIComponent(token)}&${authorization}`;
                this.setData({ src: url });
            },
            fail(res) {
                console.log(res);
            },
        });
    }
})
