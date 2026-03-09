import React from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";

const Layout = ({ children }) => {
  return (
    <>
      <style>{`
        body { background: #0d0015 !important; margin: 0; padding: 0; }
        .hemo-layout { min-height: 100vh; background: #0d0015; }
        .hemo-main {
          margin-left: 220px;
          padding-top: 64px;
          min-height: 100vh;
          background: #0d0015;
          position: relative;
        }
        .hemo-content { padding: 32px 32px; }
        .hemo-main::before {
          content: '';
          position: fixed;
          top: 64px; left: 220px; right: 0; bottom: 0;
          background: radial-gradient(ellipse at 80% 20%, rgba(124,58,237,0.08) 0%, transparent 60%),
                      radial-gradient(ellipse at 20% 80%, rgba(236,72,153,0.06) 0%, transparent 60%);
          pointer-events: none;
          z-index: 0;
        }
        .hemo-content > * { position: relative; z-index: 1; }
      `}</style>
      <div className="hemo-layout">
        <Header />
        <Sidebar />
        <div className="hemo-main">
          <div className="hemo-content">{children}</div>
        </div>
      </div>
    </>
  );
};

export default Layout;
