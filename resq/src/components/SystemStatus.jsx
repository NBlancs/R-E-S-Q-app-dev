import '../styles/SystemStatus.css';

const SystemStatus = ({ summary }) => {
  const metrics = [
    {
      label: 'Registered Cameras',
      value: summary?.camera_count ?? '-',
      className: 'online',
    },
    {
      label: 'Total Incidents',
      value: summary?.incident_count ?? '-',
      className: 'online',
    },
    {
      label: 'Open / Investigating',
      value: summary?.open_incidents ?? '-',
      className: 'warning',
    },
    {
      label: 'Resolved Incidents',
      value: summary?.resolved_incidents ?? '-',
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
