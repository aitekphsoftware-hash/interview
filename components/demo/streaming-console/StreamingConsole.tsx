/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useEffect, useRef, useState } from 'react';
import { Modality } from '@google/genai';
import { useLiveAPIContext } from '../../../contexts/LiveAPIContext';
import { useSettings, useLogStore, useTools, useMedia } from '@/lib/state';
import { blobToBase64 } from '@/lib/utils';

export default function StreamingConsole() {
  const { client, connected, setConfig } = useLiveAPIContext();
  const { systemPrompt, voice } = useSettings();
  const { tools } = useTools();
  const { isCameraOn } = useMedia();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameIntervalRef = useRef<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

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

  // This effect is for sending video frames for AI analysis, it still needs the video element from the Header.
  // A cleaner approach would be to pass the videoRef down or use a context.
  // For now, we'll find it in the DOM, which is not ideal but works for this structure.
  useEffect(() => {
    const videoEl = document.querySelector(
      '.self-view-container video',
    ) as HTMLVideoElement;

    if (connected && isCameraOn && videoEl && canvasRef.current) {
      const canvasEl = canvasRef.current;
      const ctx = canvasEl.getContext('2d');

      if (!ctx) return;

      frameIntervalRef.current = window.setInterval(() => {
        if (videoEl.readyState < 2) {
          // Wait until video is ready
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
      <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
      <img
        src="https://botsrhere.online/assets/interviewer.png"
        alt="Interviewer"
        className="interviewer-view"
      />
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
