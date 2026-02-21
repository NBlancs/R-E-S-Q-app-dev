import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

const Layout = ({ onLogout }) => {
  return (
    <div className="dashboard-container">
      <Header onLogout={onLogout} />
      <main className="dashboard-content">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
