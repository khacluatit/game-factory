// swift-tools-version:5.9
import PackageDescription

let package = Package(
    name: "GameCore",
    platforms: [.iOS(.v16)],
    products: [
        .library(name: "GameCore", targets: ["GameCore"])
    ],
    dependencies: [
        .package(url: "https://github.com/googleads/swift-package-manager-google-mobile-ads.git", from: "12.0.0"),
        .package(url: "https://github.com/googleads/swift-package-manager-google-user-messaging-platform.git", from: "3.0.0")
    ],
    targets: [
        .target(
            name: "GameCore",
            dependencies: [
                .product(name: "GoogleMobileAds", package: "swift-package-manager-google-mobile-ads"),
                .product(name: "GoogleUserMessagingPlatform", package: "swift-package-manager-google-user-messaging-platform")
            ]
        )
    ]
)
