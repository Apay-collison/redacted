// components/Layout.tsx

import React, { ReactNode } from "react";

const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <main className="min-h-screen bg-cover bg-center font-vt323" style={{ backgroundImage: "url('/bg.jpeg')" }}>
      <div className="p-6">
        {children}
      </div>
    </main>
  );
};

export default Layout;
