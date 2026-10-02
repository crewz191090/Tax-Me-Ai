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
export function describeExportError(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === "string" && err) return err;
  try {
    return JSON.stringify(err);
  } catch {
    return "Unknown error";
  }
}

// Names which step of the native save failed — a bare "Filesystem failed"
// from the plugin otherwise gives no hint whether it was the permission
// prompt, the write itself, or something earlier.
async function nativeStep<T>(step: string, run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (err) {
    throw new Error(`${step}: ${describeExportError(err)}`);
  }
}

export async function saveOrShareFile(blob: Blob, filename: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    try {
      const permission = await Filesystem.checkPermissions();
      if (permission.publicStorage !== "granted") {
        await Filesystem.requestPermissions();
      }
    } catch {
      // Only matters on Android 9 and below; if the check itself errors, the
      // write below surfaces any real permission problem with a clearer message.
    }

    const base64 = await blobToBase64(blob);

    let uri: string;
    let savedToDocuments = true;
    try {
      const written = await nativeStep("writeFile(Documents)", () =>
        Filesystem.writeFile({
          path: filename,
          data: base64,
          directory: Directory.Documents,
          recursive: true,
        })
      );
      uri = written.uri;
    } catch (documentsErr) {
      // Some devices refuse writes into the public Documents folder
      // (scoped-storage / manufacturer restrictions). Fall back to the app's
      // private cache and let the share sheet deliver the file instead.
      savedToDocuments = false;
      try {
        const cached = await nativeStep("writeFile(Cache)", () =>
          Filesystem.writeFile({
            path: filename,
            data: base64,
            directory: Directory.Cache,
            recursive: true,
          })
        );
        uri = cached.uri;
      } catch (cacheErr) {
        throw new Error(`${describeExportError(documentsErr)} | ${describeExportError(cacheErr)}`);
      }
    }

    try {
      await Share.share({ title: filename, url: uri });
    } catch (shareErr) {
      const message = describeExportError(shareErr);
      // Dismissing the share sheet isn't a failure. But if the file only
      // exists in the private cache, a failed share means the user got
      // nothing, so that case must be reported.
      if (!savedToDocuments && !/cancel/i.test(message)) {
        throw new Error(`share: ${message}`);
      }
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
