#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@protocol ECDDropMenuDelegate<NSObject>

- (void)didSelectRowAtIndex:(NSInteger)index;

@end

@interface ECDDropMenuView : UIViewController

- (instancetype)initDropMenuFrame:(CGRect)frame ArrowOffset:(NSInteger)arrowOffset itemArray:(NSArray <NSString *> *)items RowHeight:(CGFloat)rowHeight Delegate:(id<ECDDropMenuDelegate>)delegate;

- (void)showDropMenu;

- (void)hiddenDropMenuCompletion: (void (^ __nullable)(void))completion;

@end

NS_ASSUME_NONNULL_END
