//
//  ECDDropMenuView.h
//  QCloudECDClient
//
//  Created by garenwang on 2021/11/13.
//

#import "ECDDropMenuView.h"

#define kCellIdentifier @"cellIdentifier"
#define kDropMenuCellID @"DropMenuCellID"
#import "MenuCell.h"

@interface ECDDropMenuContentView : UIView
@property (nonatomic,assign)NSInteger arrowOffset;
@end

@implementation ECDDropMenuContentView

- (instancetype)initWithFrame:(CGRect)frame arrowOffset:(NSInteger)arrowOffset
{
    self = [super initWithFrame:frame];
    if (self) {
        self.arrowOffset = arrowOffset;
        self.backgroundColor = [UIColor clearColor];
        self.layer.shadowColor = UIColor.blackColor.CGColor;
        self.layer.shadowOpacity = 0.3;
        self.layer.shadowRadius = 5;
        self.layer.shadowOffset = CGSizeMake(0, 0);
    }
    return self;
}

@end


@interface ECDDropMenuView()<UICollectionViewDelegateFlowLayout,UICollectionViewDataSource>

@property (nonatomic, strong) UIView *cover;

@property (nonatomic, strong) UICollectionView *collectionView;

@property (nonatomic, strong) ECDDropMenuContentView *contentView;

@property (nonatomic, copy) NSArray <NSString *> *items;

@property (nonatomic, assign) CGFloat rowHeight;

@property (nonatomic,assign)CGRect contentFrame;

@property (nonatomic,assign)NSInteger arrowOffset;

@property (nonatomic,weak)id<ECDDropMenuDelegate> delegate;

@end

@implementation ECDDropMenuView

- (instancetype)initDropMenuFrame:(CGRect)frame ArrowOffset:(NSInteger)arrowOffset itemArray:(NSArray <NSString *> *)items RowHeight:(CGFloat)rowHeight Delegate:(id<ECDDropMenuDelegate>)delegate{
    
    if (self  = [self init]) {
        self.contentFrame = CGRectMake(frame.origin.x, frame.origin.y - items.count * rowHeight, frame.size.width, items.count * rowHeight);
        self.items = items;
        self.rowHeight = rowHeight;
        self.arrowOffset = arrowOffset;
        self.delegate = delegate;
        self.contentView = [[ECDDropMenuContentView alloc]initWithFrame:self.contentFrame arrowOffset:arrowOffset];
        [self.view addSubview:self.contentView];
        [self.contentView addSubview:self.collectionView];
        [self.collectionView reloadData];
    }

    return self;
}



- (UICollectionView *)collectionView{
    if (!_collectionView) {
        UICollectionViewFlowLayout * layout = [[UICollectionViewFlowLayout alloc]init];
        layout.minimumLineSpacing = 0;
        layout.minimumInteritemSpacing = 0;
        layout.itemSize = CGSizeMake(self.contentFrame.size.width, self.rowHeight);

        _collectionView = [[UICollectionView alloc] initWithFrame:CGRectMake(0,0, self.contentFrame.size.width, self.contentFrame.size.height) collectionViewLayout:layout];
        _collectionView.delegate = self;
        _collectionView.dataSource = self;
        _collectionView.scrollEnabled = NO;
        _collectionView.backgroundColor = [UIColor colorWithRed:0 green:0 blue:0 alpha:0.7];
        
        _collectionView.autoresizingMask = UIViewAutoresizingFlexibleTopMargin | UIViewAutoresizingFlexibleWidth;
        [_collectionView registerNib:[UINib nibWithNibName:@"MenuCell" bundle:nil] forCellWithReuseIdentifier:@"MenuCell"];

        _collectionView.delegate = self;
        _collectionView.dataSource = self;
        
    }
    return _collectionView;
}

- (void)showDropMenu {
    self.view.backgroundColor = [UIColor clearColor];
    self.modalPresentationStyle = UIModalPresentationOverFullScreen;
    self.contentView.frame = self.contentFrame;
    [[self currentViewController] presentViewController:self  animated:NO completion:nil];
}


- (void)hiddenDropMenuCompletion: (void (^ __nullable)(void))completion {
    self.contentView.frame = self.contentFrame;
    [self dismissViewControllerAnimated:NO completion:^{
        if (completion) {
            completion();
        }
    }];
    
}

- (UIViewController *)currentViewController {
    UIViewController *vc = [UIApplication sharedApplication].keyWindow.rootViewController;
    while (true) {
        if ([vc isKindOfClass:[UINavigationController class]]) {
            vc = [(UINavigationController *)vc visibleViewController];
        } else if ([vc isKindOfClass:[UITabBarController class]]) {
            vc = [(UITabBarController *)vc selectedViewController];
        } else if (vc.presentedViewController) {
            vc = vc.presentedViewController;
        } else {
            break;
        }
    }
    return vc;
}

#pragma mark - UICollectionViewDataSource

- (__kindof UICollectionViewCell *)collectionView:(UICollectionView *)collectionView cellForItemAtIndexPath:(NSIndexPath *)indexPath {
    MenuCell *emptyCell = [collectionView dequeueReusableCellWithReuseIdentifier:@"MenuCell"
                                                                                         forIndexPath:indexPath];
    emptyCell.labelTitle.text = self.items[indexPath.row];
    return emptyCell;

}
- (NSInteger)collectionView:(UICollectionView *)collectionView numberOfItemsInSection:(NSInteger)section {
    return self.items.count;
}

- (void)collectionView:(UICollectionView *)collectionView didSelectItemAtIndexPath:(NSIndexPath *)indexPath {
    if ([self.delegate respondsToSelector:@selector(didSelectRowAtIndex:)]) {
        [self dismissViewControllerAnimated:NO completion:^{
            [self.delegate didSelectRowAtIndex:indexPath.row];
        }];
    }
    
}

- (void)touchesBegan:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event{
    [self hiddenDropMenuCompletion:nil];
}
@end




