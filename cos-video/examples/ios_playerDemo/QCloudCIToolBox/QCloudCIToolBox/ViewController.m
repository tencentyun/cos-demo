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
@end

@implementation ViewController

- (void)viewDidLoad {
    [super viewDidLoad];
    self.title = @"万象工具箱";
    self.dataArray = @[@"MP4",@"M3U8",@"PM3U8",@"FLV",@"封面图",@"切换多清晰度",@"DASH",@"动态水印"];
    self.urlArray = @[
        @"https://cos-video-1258344699.cos.ap-guangzhou.tencentcos.cn/test.mp4",
        @"https://cos-video-1258344699.cos.ap-guangzhou.myqcloud.com/hls/test.m3u8",
        @"https://cos-video-private-1258344699.cos.ap-guangzhou.myqcloud.com/hls/test.m3u8?ci-process=pm3u8&expires=3600&q-sign-algorithm=sha1&q-ak=AKIDRhjX4KK2Uq31jCVheMp1ziV3LNCk0zg7&q-sign-time=1658301190;1973661190&q-key-time=1658301190;1973661190&q-header-list=&q-url-param-list=&q-signature=a0fc3e08b7827c391031d8357ba40787d12619e6",
        @"https://cos-video-1258344699.cos.ap-guangzhou.tencentcos.cn/test.flv",
        @"https://cos-video-1258344699.cos.ap-guangzhou.tencentcos.cn/test.mp4",
        @"https://cos-video-1258344699.cos.ap-guangzhou.myqcloud.com/multi-definition/test_i2dfb2ce3075811edb7d0525400ed8f15.m3u8",
        @"https://cos-video-1258344699.cos.ap-guangzhou.myqcloud.com/dash/test.mpd",
        @"https://cos-video-1258344699.cos.ap-guangzhou.myqcloud.com/dynamicWatermark.mov"
   ];
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
    [self.navigationController pushViewController:playerDetail animated:YES];
    [tableView deselectRowAtIndexPath:indexPath animated:YES];
}


@end
