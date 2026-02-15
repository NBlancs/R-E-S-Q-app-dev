import testVideo from '../assets/testvideo.mp4';

const CameraPanel = () => {
  return (
    <section className="dashboard-section camera-section">
      <h2>Live Camera Preview</h2>
      <div className="camera-placeholder">
        <video
          className="camera-video"
          src={testVideo}
          autoPlay
          muted
          loop
          controls
          playsInline
        >
          Your browser does not support the video tag.
        </video>
      </div>
    </section>
  );
};

export default CameraPanel;
