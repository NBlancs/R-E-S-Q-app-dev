import { useState } from 'react';
import Header from '../components/Header';
import SummaryCards from '../components/SummaryCards';
import AlertsList from '../components/AlertsList';
import CameraPanel from '../components/CameraPanel';
import SystemStatus from '../components/SystemStatus';
import IncidentsTable from '../components/IncidentsTable';
import Footer from '../components/Footer';

import './Dashboard.css';


// json this one
const Dashboard = ({ onLogout }) => {
  const [alerts, setAlerts] = useState([
    {
      id: 1,
      title: 'Fire Detected - Zone A',
      location: 'Sector 4 - Warehouse',
      time: '10:42 AM',
      priority: 'high-priority'
    },
    {
      id: 2,
      title: 'Gas Detected - Zone B',
      location: 'Office Block 2',
      time: '10:45 AM',
      priority: 'medium-priority'
    }
  ]);

  const incidents = [
    {
      id: '#INC-001',
      type: 'Fire',
      location: 'Zone A - North',
      method: 'Heat Sensor',
      time: '09:15 AM',
      status: 'resolved'
    },
    {
      id: '#INC-002',
      type: 'Gas',
      location: 'Zone C - Lobby',
      method: 'Camera AI',
      time: '08:30 AM',
      status: 'investigating'
    }
  ];

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

        <IncidentsTable incidents={incidents} />
      </main>
      <Footer />
    </div>
        

  );
};

export default Dashboard;
