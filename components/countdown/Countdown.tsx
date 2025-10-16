/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useRef } from 'react';
import './Countdown.css';

interface CountdownProps {
  onFinish: () => void;
}

const Countdown: React.FC<CountdownProps> = ({ onFinish }) => {
  const [count, setCount] = useState(3);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    // Play ringing sound on component mount
    if (audioRef.current) {
      audioRef.current.play().catch(error => {
        console.error("Audio playback failed:", error);
      });
    }

    if (count > 0) {
      const timer = setTimeout(() => {
        setCount(count - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      // When countdown finishes
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      onFinish();
    }
  }, [count, onFinish]);

  return (
    <div className="countdown-overlay">
      <audio 
        ref={audioRef} 
        // FIX: Replaced the previous audio source with a more reliable one to prevent loading errors.
        src="https://actions.google.com/sounds/v1/alarms/telephone_beeps.ogg" 
        loop 
      />
      <div className="countdown-timer">{count}</div>
      <div className="countdown-message">Connecting you to the interview...</div>
    </div>
  );
};

export default Countdown;