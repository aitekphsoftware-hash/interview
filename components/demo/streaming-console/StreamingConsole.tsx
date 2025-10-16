/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useEffect, useRef, useState } from 'react';
import { Modality } from '@google/genai';
import { useLiveAPIContext } from '../../../contexts/LiveAPIContext';
import { useSettings, useLogStore, useTools, useMedia, useAppEvents } from '@/lib/state';
import { blobToBase64 } from '@/lib/utils';
import { useCamera } from '@/hooks/media/useCamera';
import cn from 'classnames';

export default function StreamingConsole() {
  const { client, connected, setConfig } = useLiveAPIContext();
  const { systemPrompt, voice } = useSettings();
  const { tools } = useTools();
  const { isCameraOn } = useMedia();
  const { snapshotTriggered } = useAppEvents();
  const [showSnapshotFlash, setShowSnapshotFlash] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameIntervalRef = useRef<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Hook to manage camera stream
  useCamera(videoRef, isCameraOn);

  // Effect for the real-time call timer
  useEffect(() => {
    let timerId: number | undefined;

    // Start the timer only when connected
    if (connected) {
      setElapsedTime(0); // Reset timer on new connection
      timerId = window.setInterval(() => {
        setElapsedTime(prevTime => prevTime + 1);
      }, 1000);
    }

    // Cleanup function to clear the interval
    return () => {
      if (timerId) {
        clearInterval(timerId);
      }
    };
  }, [connected]); // Rerun effect when connection status changes

  // Helper function to format seconds into MM:SS
  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60)
      .toString()
      .padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  // Effect for taking a snapshot
  useEffect(() => {
    // A snapshot can only be taken if the effect is triggered and the camera is on.
    if (snapshotTriggered > 0 && isCameraOn) {
      if (videoRef.current && canvasRef.current) {
        const videoEl = videoRef.current;
        const canvasEl = canvasRef.current;
        const ctx = canvasEl.getContext('2d');
        if (!ctx) return;

        // Draw the current video frame to the canvas.
        // The video element is visually mirrored via CSS, but drawImage captures the original, un-mirrored frame.
        // This is correct for an identification snapshot.
        canvasEl.width = videoEl.videoWidth;
        canvasEl.height = videoEl.videoHeight;
        ctx.drawImage(videoEl, 0, 0, videoEl.videoWidth, videoEl.videoHeight);

        // Get the image data. For this demo, we'll just log it to the console.
        // In a real application, this would be sent to a secure server.
        const imageDataUrl = canvasEl.toDataURL('image/jpeg', 0.8);
        console.log('Snapshot taken:', imageDataUrl.substring(0, 80) + '...');

        // Trigger visual flash effect
        setShowSnapshotFlash(true);
        setTimeout(() => setShowSnapshotFlash(false), 300);
      }
    }
  }, [snapshotTriggered, isCameraOn]);


  // Effect for sending video frames
  useEffect(() => {
    if (connected && isCameraOn && videoRef.current && canvasRef.current) {
      const videoEl = videoRef.current;
      const canvasEl = canvasRef.current;
      const ctx = canvasEl.getContext('2d');

      if (!ctx) return;

      frameIntervalRef.current = window.setInterval(() => {
        if (videoEl.readyState < 2) {
          return;
        }
        canvasEl.width = videoEl.videoWidth;
        canvasEl.height = videoEl.videoHeight;
        ctx.drawImage(videoEl, 0, 0, videoEl.videoWidth, videoEl.videoHeight);
        canvasEl.toBlob(
          async blob => {
            if (blob) {
              const base64Data = await blobToBase64(blob);
              client.sendRealtimeInput([
                { data: base64Data, mimeType: 'image/jpeg' },
              ]);
            }
          },
          'image/jpeg',
          0.8, // quality
        );
      }, 1000); // Send one frame per second
    }

    return () => {
      if (frameIntervalRef.current) {
        clearInterval(frameIntervalRef.current);
        frameIntervalRef.current = null;
      }
    };
  }, [connected, isCameraOn, client, canvasRef]);

  useEffect(() => {
    const enabledTools = tools
      .filter(tool => tool.isEnabled)
      .map(tool => ({
        functionDeclarations: [
          {
            name: tool.name,
            description: tool.description,
            parameters: tool.parameters,
          },
        ],
      }));
    const config: any = {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } },
      },
      inputAudioTranscription: {},
      outputAudioTranscription: {},
      systemInstruction: { parts: [{ text: systemPrompt }] },
      tools: enabledTools,
    };
    setConfig(config);
  }, [setConfig, systemPrompt, tools, voice]);

  useEffect(() => {
    const { addTurn, updateLastTurn } = useLogStore.getState();

    const handleInputTranscription = (text: string, isFinal: boolean) => {
      const turns = useLogStore.getState().turns;
      const last = turns[turns.length - 1];
      if (last && last.role === 'user' && !last.isFinal) {
        updateLastTurn({ text: last.text + text, isFinal });
      } else {
        addTurn({ role: 'user', text, isFinal });
      }
    };

    const handleOutputTranscription = (text: string, isFinal: boolean) => {
      const turns = useLogStore.getState().turns;
      const last = turns[turns.length - 1];
      if (last && last.role === 'agent' && !last.isFinal) {
        updateLastTurn({ text: last.text + text, isFinal });
      } else {
        addTurn({ role: 'agent', text, isFinal });
      }
    };

    const handleTurnComplete = () => {
      const last = useLogStore.getState().turns.at(-1);
      if (last && !last.isFinal) {
        updateLastTurn({ isFinal: true });
      }
    };

    client.on('inputTranscription', handleInputTranscription);
    client.on('outputTranscription', handleOutputTranscription);
    client.on('turncomplete', handleTurnComplete);

    return () => {
      client.off('inputTranscription', handleInputTranscription);
      client.off('outputTranscription', handleOutputTranscription);
      client.off('turncomplete', handleTurnComplete);
    };
  }, [client]);

  return (
    <div className="video-call-container">
      {showSnapshotFlash && <div className="snapshot-flash"></div>}
      <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
      <video ref={videoRef} muted autoPlay playsInline></video>
      {!isCameraOn && (
        <div className="camera-off-overlay">
          <span className="material-symbols-outlined">videocam_off</span>
          <p>Your camera is off</p>
        </div>
      )}
      <div className="interviewer-info">
        <div className="info-text">
          <p className="interviewer-title">AI Interview Specialist</p>
          <h2 className="interviewer-name">Veronica</h2>
        </div>
        <div className="call-timer">
          <span className="recording-dot"></span>
          <span>{formatTime(elapsedTime)}</span>
        </div>
      </div>
    </div>
  );
}