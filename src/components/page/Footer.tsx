
import React from 'react';
import { Linkedin } from 'lucide-react';

const Footer = () => (
  <footer className="w-full mb-8 mt-16 text-center text-sm text-muted-foreground">
    <p>&copy; {new Date().getFullYear()} Movie Picker. Made with Love by Asaf Hadad.</p>
    <p>Powered by Randomness, React, and TMDB.</p>
    <div className="mt-4 flex justify-center">
      <a
        href="https://www.linkedin.com/in/asaf-hadad/"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <Linkedin size={16} />
        Connect on LinkedIn
      </a>
    </div>
  </footer>
);

export default Footer;
