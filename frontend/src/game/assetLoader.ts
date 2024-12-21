export const getAssetUrl = (path: string) => {
    const CLOUDFRONT_URL = process.env.NEXT_PUBLIC_CLOUDFRONT_URL;
    if (!CLOUDFRONT_URL) {
        throw new Error("CLOUDFRONT_URL environment variable is not set");
    }
    return `https://${CLOUDFRONT_URL}/${path}`;
};
