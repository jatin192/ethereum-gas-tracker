import React, { useState, useEffect } from 'react';
import './css/Footer.css';

let Footer = () => {
  let [starCount, setStarCount] = useState(() => {
    let savedCount = localStorage.getItem('starCount');
    return savedCount ? parseInt(savedCount, 10) : 0;
  });

  let [hasStarred, setHasStarred] = useState(() => {
    return localStorage.getItem('hasStarred') === 'true';
  });

  let handleStarClick = () => {
    if (!hasStarred) {
      let newCount = starCount + 1;
      setStarCount(newCount);
      localStorage.setItem('starCount', newCount);
      setHasStarred(true);
      localStorage.setItem('hasStarred', 'true');
    }
  };

  return (
    <div className="footer-container">
      <div className="footer-content">
        {/* Left side */}
        <div className="footer-left">
          <div className="project-tag">
            Free Open Source Gas Tracker
          </div>
          <div className="project-title">
            Ethereum Gas Tracker
          </div>
          <div className="footer-buttons">
            <a href="https://github.com/0xmetaschool/ethereum-gas-tracker/fork" 
               className="fork-button">
              Fork and Build Your Own
            </a>
            <div className="star-button-container">
              <button 
                className="star-button" 
                onClick={handleStarClick}
                disabled={hasStarred}
              >
                <svg viewBox="0 0 16 16" width="16" height="16">
                  <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z" />
                </svg>
                Star
              </button>
              <div className="star-count">{starCount}</div>
            </div>
          </div>
        </div>

        {/* Right side */}
        <div className="footer-right">
          <div className="made-with-love">
            <span>MADE WITH</span>
            <span className="heart">♥</span>
            <span>BY</span>
            <div className="creator">
              <span className="creator-name">metaschool</span>
            </div>
          </div>
          <div className="social-links">
            <span>Follow us on</span>
            <div className="social-icons">
              <a href="https://discord.com/invite/vbVMUwXWgc" target="_blank" rel="noopener noreferrer">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
              </a>

              <a href="https://x.com/0xmetaschool" target="_blank" rel="noopener noreferrer">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a href="https://www.linkedin.com/company/0xmetaschool/" target="_blank" rel="noopener noreferrer">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
                <path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19a.66.66 0 000 .14V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Footer;
