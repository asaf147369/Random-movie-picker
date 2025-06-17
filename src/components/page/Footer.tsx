
import React from 'react';
import { Linkedin } from 'lucide-react';

const Footer = () => (
  <footer className="w-full mb-8 mt-16 text-center text-sm text-muted-foreground">
    <p>
      &copy; {new Date().getFullYear()} Movie Picker. Made with Love by Asaf Hadad{' '}
      <a
        href="https://www.linkedin.com/in/asaf-hadad/"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center ml-1 text-muted-foreground hover:text-foreground transition-colors"
      >
        <Linkedin size={14} />
      </a>
    </p>
    <p>Powered by Randomness, React, and TMDB.</p>
  </footer>
);

export default Footer;
