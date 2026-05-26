import { useEffect, useState } from 'react';
import SummaryCards from '../components/SummaryCards';
import SystemStatus from '../components/SystemStatus';
import { fetchOverview } from '../services/api';

const Overview = () => {
  const [summary, setSummary] = useState(null);

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
          setSummary(null);
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
      <SummaryCards summary={summary} />
      <SystemStatus summary={summary} />
    </>
  );
};

export default Overview;
