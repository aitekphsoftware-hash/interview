/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
export default function Header() {
  return (
    <header>
      <div className="header-left">
        <h1>AI Interview Assistant</h1>
      </div>
      <div className="header-right">
        <img
          src="https://source.unsplash.com/250x250/?portrait,professional"
          alt="Interviewer"
          className="employer-avatar"
        />
      </div>
    </header>
  );
}
