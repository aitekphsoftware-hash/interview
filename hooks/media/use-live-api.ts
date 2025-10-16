/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law of a F'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GenAILiveClient } from '../../lib/genai-live-client';
import { LiveConnectConfig, Modality, LiveServerToolCall } from '@google/genai';
import { AudioStreamer } from '../../lib/audio-streamer';
import { audioContext } from '../../lib/utils';
import VolMeterWorket from '../../lib/worklets/vol-meter';
import { useLogStore, useSettings, useAppEvents, useMedia } from '@/lib/state';

export type UseLiveApiResults = {
  client: GenAILiveClient;
  setConfig: (config: LiveConnectConfig) => void;
  config: LiveConnectConfig;

  connect: () => Promise<void>;
  disconnect: () => void;
  connected: boolean;

  volume: number;
};

export function useLiveApi({
  apiKey,
}: {
  apiKey: string;
}): UseLiveApiResults {
  const { model } = useSettings();
  const { setMic, micWasInterrupted } = useMedia();
  const client = useMemo(() => new GenAILiveClient(apiKey, model), [apiKey, model]);

  const audioStreamerRef = useRef<AudioStreamer | null>(null);

  const [volume, setVolume] = useState(0);
  const [connected, setConnected] = useState(false);
  const [config, setConfig] = useState<LiveConnectConfig>({});

  // register audio for streaming server -> speakers
  useEffect(() => {
    const setupAudioStreamer = (audioCtx: AudioContext) => {
      const streamer = new AudioStreamer(audioCtx);
      streamer.onComplete = () => {
        client.signalAgentSpeechEnd();
      };
      streamer
        .addWorklet<any>('vumeter-out', VolMeterWorket, (ev: any) => {
          setVolume(ev.data.volume);
        })
        .catch(err => {
          console.error('Error adding worklet:', err);
        });
      audioStreamerRef.current = streamer;
    };
  
    if (!audioStreamerRef.current) {
      audioContext({ id: 'audio-out' }).then(setupAudioStreamer);
    } else {
      // Ensure onComplete is always up-to-date with the latest client instance
      audioStreamerRef.current.onComplete = () => {
        client.signalAgentSpeechEnd();
      };
    }
  }, [client]);

  useEffect(() => {
    const onOpen = () => {
      setConnected(true);
    };

    const onClose = () => {
      setConnected(false);
    };

    const stopAudioStreamer = () => {
      if (audioStreamerRef.current) {
        audioStreamerRef.current.stop();
      }
    };

    const onAudio = (data: ArrayBuffer) => {
      // Re-enable mic if it was interrupted by the system
      if (micWasInterrupted) {
        console.log("AI is speaking, re-enabling microphone.");
        setMic(true, false);
      }
      if (audioStreamerRef.current) {
        audioStreamerRef.current.addPCM16(new Uint8Array(data));
      }
    };

    // Bind event listeners
    client.on('open', onOpen);
    client.on('close', onClose);
    client.on('interrupted', stopAudioStreamer);
    client.on('audio', onAudio);

    const onToolCall = (toolCall: LiveServerToolCall) => {
      const functionResponses: any[] = [];
      const { triggerSnapshot } = useAppEvents.getState(); // Get trigger function

      for (const fc of toolCall.functionCalls) {
        let triggerMessage: string;

        // Special handling for the interview summary to format it nicely
        if (fc.name === 'provide_interview_summary') {
          const { summary, recommendation } = fc.args;
          triggerMessage = `**Interview Complete**\n\n**Summary:**\n${summary}\n\n**Recommendation:** ${recommendation}`;
        } else if (fc.name === 'take_snapshot') {
          triggerMessage = `System: Taking snapshot. Reason: ${fc.args.reason}`;
          triggerSnapshot(); // Trigger the snapshot effect
        } else {
          // Generic handler for other function calls
          triggerMessage = `Triggering function call: **${
            fc.name
          }**\n\`\`\`json\n${JSON.stringify(fc.args, null, 2)}\n\`\`\``;
        }

        useLogStore.getState().addTurn({
          role: 'system',
          text: triggerMessage,
          isFinal: true,
        });

        // Prepare the response
        functionResponses.push({
          id: fc.id,
          name: fc.name,
          response: { result: 'ok' }, // simple, hard-coded function response
        });
      }

      // Log the function call response
      if (functionResponses.length > 0) {
        const responseMessage = `Function call response:\n\`\`\`json\n${JSON.stringify(
          functionResponses,
          null,
          2,
        )}\n\`\`\``;
        useLogStore.getState().addTurn({
          role: 'system',
          text: responseMessage,
          isFinal: true,
        });
      }

      client.sendToolResponse({ functionResponses: functionResponses });
    };

    client.on('toolcall', onToolCall);

    return () => {
      // Clean up event listeners
      client.off('open', onOpen);
      client.off('close', onClose);
      client.off('interrupted', stopAudioStreamer);
      client.off('audio', onAudio);
      client.off('toolcall', onToolCall);
    };
  }, [client, micWasInterrupted, setMic]);

  const connect = useCallback(async () => {
    if (!config) {
      throw new Error('config has not been set');
    }
    // FIX: Add a guard to ensure the configuration is fully populated before
    // attempting to connect. This resolves a race condition on the initial
    // interview load where `connect()` could be called with an empty config,
    // leading to a "non-audio request" error from the API.
    if (!config.responseModalities || (config.responseModalities as any[]).length === 0) {
      console.warn('Live API config not ready, delaying connection attempt.');
      return;
    }
    client.disconnect();
    await client.connect(config);
  }, [client, config]);

  const disconnect = useCallback(async () => {
    client.disconnect();
    setConnected(false);
  }, [setConnected, client]);

  return {
    client,
    config,
    setConfig,
    connect,
    connected,
    disconnect,
    volume,
  };
}