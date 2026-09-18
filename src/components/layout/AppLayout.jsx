import { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function AppLayout({ user, children }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="app-shell">
      <Sidebar
        user={user}
        isCollapsed={isCollapsed}
        onToggle={() => setIsCollapsed(!isCollapsed)}
      />

      <div className="app-shell__content">
        <Topbar user={user} />
        <div className="app-shell__main">
          {children}
        </div>
      </div>
    </div>
  );
}
