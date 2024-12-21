declare namespace Phaser {
    namespace Loader {
        interface LoaderPlugin {
            s3Image(key: string, url: string): void;
            s3JSON(key: string, url: string): void;
        }
    }
}

