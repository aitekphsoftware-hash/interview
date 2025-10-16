/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useRef } from 'react';
import { useCamera } from '../hooks/media/useCamera';
import { useMedia } from '../lib/state';

export default function Header() {
  const { isCameraOn } = useMedia();
  const videoRef = useRef<HTMLVideoElement>(null);
  useCamera(videoRef, isCameraOn);

  return (
    <div className="top-controls">
      <button className="back-button" aria-label="Go back">
        <span className="material-symbols-outlined">chevron_left</span>
      </button>
      <div className="self-view-container">
        <video ref={videoRef} muted autoPlay playsInline></video>
        {!isCameraOn && (
          <div className="camera-off-overlay-small">
            <span className="material-symbols-outlined">videocam_off</span>
          </div>
        )}
        <button className="resize-button" aria-label="Enlarge self view">
          <span className="material-symbols-outlined">north_east</span>
        </button>
      </div>
    </div>
  );
}