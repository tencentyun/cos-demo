//
//  MenuCell.m
//  QCloudCIToolBox
//
//  Created by garenwang on 2022/7/21.
//

#import "MenuCell.h"

@implementation MenuCell

- (void)awakeFromNib {
    [super awakeFromNib];
    self.labelTitle.text = self.stringTitle;
    self.labelTitle.font = [UIFont systemFontOfSize:12];
    self.labelTitle.textColor = [UIColor whiteColor];
}

@end
