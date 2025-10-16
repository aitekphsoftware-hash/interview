/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { useSettings } from "@/lib/state";

export default function Header() {
  const { hrImageUrl } = useSettings();

  return (
    <div className="top-controls">
      {/* This button is currently for layout purposes */}
      <div style={{ width: 40, height: 40 }} />
      <div className="interviewer-pip-container">
        <img
          src={hrImageUrl}
          alt="Veronica, AI Interviewer"
        />
        <div className="interviewer-pip-name">Veronica</div>
      </div>
    </div>
  );
}