
import React from 'react';

const Footer = () => (
  <footer className="w-full mb-8 mt-16 text-center text-sm text-muted-foreground">
    <p>&copy; {new Date().getFullYear()} Movie Picker. All rights reserved (sort of).</p>
    <p>Powered by Randomness, React, and TMDB.</p>
  </footer>
);

export default Footer;
