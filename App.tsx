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
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { useEffect, useState } from 'react';
import ControlTray from './components/console/control-tray/ControlTray';
import ErrorScreen from './components/demo/ErrorScreen';
import StreamingConsole from './components/demo/streaming-console/StreamingConsole';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import StartForm from './components/form/StartForm';
import Countdown from './components/countdown/Countdown';
import { LiveAPIProvider, useLiveAPIContext } from './contexts/LiveAPIContext';
import { useMedia, useSettings, useUI } from './lib/state';

const API_KEY = process.env.API_KEY as string;
if (typeof API_KEY !== 'string') {
  throw new Error('Missing required environment variable: API_KEY');
}

type AppState = 'form' | 'countdown' | 'interview';

/**
 * Main application component that provides a streaming interface for Live API.
 * Manages video streaming state and provides controls for webcam/screen capture.
 */
function App() {
  const { toggleSidebar } = useUI();
  const [appState, setAppState] = useState<AppState>('form');

  const { connect } = useLiveAPIContext();
  const { setCamera, setMic } = useMedia();

  useEffect(() => {
    let keySequence = '';
    const secretCode = '120221';

    const handleKeyDown = (event: KeyboardEvent) => {
      keySequence += event.key;
      if (keySequence.length > secretCode.length) {
        keySequence = keySequence.slice(-secretCode.length);
      }
      if (keySequence === secretCode) {
        toggleSidebar();
        keySequence = ''; // Reset after activation
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [toggleSidebar]);

  const { setSystemPromptWithData } = useSettings.getState();
  const { isCameraOn } = useMedia.getState();

  const handleFormSubmit = (data: Record<string, string>) => {
    setSystemPromptWithData(data, isCameraOn); // Pass initial camera state
    setAppState('countdown');
  };

  const handleCountdownFinish = () => {
    setAppState('interview');
    // Connect automatically when the interview screen is shown
    connect();
    setMic(true);
    // We ask for camera to be true, the AI will prompt if it's not enabled.
    setCamera(true);
  };

  return (
    <div className="App">
      <LiveAPIProvider apiKey={API_KEY}>
        <ErrorScreen />
        {appState === 'form' && <StartForm onSubmit={handleFormSubmit} />}
        {appState === 'countdown' && (
          <Countdown onFinish={handleCountdownFinish} />
        )}
        {appState === 'interview' && (
          <>
            <Sidebar />
            <main className="main-app-area">
              <StreamingConsole />
              <Header />
              <ControlTray />
            </main>
          </>
        )}
      </LiveAPIProvider>
    </div>
  );
}

function AppWrapper() {
  const API_KEY = process.env.API_KEY as string;
  if (typeof API_KEY !== 'string') {
    throw new Error('Missing required environment variable: API_KEY');
  }
  return (
    <LiveAPIProvider apiKey={API_KEY}>
      <App />
    </LiveAPIProvider>
  );
}

export default AppWrapper;