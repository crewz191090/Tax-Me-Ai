"use client";

import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // FileReader.readAsDataURL gives "data:<mime>;base64,<data>" — the
      // Filesystem plugin wants just the base64 payload.
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/**
 * The classic <a download> + blob URL trick has no download manager to
 * hand off to inside Capacitor's Android WebView, so it silently does
 * nothing there. Native builds instead write the file to the app's cache
 * and open the system share sheet, from which the user can save it to
 * Downloads, Drive, or send it anywhere else. Regular web browsers keep
 * using the normal download link.
 */
export async function saveOrShareFile(blob: Blob, filename: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    const base64 = await blobToBase64(blob);
    const written = await Filesystem.writeFile({
      path: filename,
      data: base64,
      directory: Directory.Cache,
    });
    await Share.share({
      title: filename,
      url: written.uri,
    });
    return;
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
