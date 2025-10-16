/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import './PopUp.css';

interface PopUpProps {
  onClose: () => void;
}

const PopUp: React.FC<PopUpProps> = ({ onClose }) => {
  return (
    <div className="popup-overlay">
      <div className="popup-content">
        <h2>Welcome to the AI Interview Platform</h2>
        <p>Experience the future of hiring with a simulated interview conducted by a Gemini-powered AI assistant.</p>
        <p>To get started:</p>
        <ol>
          <li><span className="icon">play_circle</span>Press the Play button to start the session.</li>
          <li><span className="icon">mic</span>When the AI greets you, state your name and the role you are applying for.</li>
          <li><span className="icon">question_answer</span>Answer the interview questions naturally.</li>
        </ol>
        <button onClick={onClose}>Begin Interview</button>
      </div>
    </div>
  );
};

export default PopUp;