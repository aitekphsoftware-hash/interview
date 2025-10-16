/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useEffect, useRef, useState } from 'react';
import { Modality } from '@google/genai';
import { useLiveAPIContext } from '../../../contexts/LiveAPIContext';
import { useSettings, useLogStore, useTools, useMedia, useAppEvents } from '../../../lib/state';
import { blobToBase64 } from '../../../lib/utils';
import { useCamera } from '../../../hooks/media/useCamera';

export default function StreamingConsole() {
  const { client, connected, disconnect, setConfig } = useLiveAPIContext();
  const { systemPrompt, voice } = useSettings();
  const { tools } = useTools();
  const { isCameraOn, isMicOn, setMic } = useMedia();
  const { snapshotTriggered } = useAppEvents();
  const [showSnapshotFlash, setShowSnapshotFlash] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameIntervalRef = useRef<number | null>(null);
  const interruptionTimerRef = useRef<number | null>(null);
  const silencePromptTimerRef = useRef<number | null>(null);
  const silenceDisconnectTimerRef = useRef<number | null>(null);
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
    if (snapshotTriggered > 0 && isCameraOn) {
      if (videoRef.current && canvasRef.current) {
        const videoEl = videoRef.current;
        const canvasEl = canvasRef.current;
        const ctx = canvasEl.getContext('2d');
        if (!ctx) return;

        // Draw the current video frame to the canvas for the snapshot
        canvasEl.width = videoEl.videoWidth;
        canvasEl.height = videoEl.videoHeight;
        ctx.drawImage(videoEl, 0, 0, videoEl.videoWidth, videoEl.videoHeight);

        // Convert the snapshot to a blob and send it to the AI
        canvasEl.toBlob(
          async blob => {
            if (blob) {
              const base64Data = await blobToBase64(blob);
              client.sendRealtimeInput([
                { data: base64Data, mimeType: 'image/jpeg' },
              ]);
              console.log('Snapshot taken and sent to AI.');
            }
          },
          'image/jpeg',
          0.9, // Higher quality for snapshot
        );

        // Trigger visual flash effect
        setShowSnapshotFlash(true);
        setTimeout(() => setShowSnapshotFlash(false), 300);
      }
    }
  }, [snapshotTriggered, isCameraOn, client]);


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

  const clearSilenceTimers = () => {
    if (silencePromptTimerRef.current) {
      clearTimeout(silencePromptTimerRef.current);
      silencePromptTimerRef.current = null;
    }
    if (silenceDisconnectTimerRef.current) {
      clearTimeout(silenceDisconnectTimerRef.current);
      silenceDisconnectTimerRef.current = null;
    }
  };

  useEffect(() => {
    const { addTurn, updateLastTurn } = useLogStore.getState();

    const handleInputTranscription = (text: string, isFinal: boolean) => {
      clearSilenceTimers(); // Clear silence timers as soon as user speaks
      const turns = useLogStore.getState().turns;
      const last = turns[turns.length - 1];
      if (last && last.role === 'user' && !last.isFinal) {
        updateLastTurn({ text: last.text + text, isFinal });
      } else {
        addTurn({ role: 'user', text, isFinal });
      }

      // Set/reset the long-speech interruption timer whenever the user speaks
      if (interruptionTimerRef.current) {
        clearTimeout(interruptionTimerRef.current);
      }
      interruptionTimerRef.current = window.setTimeout(() => {
        console.log("User has been speaking for too long. AI taking turn.");
        setMic(false, true); // Interrupt the mic
      }, 30000); // 30 seconds
    };

    const handleOutputTranscription = (text: string, isFinal: boolean) => {
      const turns = useLogStore.getState().turns;
      const last = turns[turns.length - 1];
      
      // Clear any pending user interruption timer as the agent is now speaking
      if (interruptionTimerRef.current) {
        clearTimeout(interruptionTimerRef.current);
        interruptionTimerRef.current = null;
      }

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
      // A turn is complete, so clear any pending interruption timer
      if (interruptionTimerRef.current) {
        clearTimeout(interruptionTimerRef.current);
        interruptionTimerRef.current = null;
      }
    };

    const handleAgentSpeechEnd = () => {
      console.log('Agent speech ended. Starting silence timers.');
      clearSilenceTimers(); // Clear any existing timers first

      // After 10s of silence, send a cue to Veronica
      silencePromptTimerRef.current = window.setTimeout(() => {
        console.log('10 seconds of silence detected. Sending cue to AI.');
        const cueCanvas = document.createElement('canvas');
        cueCanvas.width = 320;
        cueCanvas.height = 240;
        const ctx = cueCanvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = 'black';
          ctx.fillRect(0, 0, cueCanvas.width, cueCanvas.height);
          ctx.fillStyle = 'white';
          ctx.font = '14px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('SYSTEM CUE: USER IS SILENT', cueCanvas.width / 2, cueCanvas.height / 2);
          cueCanvas.toBlob(async (blob) => {
            if (blob) {
              const base64Data = await blobToBase64(blob);
              client.sendRealtimeInput([{ data: base64Data, mimeType: 'image/jpeg' }]);
            }
          }, 'image/jpeg');
        }
      }, 10000); // 10 seconds

      // After 30s of silence, end the call
      silenceDisconnectTimerRef.current = window.setTimeout(() => {
        console.log('30 seconds of silence detected. Ending interview.');
        disconnect();
      }, 30000); // 30 seconds
    };

    client.on('inputTranscription', handleInputTranscription);
    client.on('outputTranscription', handleOutputTranscription);
    client.on('turncomplete', handleTurnComplete);
    client.on('agentSpeechEnd', handleAgentSpeechEnd);


    return () => {
      client.off('inputTranscription', handleInputTranscription);
      client.off('outputTranscription', handleOutputTranscription);
      client.off('turncomplete', handleTurnComplete);
      client.off('agentSpeechEnd', handleAgentSpeechEnd);
      if (interruptionTimerRef.current) {
        clearTimeout(interruptionTimerRef.current);
      }
      clearSilenceTimers();
    };
  }, [client, setMic, disconnect]);

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
      {connected && !isMicOn && (
        <div className="mute-indicator">
          <span className="material-symbols-outlined">mic_off</span>
          <p>You are muted</p>
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