import { useEffect, useState } from 'react';
import IncidentsTable from '../components/IncidentsTable';
import {
  createIncident,
  deleteIncident,
  fetchIncidents,
  updateIncident,
} from '../services/api';
import {
  buildNextIncidentCode,
  toBackendIncidentPayload,
  toFrontendIncident,
} from '../services/mappers';

const Reports = () => {
  const [incidents, setIncidents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadIncidents = async () => {
      try {
        const response = await fetchIncidents();

        if (!isMounted) {
          return;
        }

        setIncidents(response.map(toFrontendIncident));
      } catch (loadError) {
        if (isMounted) {
          setError(loadError.message || 'Unable to load incidents.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadIncidents();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleCreateIncident = async (incidentInput) => {
    const incidentCode = buildNextIncidentCode(incidents);
    const payload = toBackendIncidentPayload(incidentInput, incidentCode);
    const createdIncident = await createIncident(payload);

    setIncidents((previous) => [toFrontendIncident(createdIncident), ...previous]);
  };

  const handleUpdateIncident = async (backendId, incidentInput) => {
    const existingIncident = incidents.find((incident) => incident.backendId === backendId);
    const payload = toBackendIncidentPayload(incidentInput, existingIncident?.incidentCode);
    const updatedIncident = await updateIncident(backendId, payload);

    setIncidents((previous) => previous.map((incident) => (
      incident.backendId === backendId ? toFrontendIncident(updatedIncident) : incident
    )));
  };

  const handleDeleteIncident = async (backendId) => {
    await deleteIncident(backendId);
    setIncidents((previous) => previous.filter((incident) => incident.backendId !== backendId));
  };

  return (
    <IncidentsTable
      incidents={incidents}
      isLoading={isLoading}
      error={error}
      onCreateIncident={handleCreateIncident}
      onUpdateIncident={handleUpdateIncident}
      onDeleteIncident={handleDeleteIncident}
    />
  );
};

export default Reports;
