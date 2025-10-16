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
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import cn from 'classnames';
import { memo, ReactNode, useEffect, useState } from 'react';
import { AudioRecorder } from '../../../lib/audio-recorder';
import { useMedia } from '@/lib/state';
import { useLiveAPIContext } from '../../../contexts/LiveAPIContext';

export type ControlTrayProps = {
  children?: ReactNode;
};

function ControlTray({ children }: ControlTrayProps) {
  const [audioRecorder] = useState(() => new AudioRecorder());
  const { client, connected, connect, disconnect } = useLiveAPIContext();
  const { isCameraOn, isMicOn, toggleCamera, setCamera, setMic } = useMedia();

  useEffect(() => {
    if (!connected) {
      setMic(false);
      setCamera(false);
    }
  }, [connected, setMic, setCamera]);

  useEffect(() => {
    const onData = (base64: string) => {
      client.sendRealtimeInput([
        {
          mimeType: 'audio/pcm;rate=16000',
          data: base64,
        },
      ]);
    };
    if (connected && isMicOn && audioRecorder) {
      audioRecorder.on('data', onData);
      audioRecorder.start();
    } else {
      audioRecorder.stop();
    }
    return () => {
      audioRecorder.off('data', onData);
    };
  }, [connected, client, isMicOn, audioRecorder]);

  const handleConnectToggle = () => {
    if (connected) {
      disconnect();
    } else {
      connect();
      setMic(true);
      setCamera(true);
    }
  };

  const handleMicToggle = () => {
    if (connected) {
      setMic(!isMicOn);
    }
  };

  const handleCameraToggle = () => {
    if (connected) {
      toggleCamera();
    }
  };

  return (
    <section className="control-tray">
      <div className={cn('actions-nav', { connected })}>
        <button
          className="action-button"
          onClick={handleCameraToggle}
          title={isCameraOn ? 'Turn camera off' : 'Turn camera on'}
          disabled={!connected}
        >
          <span className="material-symbols-outlined filled">
            {isCameraOn ? 'videocam' : 'videocam_off'}
          </span>
        </button>
        <button
          className={cn('action-button mic-button', { active: isMicOn })}
          onClick={handleMicToggle}
          title={isMicOn ? 'Mute microphone' : 'Unmute microphone'}
          disabled={!connected}
        >
          <span className="material-symbols-outlined filled">
            {isMicOn ? 'mic' : 'mic_off'}
          </span>
        </button>
        <button
          className="action-button end-call-button"
          onClick={handleConnectToggle}
          title={connected ? 'End call' : 'Start call'}
        >
          <span className="material-symbols-outlined filled">
            {connected ? 'call_end' : 'play_arrow'}
          </span>
        </button>
      </div>
    </section>
  );
}

export default memo(ControlTray);
