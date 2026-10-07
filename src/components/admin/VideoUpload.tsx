"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as tus from "tus-js-client";

export type VideoUploadState =
  | { status: "idle" }
  | { status: "uploading"; fileName: string; progress: number }
  | { status: "done"; fileName: string }
  | { status: "error"; message: string };

export function titleFromFileName(fileName: string): string {
  return fileName
    .replace(/\.[^.]+$/, "")
    .replace(/[_-]+/g, " ")
    .trim();
}

// Uploads a video file from the Studio straight to Bunny Stream (resumable, so
// a dropped connection carries on instead of restarting). An upload that never
// gets saved on a project (cancelled, replaced, form closed) is deleted again.
export function useVideoUpload() {
  const [state, setState] = useState<VideoUploadState>({ status: "idle" });
  const uploadRef = useRef<{ abort(): Promise<void> } | null>(null);
  const unsavedIdRef = useRef<string | null>(null);

  const drop = useCallback(() => {
    uploadRef.current?.abort().catch(() => {});
    uploadRef.current = null;
    const id = unsavedIdRef.current;
    unsavedIdRef.current = null;
    if (id) fetch(`/api/video-uploads/${id}`, { method: "DELETE", keepalive: true }).catch(() => {});
  }, []);

  useEffect(() => drop, [drop]);

  // Resolves with the video's player URL as soon as the upload has started, so
  // the form can be filled in while the file is still going up.
  async function start(file: File): Promise<string | null> {
    drop();
    setState({ status: "uploading", fileName: file.name, progress: 0 });

    try {
      const res = await fetch("/api/video-uploads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: titleFromFileName(file.name) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setState({ status: "error", message: data.error ?? "Couldn't start the upload. Try again." });
        return null;
      }
      unsavedIdRef.current = data.videoId;

      const upload = new tus.Upload(file, {
        endpoint: data.endpoint,
        headers: data.headers,
        metadata: { filetype: file.type, title: titleFromFileName(file.name) },
        retryDelays: [0, 3000, 5000, 10000, 20000, 60000, 60000],
        storeFingerprintForResuming: false,
        onProgress: (sent, total) => {
          if (uploadRef.current !== upload) return;
          setState({ status: "uploading", fileName: file.name, progress: total ? sent / total : 0 });
        },
        onSuccess: () => {
          if (uploadRef.current !== upload) return;
          setState({ status: "done", fileName: file.name });
        },
        onError: () => {
          if (uploadRef.current !== upload) return;
          drop();
          setState({ status: "error", message: "The upload failed. Check your connection and try again." });
        },
      });
      uploadRef.current = upload;
      upload.start();
      return data.url;
    } catch {
      drop();
      setState({ status: "error", message: "Couldn't start the upload. Try again." });
      return null;
    }
  }

  function discard() {
    drop();
    setState({ status: "idle" });
  }

  // Call once the project holding the video is saved, so it's kept.
  function commit() {
    uploadRef.current = null;
    unsavedIdRef.current = null;
    setState({ status: "idle" });
  }

  return { state, start, discard, commit };
}

export function VideoUploadStatus({ state }: { state: VideoUploadState }) {
  if (state.status === "uploading") {
    const percent = Math.round(state.progress * 100);
    return (
      <div className="upload-status">
        <span className="hint">
          Uploading {state.fileName}… {percent}%
        </span>
        <progress value={state.progress} max={1} />
      </div>
    );
  }
  if (state.status === "done") {
    return (
      <div className="upload-status">
        <span className="hint">
          Uploaded {state.fileName}. It plays on the site once it has finished processing, usually within a
          few minutes.
        </span>
      </div>
    );
  }
  if (state.status === "error") return <div className="error-text">{state.message}</div>;
  return null;
}
