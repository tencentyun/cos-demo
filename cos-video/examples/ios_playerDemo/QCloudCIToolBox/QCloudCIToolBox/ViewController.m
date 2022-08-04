//
//  ViewController.m
//  QCloudCIToolBox
//
//  Created by garenwang on 2022/7/14.
//

#import "ViewController.h"
#import "PlayerDetailViewController.h"
@interface ViewController ()<UITableViewDelegate,UITableViewDataSource>
@property (nonatomic,strong)UITableView *tableView;
@property (nonatomic,strong)NSArray <NSString *> * dataArray;
@property (nonatomic,strong)NSArray <NSString *> * urlArray;
@property (nonatomic,strong)NSArray <NSString *> * descArray;
@end

@implementation ViewController

- (void)viewDidLoad {
    [super viewDidLoad];
    self.title = @"万象工具箱";
    self.dataArray = @[@"视频播放",@"M3U8",@"PM3U8",@"封面图",@"切换多清晰度",@"动态水印"];
    self.urlArray = @[
        @"https://cos-video-1258344699.cos.ap-guangzhou.tencentcos.cn/test.mp4",
        @"https://cos-video-1258344699.cos.ap-guangzhou.myqcloud.com/hls/test.m3u8",
        @"https://cos-video-private-1258344699.cos.ap-guangzhou.myqcloud.com/hls/test.m3u8?ci-process=pm3u8&expires=3600&q-sign-algorithm=sha1&q-ak=AKIDRhjX4KK2Uq31jCVheMp1ziV3LNCk0zg7&q-sign-time=1658301190;1973661190&q-key-time=1658301190;1973661190&q-header-list=&q-url-param-list=&q-signature=a0fc3e08b7827c391031d8357ba40787d12619e6",
        @"https://cos-video-1258344699.cos.ap-guangzhou.tencentcos.cn/test.mp4",
        @"https://cos-video-1258344699.cos.ap-guangzhou.myqcloud.com/multi-definition/test_i2dfb2ce3075811edb7d0525400ed8f15.m3u8",
        @"https://cos-video-1258344699.cos.ap-guangzhou.myqcloud.com/dynamicWatermark.mov"
   ];
    
    self.descArray = @[
        @"视频播放",
        @"M3U8",
        @"PM3U8",
        @"支持为视频设置预览封面图。",
        @"播放HLS或DASH自适应码流文件时，播放清晰度将默认采用自动切换逻辑，此时播放器将根据当前带宽，动态选择最合适的码率播放，用户也可以选择自行切换不同清晰度的子流",
        @"播放器支持为视频添加位置与速度产生变换的水印"];
    self.tableView = [[UITableView alloc]initWithFrame:self.view.frame style:UITableViewStylePlain];
    self.tableView.delegate = self;
    self.tableView.dataSource = self;
    [self.view addSubview:self.tableView];
    self.tableView.rowHeight = 44;
    [self.tableView registerClass:UITableViewCell.class forCellReuseIdentifier:@"UITableViewCell"];
    
}

- (NSInteger)numberOfSectionsInTableView:(UITableView *)tableView{
    return 1;
}

- (NSInteger)tableView:(UITableView *)tableView numberOfRowsInSection:(NSInteger)section{
    return self.dataArray.count;
}

- (UITableViewCell *)tableView:(UITableView *)tableView cellForRowAtIndexPath:(NSIndexPath *)indexPath{
    UITableViewCell * cell = [tableView dequeueReusableCellWithIdentifier:@"UITableViewCell"];
    cell.textLabel.text = [self.dataArray objectAtIndex:indexPath.row];
    return cell;
}

- (void)tableView:(UITableView *)tableView didSelectRowAtIndexPath:(NSIndexPath *)indexPath{
    PlayerDetailViewController * playerDetail = [[PlayerDetailViewController alloc]init];
    playerDetail.titleString = [self.dataArray objectAtIndex:indexPath.row];
    playerDetail.videoLink = [self.urlArray objectAtIndex:indexPath.row];
    playerDetail.descString = [self.descArray objectAtIndex:indexPath.row];
    [self.navigationController pushViewController:playerDetail animated:YES];
    [tableView deselectRowAtIndexPath:indexPath animated:YES];
}


@end
