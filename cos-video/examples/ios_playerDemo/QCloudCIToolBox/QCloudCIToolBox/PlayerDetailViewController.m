//
//  PlayerDetailViewController.m
//  QCloudCIToolBox
//
//  Created by garenwang on 2022/7/18.
//

#import "PlayerDetailViewController.h"
#import <AVFoundation/AVFoundation.h>
#import <AVKit/AVKit.h>
#import <SJVideoPlayer/SJVideoPlayer.h>
#import "TXLiteAVSDK_Player/TXLiteAVSDK.h"
#import "ECDDropMenuView.h"

#import <SuperPlayer.h>
#import "DynamicWaterModel.h"
@interface PlayerDetailViewController (){
    NSMutableArray * titles;
}

@property (weak, nonatomic) IBOutlet UITextView *inputVideoLink;

@property (weak, nonatomic) IBOutlet UISegmentedControl *selectPlayer;
@property (weak, nonatomic) IBOutlet UIView *playerContentView;

@property(nonatomic,strong)TXVodPlayer *txVodPlayer;
@property (nonatomic, strong)AVPlayerViewController *playerVc;

@property (weak, nonatomic) IBOutlet UISegmentedControl *segment;
@property (weak, nonatomic) IBOutlet UILabel *labDesc;
@property (weak, nonatomic) IBOutlet UIButton *selectSharpnessButton;
@property (weak, nonatomic) IBOutlet UILabel *labError;

@property (nonatomic, strong)SuperPlayerView * playerView;

@end

@implementation PlayerDetailViewController

- (void)viewDidLoad {
    [super viewDidLoad];
    self.title = self.titleString;
    self.navigationController.navigationBar.tintColor = [UIColor blackColor];
    self.inputVideoLink.text = self.videoLink;
    self.labDesc.text = self.descString;
    
    if ([self.titleString isEqualToString:@"切换多清晰度"]) {
        [self.segment setSelectedSegmentIndex:2];
        [self setupTCPlayer];
    }else{
        [self setupAVPlayer];
        self.selectSharpnessButton.hidden = YES;
    }
    
    
}

- (void)setVideoLink:(NSString *)videoLink{
    _videoLink = videoLink;
    self.inputVideoLink.text = videoLink;
}

- (IBAction)actionSelectPlayer:(UISegmentedControl *)sender {
    [self startPlayer:sender.selectedSegmentIndex];
}

-(void)startPlayer:(NSInteger)index{
    
    if (self.txVodPlayer) {
        [self.txVodPlayer stopPlay];
    }
    
    if (self.playerVc) {
        [self.playerVc.player pause];
    }
    
    self.labError.text = @"";
    self.selectSharpnessButton.hidden = YES;
    switch (index) {
        case 0:
            [self setupAVPlayer];
            break;
        case 1:
            [self setSuperPlayer];
            break;
        case 2:
            [self setupTCPlayer];
            break;
        default:
            break;
    }
}

-(void)setSuperPlayer{
    // 创建播放器
    
    [self cleanSubviews];
    
    if([self.title isEqualToString:@"DASH"]) {
       self.labError.text = @"超级播放器 不支持mpd格式视频";
        return;
    }
    
    _playerView = [[SuperPlayerView alloc] init];
    _playerView.fatherView = self.playerContentView;
    
    SuperPlayerModel *playermodel = [[SuperPlayerModel alloc] init];
    playermodel.videoURL = self.videoLink;
    playermodel.action  = PLAY_ACTION_AUTO_PLAY;
    
    if ([self.title isEqualToString:@"动态水印"]) {
        DynamicWaterModel *model = [[DynamicWaterModel alloc] init];
        model.dynamicWatermarkTip = @"数据万象";
        model.textFont = 30;
        model.textColor = [UIColor colorWithRed:255.0/255.0 green:255.0/255.0 blue:255.0/255.0 alpha:0.8];
        playermodel.dynamicWaterModel = model;
    }
    
    if([self.title isEqualToString:@"封面图"]){
        playermodel.customCoverImageUrl = @"https://cos-video-1258344699.cos.ap-guangzhou.myqcloud.com/poster.png";
        playermodel.action  = PLAY_ACTION_MANUAL_PLAY;
    }
    
    if([self.title isEqualToString:@"切换多清晰度"]){
        self.labError.text = @"超级播放器 不支持切换多清晰度";
    }
    
    [self.playerView playWithModel:playermodel];
    
}

-(void)cleanSubviews{
    
    if (self.txVodPlayer) {
        [self.txVodPlayer stopPlay];
    }
   
    if (self.playerVc) {
        [self.playerVc.player pause];
    }
    
    if (self.playerView) {
        [self.playerView pause];
    }
    
    for (UIView * view in [self.playerContentView subviews]) {
        [view removeFromSuperview];
    }
}

-(void)setupAVPlayer{
    
    [self cleanSubviews];
    if (!self.playerVc) {
        _playerVc = [[AVPlayerViewController alloc] init];
        _playerVc.view.backgroundColor = [UIColor whiteColor];
        _playerVc.view.frame = self.playerContentView.bounds;
    }
    [self.playerContentView addSubview:self.playerVc.view];
    if ([self.videoLink.lowercaseString hasSuffix:@"flv"]) {
        self.labError.text = @"AVPlayer 不支持flv格式视频";
        return;
    }else if([self.title isEqualToString:@"DASH"]) {
        self.labError.text = @"AVPlayer 不支持mpd格式视频";
        return;
    }else if([self.title isEqualToString:@"切换多清晰度"]){
        self.labError.text = @"AVPlayer 不支持切换多清晰度";
    }else if([self.title isEqualToString:@"封面图"]){
        self.labError.text = @"AVPlayer 不支持设置封面图";
    }
    AVPlayer *player = [AVPlayer playerWithURL:[NSURL URLWithString:self.videoLink]];
    self.playerVc.player = player;
    [self.playerVc.player play];
}

-(void)setupTCPlayer{
    [self cleanSubviews];
    self.txVodPlayer = [[TXVodPlayer alloc] init];
    
    
    if([self.title isEqualToString:@"DASH"]) {
       self.labError.text = @"TCPlayer 不支持mpd格式视频";
        return;
    }else if([self.title isEqualToString:@"切换多清晰度"]){
        self.selectSharpnessButton.hidden = NO;
    }
    [_txVodPlayer setupVideoWidget:self.playerContentView insertIndex:0];
    [_txVodPlayer startPlay:self.videoLink];
}


- (IBAction)actionPlayVideo:(UIButton *)sender {
    self.videoLink = self.inputVideoLink.text;
    if (self.videoLink.length == 0) {
        self.labError.text = @"请输入视频链接";
        return;
    }
    [self startPlayer:self.segment.selectedSegmentIndex];
    [self.inputVideoLink resignFirstResponder];
}

- (IBAction)actionSelectSharpness:(UIButton *)sender {
    
    
    if (!titles) {
        NSArray *bitrates = [_txVodPlayer supportedBitrates];
        titles = [NSMutableArray new];
        [titles addObject:@"自动"];
        [bitrates enumerateObjectsUsingBlock:^(TXBitrateItem * _Nonnull obj, NSUInteger idx, BOOL * _Nonnull stop) {
            [titles addObject:[NSString stringWithFormat:@"%ld",obj.width]];
        }];
    }
    
    ECDDropMenuView * menu = [[ECDDropMenuView alloc]initDropMenuFrame:CGRectMake(sender.frame.origin.x, sender.frame.origin.y, 60, 0) ArrowOffset:0 itemArray:titles RowHeight:24 Delegate:self];
    [menu showDropMenu];
    
}

- (void)didSelectRowAtIndex:(NSInteger)index{
    [self.selectSharpnessButton setTitle:titles[index] forState:0];
    [_txVodPlayer setBitrateIndex:index - 1];
}

- (void)dealloc{
    [self cleanSubviews];
}

@end
