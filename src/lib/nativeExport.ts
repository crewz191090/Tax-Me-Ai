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
 * nothing there. Native builds instead write the file to the device's
 * public Documents folder (so it's actually saved and visible in a file
 * manager, not just sitting in the app's private cache) and then also
 * open the system share sheet so the user can immediately send it
 * elsewhere (Drive, WhatsApp, etc.) if they want — cancelling the share
 * sheet is not an error, since the file is already saved either way.
 * Regular web browsers keep using the normal download link.
 */
export async function saveOrShareFile(blob: Blob, filename: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    const permission = await Filesystem.checkPermissions();
    if (permission.publicStorage !== "granted") {
      await Filesystem.requestPermissions();
    }

    const base64 = await blobToBase64(blob);
    const written = await Filesystem.writeFile({
      path: filename,
      data: base64,
      directory: Directory.Documents,
      recursive: true,
    });

    try {
      await Share.share({ title: filename, url: written.uri });
    } catch {
      // User dismissed the share sheet, or no share target is available —
      // not a failure, the file is already saved to the Documents folder.
    }
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
