import { useEffect, useState } from 'react';
import SummaryCards from '../components/SummaryCards';
import SystemStatus from '../components/SystemStatus';
import { fetchOverview } from '../services/api';

const Overview = () => {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadSummary = async () => {
      try {
        const response = await fetchOverview();

        if (isMounted) {
          setSummary(response);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError.message || 'Unable to load system overview.');
        }
      }
    };

    loadSummary();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <>
      {error && <p className="profile-error">{error}</p>}
      <SummaryCards summary={summary} />
      <SystemStatus summary={summary} />
    </>
  );
};

export default Overview;
