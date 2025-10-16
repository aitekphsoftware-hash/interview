/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useEffect, useRef } from 'react';
import cn from 'classnames';
import { Modality, LiveServerContent } from '@google/genai';
import { useCamera } from '../../../hooks/media/useCamera';
import { useLiveAPIContext } from '../../../contexts/LiveAPIContext';
import { useSettings, useLogStore, useTools, useMedia } from '@/lib/state';

const renderContent = (text: string) => {
  const parts = text.split(/(`{3}json\n[\s\S]*?\n`{3})/g);
  return parts.map((part, index) => {
    if (part.startsWith('```json')) {
      const jsonContent = part.replace(/^`{3}json\n|`{3}$/g, '');
      return (
        <pre key={index}>
          <code>{jsonContent}</code>
        </pre>
      );
    }
    const boldParts = part.split(/(\*\*.*?\*\*)/g);
    return boldParts.map((boldPart, boldIndex) => {
      if (boldPart.startsWith('**') && boldPart.endsWith('**')) {
        return <strong key={boldIndex}>{boldPart.slice(2, -2)}</strong>;
      }
      return boldPart;
    });
  });
};

export default function StreamingConsole() {
  const { client, connected, setConfig } = useLiveAPIContext();
  const { systemPrompt, voice } = useSettings();
  const { tools } = useTools();
  const { isCameraOn } = useMedia();
  const turns = useLogStore(state => state.turns);
  const videoRef = useRef<HTMLVideoElement>(null);
  useCamera(videoRef, isCameraOn);

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

    const handleContent = (serverContent: LiveServerContent) => {
      const text =
        serverContent.modelTurn?.parts
          ?.map((p: any) => p.text)
          .filter(Boolean)
          .join(' ') ?? '';
      if (!text) return;
      const turns = useLogStore.getState().turns;
      const last = turns.at(-1);
      if (last?.role === 'agent' && !last.isFinal) {
        updateLastTurn({ text: last.text + text });
      } else {
        addTurn({ role: 'agent', text, isFinal: false });
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
    client.on('content', handleContent);
    client.on('turncomplete', handleTurnComplete);

    return () => {
      client.off('inputTranscription', handleInputTranscription);
      client.off('outputTranscription', handleOutputTranscription);
      client.off('content', handleContent);
      client.off('turncomplete', handleTurnComplete);
    };
  }, [client]);

  return (
    <div className="video-call-container">
      <div className="self-view-container">
        <video ref={videoRef} muted autoPlay playsInline></video>
        {!isCameraOn && (
          <div className="camera-off-overlay">
            <span className="icon">videocam_off</span>
          </div>
        )}
      </div>
    </div>
  );
}