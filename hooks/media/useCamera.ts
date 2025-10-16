/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useEffect, useRef } from 'react';

export function useCamera(
  videoRef: React.RefObject<HTMLVideoElement>,
  enabled: boolean
) {
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    async function getCameraStream() {
      if (!enabled || !videoRef.current) {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
          if (videoRef.current) {
            videoRef.current.srcObject = null;
          }
        }
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
      }
    }

    getCameraStream();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [enabled, videoRef]);
}