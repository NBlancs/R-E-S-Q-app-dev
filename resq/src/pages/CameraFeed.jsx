import CameraPanel from '../components/CameraPanel';

const CameraFeed = ({ onFireDetected }) => {
  return (
    <>
      <CameraPanel onFireDetected={onFireDetected} />
    </>
  );
};

export default CameraFeed;
