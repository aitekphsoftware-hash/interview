/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { useSettings } from "../lib/state";

export default function Header() {
  const { hrImageUrl } = useSettings();

  return (
    <header className="top-header">
      <div className="logo-placeholder"></div>
      <div className="interviewer-pip-container">
        <img
          src={hrImageUrl}
          alt="Veronica, AI Interviewer"
          className="interviewer-pip-image"
        />
        <div className="interviewer-pip-name">Veronica</div>
      </div>
    </header>
  );
}