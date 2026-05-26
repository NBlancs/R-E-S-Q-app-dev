import dashboardData from '../data/dashboardData.json';
import camerasData from '../data/cameras.json';
import '../styles/SummaryCards.css';

const trendData = [
  { hour: '1h', temperature: 26, particulate: 33 },
  { hour: '4h', temperature: 27, particulate: 37 },
  { hour: '8h', temperature: 28, particulate: 41 },
  { hour: '12h', temperature: 29, particulate: 38 },
  { hour: '18h', temperature: 27, particulate: 35 },
  { hour: '24h', temperature: 26, particulate: 31 },
];

const sensorHealth = [
  { label: 'Online', value: 96, color: '#2ecc71' },
  { label: 'Offline', value: 10, color: '#e74c3c' },
  { label: 'Low Battery', value: 12, color: '#f39c12' },
  { label: 'Faulty', value: 6, color: '#8e44ad' },
];

const responseTeamStatus = [
  { label: 'Deployed', value: 3, detail: 'Zone A, Zone C, Zone D', colorClass: 'deployed' },
  { label: 'On Standby', value: 2, detail: 'Central Station', colorClass: 'standby' },
  { label: 'En Route', value: 3, detail: 'Heading to Zone B', colorClass: 'enroute' },
];

const demoSummary = {
  camera_count: camerasData.length,
  incident_count: dashboardData.incidents?.length ?? 0,
  open_incidents: dashboardData.incidents?.filter((incident) => incident.status !== 'resolved').length ?? 0,
  resolved_incidents: dashboardData.incidents?.filter((incident) => incident.status === 'resolved').length ?? 0,
};

const buildLinePath = (values, width, height, minValue, maxValue) => {
  const xStep = width / (values.length - 1);
  const range = maxValue - minValue || 1;

  return values
    .map((value, index) => {
      const x = index * xStep;
      const y = height - ((value - minValue) / range) * height;
      return `${index === 0 ? 'M' : 'L'} ${x},${y}`;
    })
    .join(' ');
};

const SensorDonut = ({ data, size = 170, strokeWidth = 24 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const segments = data.map((item, index) => {
    const fraction = item.value / total;
    const dashLength = fraction * circumference;
    const accumulatedFraction = data
      .slice(0, index)
      .reduce((sum, previousItem) => sum + (previousItem.value / total), 0);

    return {
      ...item,
      dashLength,
      dashOffset: -accumulatedFraction * circumference,
    };
  });

  return (
    <svg className="donut-chart" width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-label="Sensor health donut chart" role="img">
      <g transform={`translate(${size / 2}, ${size / 2}) rotate(-90)`}>
        {segments.map((item) => (
            <circle
              key={item.label}
              r={radius}
              cx="0"
              cy="0"
              fill="transparent"
              stroke={item.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${item.dashLength} ${circumference - item.dashLength}`}
              strokeDashoffset={item.dashOffset}
              strokeLinecap="butt"
            />
          ))}
      </g>
      <text x="50%" y="48%" className="donut-total" textAnchor="middle">
        {total}
      </text>
      <text x="50%" y="60%" className="donut-total-label" textAnchor="middle">
        Sensors
      </text>
    </svg>
  );
};

const SummaryCards = ({ summary }) => {
  const sensorTotal = sensorHealth.reduce((sum, item) => sum + item.value, 0);
  const liveSummary = [
    { label: 'Cameras', value: summary?.camera_count ?? demoSummary.camera_count },
    { label: 'Incidents', value: summary?.incident_count ?? demoSummary.incident_count },
    { label: 'Open', value: summary?.open_incidents ?? demoSummary.open_incidents },
    { label: 'Resolved', value: summary?.resolved_incidents ?? demoSummary.resolved_incidents },
  ];

  const chartWidth = 420;
  const chartHeight = 180;
  const yMin = 20;
  const yMax = 45;
  const temperaturePath = buildLinePath(
    trendData.map((point) => point.temperature),
    chartWidth,
    chartHeight,
    yMin,
    yMax,
  );
  const particulatePath = buildLinePath(
    trendData.map((point) => point.particulate),
    chartWidth,
    chartHeight,
    yMin,
    yMax,
  );

  return (
    <section className="summary-section">
      <div className="summary-card">
        <h3>Live System Overview</h3>
        <ul className="response-status-list" aria-label="Live overview counts">
          {liveSummary.map((item) => (
            <li key={item.label} className="response-status-item">
              <div className="response-status-main">
                <div>
                  <p className="response-status-label">{item.label}</p>
                  <p className="response-status-detail">From backend system overview</p>
                </div>
              </div>
              <strong className="response-status-count">{item.value}</strong>
            </li>
          ))}
        </ul>
      </div>

      <div className="summary-card">
        <h3>Temperature &amp; Air Quality Trends</h3>
        <p className="summary-subtitle">Average values across key zones (last 24 hours)</p>

        <div className="line-chart-wrapper">
          <svg className="line-chart" viewBox={`0 0 ${chartWidth} ${chartHeight}`} role="img" aria-label="Temperature and particulate density trend chart">
            <line x1="0" y1={chartHeight} x2={chartWidth} y2={chartHeight} className="chart-axis" />
            <path d={temperaturePath} className="chart-line temperature-line" />
            <path d={particulatePath} className="chart-line particulate-line" />

            {trendData.map((point, index) => {
              const x = (index * chartWidth) / (trendData.length - 1);
              const tempY = chartHeight - ((point.temperature - yMin) / (yMax - yMin)) * chartHeight;
              const particulateY = chartHeight - ((point.particulate - yMin) / (yMax - yMin)) * chartHeight;

              return (
                <g key={point.hour}>
                  <circle cx={x} cy={tempY} r="3.5" className="chart-point temperature-point" />
                  <circle cx={x} cy={particulateY} r="3.5" className="chart-point particulate-point" />
                </g>
              );
            })}
          </svg>

          <div className="chart-axis-labels">
            {trendData.map((point) => (
              <span key={point.hour}>{point.hour}</span>
            ))}
          </div>

          <div className="chart-legend">
            <span><i className="legend-dot temperature-dot" />Temperature (°C)</span>
            <span><i className="legend-dot particulate-dot" />Smoke / PM Density</span>
          </div>
        </div>
      </div>

      <div className="summary-card">
        <h3>Sensor Health Breakdown</h3>
        <p className="summary-subtitle">Distribution of {sensorTotal} active sensors</p>

        <div className="donut-layout">
          <SensorDonut data={sensorHealth} />

          <ul className="donut-legend" aria-label="Sensor health status breakdown">
            {sensorHealth.map((item) => (
              <li key={item.label}>
                <span className="legend-swatch" style={{ backgroundColor: item.color }} />
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="summary-card">
        <h3>Response Team Status</h3>
        <p className="summary-subtitle">Current availability and assignment by zone</p>

        <ul className="response-status-list" aria-label="Response team availability status">
          {responseTeamStatus.map((status) => (
            <li key={status.label} className="response-status-item">
              <div className="response-status-main">
                <span className={`response-status-dot ${status.colorClass}`} />
                <div>
                  <p className="response-status-label">{status.label}</p>
                  <p className="response-status-detail">{status.detail}</p>
                </div>
              </div>
              <strong className="response-status-count">{status.value}</strong>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default SummaryCards;
