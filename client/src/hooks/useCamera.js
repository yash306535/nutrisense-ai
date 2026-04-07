import { useState, useRef, useCallback } from 'react';

/**
 * Hook for accessing the device camera via getUserMedia.
 */
export function useCamera() {
  const [stream, setStream] = useState(null);
  const [hasCamera, setHasCamera] = useState(null);
  const [error, setError] = useState(null);
  const videoRef = useRef(null);

  const startCamera = useCallback(async (facingMode = 'environment') => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      setStream(mediaStream);
      setHasCamera(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }
      return mediaStream;
    } catch (err) {
      setError(err.message);
      setHasCamera(false);
      return null;
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
  }, [stream]);

  /**
   * Capture a frame from the video element as a Blob.
   * @returns {Promise<Blob|null>}
   */
  const captureFrame = useCallback(() => {
    if (!videoRef.current) return null;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
    return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));
  }, []);

  return { videoRef, stream, hasCamera, error, startCamera, stopCamera, captureFrame };
}
