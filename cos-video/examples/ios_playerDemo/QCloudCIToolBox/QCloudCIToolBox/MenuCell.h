//
//  MenuCell.h
//  QCloudCIToolBox
//
//  Created by garenwang on 2022/7/21.
//

#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@interface MenuCell : UICollectionViewCell
@property (weak, nonatomic) IBOutlet UILabel *labelTitle;
@property (nonatomic,strong)NSString * stringTitle;
@end

NS_ASSUME_NONNULL_END
