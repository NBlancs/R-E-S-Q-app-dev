import { Outlet } from 'react-router-dom';
import '../styles/Dashboard.css';
import Header from './Header';
import Footer from './Footer';

const Layout = ({
  onLogout,
  alerts,
  onMarkAlertRead,
  onMarkAlertUnread,
  onDismissAlert,
  roleLabel = 'Admin',
  userAvatar = '',
  navItems = [],
  canDismissAlerts = true,
}) => {
  return (
    <div className="dashboard-container">
      <Header
        onLogout={onLogout}
        alerts={alerts}
        onMarkAlertRead={onMarkAlertRead}
        onMarkAlertUnread={onMarkAlertUnread}
        onDismissAlert={onDismissAlert}
        roleLabel={roleLabel}
        userAvatar={userAvatar}
        navItems={navItems}
        canDismissAlerts={canDismissAlerts}
      />
      <main className="dashboard-content">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
