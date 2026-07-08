// a dummy origin used to resolve relative URLs with the native URL constructor,
// which, unlike the deprecated Node-style url.resolve, doesn't accept relative base URLs
const DUMMY_ORIGIN = "http://dummy-origin";

/**
 * Resolves a path against a base URL like the Node-style `url.resolve`:
 * the base URL is allowed to be relative, and in that case the result
 * will also be relative.
 * @param path - Path to resolve.
 * @param base - Base URL, either absolute or relative.
 * @return Resolved URL.
 */
export function resolveURL(path: string, base: string): string {
    const resolved = new URL(path, new URL(base, DUMMY_ORIGIN + "/"));

    if (resolved.origin !== DUMMY_ORIGIN) {
        // either the path or the base was an absolute URL
        return resolved.href;
    }

    const result = resolved.href.slice(DUMMY_ORIGIN.length);

    // the result keeps the leading slash if the path or the base was root-relative
    return path.startsWith("/") || base.startsWith("/") ? result : result.slice(1);
}

/**
 * Gets the name of parent folder in a url.
 * @param url - URL of a file.
 * @return Name of the parent folder, or the file itself if it has no parent folder.
 */
export function folderName(url: string) {
    let lastSlashIndex = url.lastIndexOf("/");

    if (lastSlashIndex != -1) {
        url = url.slice(0, lastSlashIndex);
    }

    lastSlashIndex = url.lastIndexOf("/");

    if (lastSlashIndex !== -1) {
        url = url.slice(lastSlashIndex + 1);
    }

    return url;
}
