
import React from 'react';

const Header = () => (
  <header className="w-full mt-8 mb-10 text-center">
    <h1 className="text-5xl font-extrabold mb-3 tracking-tight" style={{ color: 'hsl(var(--app-accent))' }}>
      Random Movie Night
    </h1>
    <p className="text-xl text-muted-foreground">
      Can't decide what to watch? Let us pick for you!
    </p>
  </header>
);

export default Header;
