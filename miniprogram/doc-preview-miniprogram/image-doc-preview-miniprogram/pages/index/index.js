// index.js
const Bucket = 'ci-h5-demo-1258125638'; // 存储桶名称
const Region = 'ap-chengdu'; // 地域
const filePath = 'default_file/defaultDoc.pdf'; // 预览文件路径

// 根据 Bucket, Region, filePath 拼接文件完整路径
const objectUrl = `https://${Bucket}.cos.${Region}.myqcloud.com/${filePath}`;

Page({
    data: {
        swiperItems: null, // 页面轮播元素数组
        currentPage: 0, // 当前页码
        pageSize: 10, // 每次最多请求10页
        totalPage: 1, // 总页数
        swiperHeight: 150, // 轮播元素高度
        isLoadding: false, // 是否正在请求图片
    },
    onLoad() {
        // 页面加载时调用 docImagePreview 方法，进行文档转图片预览
        this.docImagePreview();
    },

    docImagePreview() {
        const { currentPage, pageSize, isLoadding } = this.data;
        // 如果正在请求图片，直接return
        if (isLoadding === true) return;
        this.isLoadding = true; // 设置状态：开始请求图片
        // preViewDoc 处理结果格式为 { totalPage, pics }，其中totalPage代表总页数、pics为文档图片数组，存储有图片临时路径
        this.preViewDoc(currentPage, pageSize).then(data => {
            // 从结果中取出总页数totalPage和 图片数组pics
            const { totalPage, pics } = data;
            // 根据pics组装swiperItems，swiperItems格式为{ imageUrl, imageMode }
            const swiperItems = [];
            pics.forEach((element) => {
                // imageMode为图片裁剪、缩放的模式，此处widthFix值代表缩放模式，宽度不变，高度自动变化，保持原图宽高比不变
                swiperItems.push({ imageUrl: element, imageMode: 'widthFix' });
            });
            const temp = totalPage - swiperItems.length; // temp为总页数 - 当前轮播图片数量
            const pageSize = temp > 10 ? 10 : temp; // 设置pageSize，最大为10
            this.setData({
                totalPage,
                pageSize,
                swiperItems: swiperItems.filter(item => item.imageUrl), // 过滤临时图片地址为空的情况
            });
            this.isLoadding = false; // 设置状态：图片请求结束
        });
      },

      preViewDoc(currentPage, pageSize) {
        const promiseArray = [];
        const pics = []; // 存储图片临时链接数组
        if (currentPage <= 0) {
            currentPage = 1;
        }
        return new Promise((resolve, reject) => {
            // getPreviewDocPage 处理结果格式为 { totalPage, url }，其中totalPage代表总页数、url代表图片临时路径
            this.getPreviewDocPage(currentPage).then(res => {
                // 从结果中取出总页数totalPage和 图片链接url
                const { totalPage, url } = res;
                pics.push(url);
                // 每次请求pageSize页的文档图片
                if (totalPage >= currentPage) {
                    for (let i = 1; i < pageSize; i++) {
                        promiseArray.push(this.getPreviewDocPage(i + currentPage, totalPage));
                    }
                    return Promise.all(promiseArray);
                }
            }).then(res => {
                // Promise.all请求结果处理
                let totalPage = 0;
                (res || []).map(items => {
                    pics.push(items.url);
                    totalPage = items.totalPage;
                });
                if (pics.length == pageSize) {
                    resolve({
                        totalPage: totalPage,
                        pics: pics,
                    });
                }
            }).catch((err) => {
                reject(err);
            });
        });
    },

    // 下载文档图片资源到本地，返回 { totalPage, url }，总页数与图片临时路径
    getPreviewDocPage(currentPage, totalPage) {
        if(currentPage > totalPage) {
            return;
        }
        // 拼接请求参数，本示例中携带ImageParams，可以支持对图片进行处理。查看更多参数可以访问腾讯云官方文档：https://cloud.tencent.com/document/product/460/47074
        const url = `${objectUrl}?ci-process=doc-preview&page=${currentPage}&dstType=png&ImageParams=watermark/2/text/5pWw5o2u5LiH6LGh/fontsize/20/gravity/northeast/dx/20/dy/200/batch/1/degree/45`;
        return new Promise((resolve, reject) => {
            // 下载文档图片资源到本地，直接发起一个 HTTPS GET 请求，返回图片的本地临时路径
            // 注意：需要在微信公众平台 https://mp.weixin.qq.com/ 中的服务器域名下配置downloadFile合法域名，例如本示例中需要配置 https://ci-h5-demo-1258125638.cos.ap-chengdu.myqcloud.com
            wx.downloadFile({
                url,
                method: "GET",
                success(res) {
                    resolve({
                        totalPage: Number(res?.header["X-Total-Page"]) || totalPage, // 从请求结果中获取总页数
                        url: res?.tempFilePath || '', // 从请求结果中获取临时图片地址
                    });
                },
                fail(err) {
                    reject(err);
                },
            });
        });
    },
    currentPageChange(obj) {
        const { detail: { current }} = obj;
        const { swiperItems, totalPage, pageSize } = this.data;
        this.setData({ currentPage: current }); // 更新当前页码
        if (swiperItems == null) return;
        const swiperLength = swiperItems.length;
        // 轮播图片数量少于总页数、当前未在请求图片状态下 才会继续
        if (swiperLength - current < 5 && swiperLength < totalPage && this.isLoadding == false) {
            this.isLoadding = true; // 设置状态：开始请求图片
             // preViewDoc 处理结果格式为 { totalPage, pics }，其中totalPage代表总页数、pics为文档图片数组，存储有图片临时路径
            this.preViewDoc(swiperLength + 1, pageSize).then(data => {
                // 从结果中取出总页数totalPage和 图片数组pics
                const { totalPage, pics } = data;
                // 根据pics更新swiperItems，格式为{ imageUrl, imageMode }
                const newPages = swiperItems;
                pics.forEach(element => {
                     // imageMode为图片裁剪、缩放的模式，此处widthFix值代表缩放模式，宽度不变，高度自动变化，保持原图宽高比不变
                    newPages.push({ imageUrl: element, imageMode: 'widthFix' });
                });
                const temp = totalPage - newPages.length; // temp为总页数 - 当前轮播图片数量
                const pageS = temp > 10 ? 10 : temp; // 设置pageSize，最大为10
                this.setData({
                    swiperItems: newPages,
                    pageSize: pageS,
                });
                this.isLoadding = false; // 设置状态：请求图片结束
            });
        }
      },

      // 文档图片加载时，根据图片的宽高等比计算swiper的高度
      imgLoad(e) {
        const winWidth = wx.getSystemInfoSync().windowWidth; // 获取当前屏幕的宽度
        const imgHeight = e.detail.height; // 获取图片高度
        const imgWidth = e.detail.width; // 获取图片宽度
        const swiperHeight = (winWidth - 48) * imgHeight / imgWidth + 'px'; // 等比计算swiper的高度
        this.setData({swiperHeight}); // 设置swiper的高度
    },
})
