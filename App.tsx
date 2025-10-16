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
import Sidebar from './components/Sidebar';
import ExploreModal from './components/explore/ExploreModal';
import TranscriptView from './components/transcript/TranscriptView';
import { LiveAPIProvider } from './contexts/LiveAPIContext';
import { useUI } from './lib/state';
import { marked } from 'marked';

// Required for transcript markdown parsing
import('https://cdn.jsdelivr.net/npm/marked/lib/marked.umd.js');

const API_KEY = process.env.API_KEY as string;
if (typeof API_KEY !== 'string') {
  throw new Error('Missing required environment variable: API_KEY');
}

/**
 * Main application component that provides a streaming interface for Live API.
 * Manages video streaming state and provides controls for webcam/screen capture.
 */
function App() {
  const { toggleDevMode } = useUI();
  const [interviewActive, setInterviewActive] = useState(false);

  useEffect(() => {
    let keySequence = '';
    const secretCode = '120221';

    const handleKeyDown = (event: KeyboardEvent) => {
      keySequence += event.key;
      if (keySequence.length > secretCode.length) {
        keySequence = keySequence.slice(-secretCode.length);
      }
      if (keySequence === secretCode) {
        toggleDevMode();
        keySequence = ''; // Reset after activation
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [toggleDevMode]);

  return (
    <div className="App">
      <ErrorScreen />
      <Sidebar
        interviewActive={interviewActive}
        onStartInterview={() => setInterviewActive(true)}
      />
      <ExploreModal />
      <TranscriptView />
      <main className="main-app-area">
        {!interviewActive && (
          <div className="welcome-screen">
             <div className="welcome-content">
              <span className="welcome-icon">edit_note</span>
              <h1>Welcome to the Interview</h1>
              <p>
                Fill out the applicant's details in the sidebar to begin.
              </p>
             </div>
          </div>
        )}
        <StreamingConsole />
        <ControlTray />
      </main>
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