import { useState } from 'react';
import SummaryCards from '../components/SummaryCards';
import AlertsList from '../components/AlertsList';
import SystemStatus from '../components/SystemStatus';
import dashboardData from '../data/dashboardData.json';

const Overview = () => {
  const [alerts, setAlerts] = useState(dashboardData.alerts);

  const handleAcknowledge = (id) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  };

  return (
    <>
      <SummaryCards />
      <AlertsList alerts={alerts} onAcknowledge={handleAcknowledge} />
      <SystemStatus />
    </>
  );
};

export default Overview;
