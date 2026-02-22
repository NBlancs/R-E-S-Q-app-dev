import { useState } from 'react';
import Header from '../components/Header';
import SummaryCards from '../components/SummaryCards';
import AlertsList from '../components/AlertsList';
import CameraPanel from '../components/CameraPanel';
import SystemStatus from '../components/SystemStatus';
import IncidentsTable from '../components/IncidentsTable';
import Footer from '../components/Footer';

import '../styles/Dashboard.css';
import dashboardData from '../data/dashboardData.json';


const Dashboard = ({ onLogout }) => {
  const [alerts, setAlerts] = useState(dashboardData.alerts);

  const [incidents, setIncidents] = useState(dashboardData.incidents || []);

  const handleIncidentsChange = (next) => {
    setIncidents(next);
  };

  const handleAcknowledge = (id) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  };

  return (
    <div className="dashboard-container">
      <Header onLogout={onLogout} />
      <main className="dashboard-content">
        <SummaryCards />
        <AlertsList alerts={alerts} onAcknowledge={handleAcknowledge} />

        <div className="dashboard-grid-row">
          <CameraPanel />
          <SystemStatus />
        </div>

        <IncidentsTable incidents={incidents} onIncidentsChange={handleIncidentsChange} />
      </main>
      <Footer />
    </div>
        

  );
};

export default Dashboard;
