import { useEffect, useState } from 'react';
import CamerasTable from '../components/CamerasTable';
import {
  createCamera,
  deleteCamera,
  fetchCameras,
  updateCamera,
} from '../services/api';
import { buildNextCameraCode, toFrontendCamera } from '../services/mappers';

const CameraList = () => {
  const [cameras, setCameras] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadCameras = async () => {
      try {
        const response = await fetchCameras();

        if (!isMounted) {
          return;
        }

        setCameras(response.map(toFrontendCamera));
      } catch (loadError) {
        if (isMounted) {
          setError(loadError.message || 'Unable to load cameras.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadCameras();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleCreateCamera = async (cameraInput) => {
    const payload = {
      camera_code: buildNextCameraCode(cameras),
      name: cameraInput.name,
      location: cameraInput.location,
      status: cameraInput.status,
      footage_url: cameraInput.footageUrl || '',
    };

    const createdCamera = await createCamera(payload);

    setCameras((previous) => [toFrontendCamera(createdCamera), ...previous]);
  };

  const handleUpdateCamera = async (backendId, cameraInput) => {
    const payload = {
      name: cameraInput.name,
      location: cameraInput.location,
      status: cameraInput.status,
    };

    const updatedCamera = await updateCamera(backendId, payload);

    setCameras((previous) => previous.map((camera) => (
      camera.backendId === backendId ? toFrontendCamera(updatedCamera) : camera
    )));
  };

  const handleDeleteCamera = async (backendId) => {
    await deleteCamera(backendId);
    setCameras((previous) => previous.filter((camera) => camera.backendId !== backendId));
  };

  return (
    <CamerasTable
      cameras={cameras}
      isLoading={isLoading}
      error={error}
      onCreateCamera={handleCreateCamera}
      onUpdateCamera={handleUpdateCamera}
      onDeleteCamera={handleDeleteCamera}
    />
  );
};

export default CameraList;
