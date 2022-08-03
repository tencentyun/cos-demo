//
//  AppDelegate.m
//  QCloudCIToolBox
//
//  Created by garenwang on 2022/7/14.
//

#import "AppDelegate.h"
#import "ViewController.h"
@interface AppDelegate ()

@end

@implementation AppDelegate


- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {
 
    _window = [[UIWindow alloc]initWithFrame:UIScreen.mainScreen.bounds];
    [_window makeKeyAndVisible];
    _window.rootViewController = [[UINavigationController alloc]initWithRootViewController:[ViewController new]];
    return YES;
}

@end
