/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useEffect, useRef } from 'react';
import cn from 'classnames';
import { useLogStore, useUI } from '../../lib/state';
import { marked } from 'marked';

const TranscriptView: React.FC = () => {
  const { isTranscriptOpen, toggleTranscript } = useUI();
  const { turns } = useLogStore();
  const endOfTranscriptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to the bottom whenever new turns are added
    if (endOfTranscriptRef.current) {
      endOfTranscriptRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [turns]);

  // A simple markdown parser, without sanitization (use with caution on user input)
  const parseMarkdown = (text: string) => {
    try {
      // Basic markdown for bold and code blocks
      const html = marked.parse(text, { gfm: true, breaks: true });
      return { __html: html };
    } catch (e) {
      return { __html: text }; // Fallback to plain text
    }
  };


  return (
    <div className={cn('transcript-overlay', { open: isTranscriptOpen })}>
      <div className="transcript-header">
        <h3>Interview Transcript</h3>
        <button onClick={toggleTranscript} className="close-button">
          <span className="icon">close</span>
        </button>
      </div>
      <div className="transcript-content">
        {turns.map((turn, index) => (
          <div key={index} className={cn('turn', `turn-${turn.role}`)}>
            <div className="turn-bubble">
              <span className="turn-role">
                {turn.role === 'agent' ? 'Veronica' : turn.role === 'user' ? 'You' : 'System'}
              </span>
              <div
                className="turn-text"
                dangerouslySetInnerHTML={parseMarkdown(turn.text)}
              />
            </div>
          </div>
        ))}
        <div ref={endOfTranscriptRef} />
      </div>
    </div>
  );
};

export default TranscriptView;