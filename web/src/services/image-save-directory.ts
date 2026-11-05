import localforage from "localforage";

const store = localforage.createInstance({ name: "infinite-canvas", storeName: "app_state" });
const DIRECTORY_KEY = "image-save-directory";
const PERMISSION = { mode: "readwrite" } as const;

export type ImageSaveDirectory = { handle: FileSystemDirectoryHandle; granted: boolean };

export function supportsImageSaveDirectory() {
    return typeof window !== "undefined" && typeof window.showDirectoryPicker === "function";
}

export async function getImageSaveDirectory(): Promise<ImageSaveDirectory | null> {
    try {
        const handle = await store.getItem<FileSystemDirectoryHandle>(DIRECTORY_KEY);
        if (!handle) return null;
        return { handle, granted: (await handle.queryPermission(PERMISSION)) === "granted" };
    } catch {
        return null;
    }
}

export async function chooseImageSaveDirectory(): Promise<ImageSaveDirectory | null> {
    if (!window.showDirectoryPicker) return null;
    const handle = await window.showDirectoryPicker({ id: "image-save-directory", mode: "readwrite" });
    if ((await handle.requestPermission(PERMISSION)) !== "granted") return null;
    await store.setItem(DIRECTORY_KEY, handle);
    return { handle, granted: true };
}

export async function requestImageSavePermission(handle: FileSystemDirectoryHandle) {
    if ((await handle.queryPermission(PERMISSION)) === "granted") return true;
    return (await handle.requestPermission(PERMISSION)) === "granted";
}

export async function clearImageSaveDirectory() {
    await store.removeItem(DIRECTORY_KEY);
}

export async function writeImageFile(directory: FileSystemDirectoryHandle, fileName: string, blob: Blob) {
    const fileHandle = await directory.getFileHandle(fileName, { create: true });
    const writable = await fileHandle.createWritable();
    try {
        await writable.write(blob);
        await writable.close();
    } catch (error) {
        await writable.abort().catch(() => undefined);
        throw error;
    }
}

let lastImageFileAt = 0;

export function imageFileName(mimeType: string, now = new Date()) {
    // Batch results can finish in the same millisecond; bump the stamp so names stay unique.
    const timestamp = Math.max(now.getTime(), lastImageFileAt + 1);
    lastImageFileAt = timestamp;
    const date = new Date(timestamp);
    const pad = (value: number, length = 2) => String(value).padStart(length, "0");
    const time = `${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}${pad(date.getMilliseconds(), 3)}`;
    const extension = mimeType === "image/jpeg" ? "jpg" : mimeType.split("/")[1]?.replace("svg+xml", "svg") || "png";
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${time}.${extension}`;
}
