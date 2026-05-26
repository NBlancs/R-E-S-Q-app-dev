import dashboardData from '../data/dashboardData.json';
import camerasData from '../data/cameras.json';
import '../styles/SystemStatus.css';

const demoSummary = {
  camera_count: camerasData.length,
  incident_count: dashboardData.incidents?.length ?? 0,
  open_incidents: dashboardData.incidents?.filter((incident) => incident.status !== 'resolved').length ?? 0,
  resolved_incidents: dashboardData.incidents?.filter((incident) => incident.status === 'resolved').length ?? 0,
};

const SystemStatus = ({ summary }) => {
  const metrics = [
    {
      label: 'Registered Cameras',
      value: summary?.camera_count ?? demoSummary.camera_count,
      className: 'online',
    },
    {
      label: 'Total Incidents',
      value: summary?.incident_count ?? demoSummary.incident_count,
      className: 'online',
    },
    {
      label: 'Open / Investigating',
      value: summary?.open_incidents ?? demoSummary.open_incidents,
      className: 'warning',
    },
    {
      label: 'Resolved Incidents',
      value: summary?.resolved_incidents ?? demoSummary.resolved_incidents,
      className: 'online',
    },
  ];

  return (
    <section className="dashboard-section status-section">
      <h2>System Status</h2>

      <ul className="status-list">
        {metrics.map((metric) => (
          <li key={metric.label} className={`status-item ${metric.className}`}>
            <span className="status-indicator"></span>
            {metric.label}: <strong>{metric.value}</strong>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default SystemStatus;
