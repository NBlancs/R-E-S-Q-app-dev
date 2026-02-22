import IncidentsTable from '../components/IncidentsTable';
import dashboardData from '../data/dashboardData.json';

const Reports = () => {
  const { incidents } = dashboardData;

  return (
    <>
      <IncidentsTable incidents={incidents} />
    </>
  );
};

export default Reports;
