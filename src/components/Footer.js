import React, { useState, useEffect } from 'react';
import './Footer.css';

const Footer = () => {
  const [footerConfig, setFooterConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadFooterConfig = async () => {
      try {
        const response = await fetch('/data/footer-config.json');
        if (!response.ok) {
          throw new Error('Failed to load footer configuration');
        }
        const config = await response.json();
        setFooterConfig(config);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    loadFooterConfig();
  }, []);

  if (loading) {
    return null; // Don't show anything while loading
  }

  if (error || !footerConfig) {
    return null; // Don't show anything if error
  }

  return (
    <footer className="site-footer">
      <div className="footer-container">
        {/* Main footer columns */}
        <div className="footer-columns">
          {footerConfig.columns.map((column) => (
            <div key={column.id} className="footer-column">
              <h3 className="footer-column-title">{column.title}</h3>
              <ul className="footer-links">
                {column.links.map((link, index) => (
                  <li key={index} className="footer-link-item">
                    <a href={link.url} className="footer-link">
                      {link.text}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Company info column */}
          <div className="footer-column footer-company">
            {footerConfig.companyInfo.websites.map((website, index) => (
              <div key={index} className="footer-website">
                {website}
              </div>
            ))}
            <div className="footer-trademark">
              {footerConfig.companyInfo.trademark}
            </div>
            <div className="footer-additional">
              {footerConfig.companyInfo.additionalText}
            </div>
            <div className="footer-subtitle">
              {footerConfig.companyInfo.subtitle}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;