import { useCallback, useEffect, useRef, useState } from 'react';
import { detectFireBase64, detectFireFromUrl } from '../services/mlApi';
import '../styles/CameraPanel.css';

const DETECTION_INTERVAL_MS = 1500;
const FIRE_CONFIDENCE_THRESHOLD = 0.8;
const DEFAULT_FIRE_LOCATION = {
  name: import.meta.env.VITE_FIRE_LOCATION_NAME || 'Camera Feed Zone',
  latitude: Number.parseFloat(import.meta.env.VITE_FIRE_LATITUDE || '8.486275985936441'),
  longitude: Number.parseFloat(import.meta.env.VITE_FIRE_LONGITUDE || '124.65743561993813'),
};

const getRenderedImageBounds = (displayWidth, displayHeight, frameWidth, frameHeight) => {
  const frameAspectRatio = frameWidth / frameHeight;
  const displayAspectRatio = displayWidth / displayHeight;

  if (displayAspectRatio > frameAspectRatio) {
    const scaledHeight = displayHeight;
    const scaledWidth = scaledHeight * frameAspectRatio;
    return {
      width: scaledWidth,
      height: scaledHeight,
      offsetX: (displayWidth - scaledWidth) / 2,
      offsetY: 0,
      scale: scaledWidth / frameWidth,
    };
  }

  const scaledWidth = displayWidth;
  const scaledHeight = scaledWidth / frameAspectRatio;
  return {
    width: scaledWidth,
    height: scaledHeight,
    offsetX: 0,
    offsetY: (displayHeight - scaledHeight) / 2,
    scale: scaledWidth / frameWidth,
  };
};

const parseCoordinate = (value, fallback) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const CameraPanel = ({ onFireDetected }) => {
  const [sourceType, setSourceType] = useState('webcam');
  const [esp32StreamUrl, setEsp32StreamUrl] = useState(import.meta.env.VITE_ESP32_STREAM_URL || '');
  const [esp32SnapshotUrl, setEsp32SnapshotUrl] = useState(import.meta.env.VITE_ESP32_SNAPSHOT_URL || '');
  const [esp32UseCors, setEsp32UseCors] = useState(false);
  const [detectionLocationName, setDetectionLocationName] = useState(DEFAULT_FIRE_LOCATION.name);
  const [detectionLatitude, setDetectionLatitude] = useState(String(DEFAULT_FIRE_LOCATION.latitude));
  const [detectionLongitude, setDetectionLongitude] = useState(String(DEFAULT_FIRE_LOCATION.longitude));
  const [isReady, setIsReady] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [error, setError] = useState('');

  const videoRef = useRef(null);
  const imgRef = useRef(null);
  const overlayRef = useRef(null);
  const streamRef = useRef(null);
  const captureCanvasRef = useRef(null);
  const detectionInFlightRef = useRef(false);
  const abortControllerRef = useRef(null);
  const fireEventTriggeredRef = useRef(false);
  const fireDetectedHandlerRef = useRef(onFireDetected);
  const detectionLocationNameRef = useRef(detectionLocationName);
  const detectionLatitudeRef = useRef(detectionLatitude);
  const detectionLongitudeRef = useRef(detectionLongitude);

  useEffect(() => {
    fireDetectedHandlerRef.current = onFireDetected;
  }, [onFireDetected]);

  useEffect(() => {
    detectionLocationNameRef.current = detectionLocationName;
  }, [detectionLocationName]);

  useEffect(() => {
    detectionLatitudeRef.current = detectionLatitude;
  }, [detectionLatitude]);

  useEffect(() => {
    detectionLongitudeRef.current = detectionLongitude;
  }, [detectionLongitude]);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const resetDetection = useCallback(() => {
    setLastResult(null);
    setError('');
    if (overlayRef.current) {
      const ctx = overlayRef.current.getContext('2d');
      ctx?.clearRect(0, 0, overlayRef.current.width, overlayRef.current.height);
    }
  }, []);

  useEffect(() => {
    setIsReady(false);
    resetDetection();
    abortControllerRef.current?.abort();
    detectionInFlightRef.current = false;
    fireEventTriggeredRef.current = false;

    if (sourceType !== 'webcam') {
      stopStream();
      return undefined;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Webcam access is not supported in this browser.');
      return () => {};
    }

    let isMounted = true;

    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      .then((stream) => {
        if (!isMounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      })
      .catch((mediaError) => {
        if (isMounted) {
          setError(mediaError.message || 'Unable to access the webcam.');
        }
      });

    return () => {
      isMounted = false;
      stopStream();
    };
  }, [resetDetection, sourceType, stopStream]);

  useEffect(() => {
    if (sourceType !== 'esp32') {
      return;
    }

    if (!esp32SnapshotUrl && esp32StreamUrl) {
      const derivedSnapshotUrl = esp32StreamUrl.replace(/\/stream\/?$/i, '/capture');
      if (derivedSnapshotUrl !== esp32StreamUrl) {
        setEsp32SnapshotUrl(derivedSnapshotUrl);
        return;
      }
    }

    if (!esp32StreamUrl) {
      setError('Enter an ESP32-CAM stream URL (for example: http://192.168.1.88:81/stream).');
      setIsReady(false);
      resetDetection();
      return;
    }

    if (!esp32SnapshotUrl) {
      setError('Enter an ESP32-CAM snapshot URL (for example: http://192.168.1.88/capture).');
      setIsReady(false);
      resetDetection();
      fireEventTriggeredRef.current = false;
      return;
    }

    setError('');
    setIsReady(false);
  }, [esp32SnapshotUrl, esp32StreamUrl, resetDetection, sourceType]);

  useEffect(() => {
    if (!isReady) {
      return undefined;
    }

    const runDetection = async () => {
      if (detectionInFlightRef.current) {
        return;
      }

      const sourceElement = sourceType === 'webcam' ? videoRef.current : imgRef.current;
      if (!sourceElement) {
        return;
      }

      const frameWidth = sourceType === 'webcam'
        ? sourceElement.videoWidth
        : sourceElement.naturalWidth;
      const frameHeight = sourceType === 'webcam'
        ? sourceElement.videoHeight
        : sourceElement.naturalHeight;

      if (!frameWidth || !frameHeight) {
        return;
      }

      let imageDataUrl = '';
      let isEsp32CanvasCaptured = false;

      if (sourceType === 'webcam' || (sourceType === 'esp32' && esp32UseCors)) {
        if (!captureCanvasRef.current) {
          captureCanvasRef.current = document.createElement('canvas');
        }

        const captureCanvas = captureCanvasRef.current;
        captureCanvas.width = frameWidth;
        captureCanvas.height = frameHeight;

        const captureContext = captureCanvas.getContext('2d', { willReadFrequently: true });
        if (!captureContext) {
          setError('Unable to access the capture canvas.');
          return;
        }

        try {
          captureContext.drawImage(sourceElement, 0, 0, frameWidth, frameHeight);
          imageDataUrl = captureCanvas.toDataURL('image/jpeg', 0.7);
          if (sourceType === 'esp32') {
            isEsp32CanvasCaptured = true;
          }
        } catch (frameError) {
          if (sourceType === 'webcam') {
            setError('Unable to read the camera frame.');
            return;
          }
          // For ESP32-CAM, fallback to URL detection if canvas capture fails (e.g. due to CORS restriction)
          console.warn(
            'Failed to capture ESP32-CAM frame via canvas (CORS restriction). Falling back to backend URL fetch.',
            frameError
          );
        }
      }

      detectionInFlightRef.current = true;
      setIsDetecting(true);
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      try {
        const result = (sourceType === 'esp32' && !isEsp32CanvasCaptured)
          ? await detectFireFromUrl(esp32SnapshotUrl, abortControllerRef.current.signal)
          : await detectFireBase64(imageDataUrl, abortControllerRef.current.signal);

        setLastResult(result);
        setError('');

        const overlayCanvas = overlayRef.current;
        if (!overlayCanvas) {
          return;
        }

        const displayWidth = overlayCanvas.clientWidth || frameWidth;
        const displayHeight = overlayCanvas.clientHeight || frameHeight;
        overlayCanvas.width = displayWidth;
        overlayCanvas.height = displayHeight;

        const overlayContext = overlayCanvas.getContext('2d');
        if (!overlayContext) {
          return;
        }
        overlayContext.clearRect(0, 0, displayWidth, displayHeight);

        if (!result?.detections?.length) {
          return;
        }

        const renderedBounds = getRenderedImageBounds(displayWidth, displayHeight, frameWidth, frameHeight);

        result.detections.forEach((detection) => {
          const { bbox, confidence, class: className } = detection;
          const x = renderedBounds.offsetX + (bbox.x1 * renderedBounds.scale);
          const y = renderedBounds.offsetY + (bbox.y1 * renderedBounds.scale);
          const width = bbox.width * renderedBounds.scale;
          const height = bbox.height * renderedBounds.scale;

          overlayContext.strokeStyle = result.fire_detected ? '#ff4d4f' : '#00d68f';
          overlayContext.lineWidth = 2;
          overlayContext.strokeRect(x, y, width, height);

          const label = `${className} ${(confidence * 100).toFixed(1)}%`;
          overlayContext.font = '12px sans-serif';
          overlayContext.fillStyle = 'rgba(0, 0, 0, 0.6)';
          overlayContext.fillRect(x, Math.max(0, y - 20), overlayContext.measureText(label).width + 12, 20);
          overlayContext.fillStyle = '#fff';
          overlayContext.fillText(label, x + 6, Math.max(12, y - 6));
        });

        const qualifiesForFireEvent = Number.isFinite(result?.highest_confidence)
          && result.highest_confidence >= FIRE_CONFIDENCE_THRESHOLD;

        if (qualifiesForFireEvent) {
          if (!fireEventTriggeredRef.current) {
            fireEventTriggeredRef.current = true;

            if (typeof fireDetectedHandlerRef.current === 'function') {
              try {
                await fireDetectedHandlerRef.current({
                  location: detectionLocationNameRef.current.trim() || DEFAULT_FIRE_LOCATION.name,
                  latitude: parseCoordinate(detectionLatitudeRef.current, DEFAULT_FIRE_LOCATION.latitude),
                  longitude: parseCoordinate(detectionLongitudeRef.current, DEFAULT_FIRE_LOCATION.longitude),
                  confidence: result.highest_confidence,
                  notes: 'Confirmed from camera detection at or above threshold.',
                  status: 'open',
                });
              } catch (eventError) {
                fireEventTriggeredRef.current = false;
                throw eventError;
              }
            }
          }
        } else {
          fireEventTriggeredRef.current = false;
        }
      } catch (detectionError) {
        if (detectionError.name !== 'AbortError') {
          setError(detectionError.message || 'Fire detection failed.');
        }
      } finally {
        detectionInFlightRef.current = false;
        setIsDetecting(false);
      }
    };

    const intervalId = setInterval(runDetection, DETECTION_INTERVAL_MS);
    runDetection();

    return () => {
      clearInterval(intervalId);
      abortControllerRef.current?.abort();
      detectionInFlightRef.current = false;
    };
  }, [esp32SnapshotUrl, isReady, sourceType, esp32UseCors]);

  return (
    <section className="dashboard-section camera-section">
      <h2>Live Camera Preview</h2>
      <div className="camera-controls">
        <label className="camera-control">
          Source
          <select
            value={sourceType}
            onChange={(event) => setSourceType(event.target.value)}
          >
            <option value="webcam">Webcam</option>
            <option value="esp32">ESP32-CAM</option>
          </select>
        </label>

        <label className="camera-control camera-control--wide">
          Fire Location Name
          <input
            type="text"
            placeholder="Camera Feed Zone"
            value={detectionLocationName}
            onChange={(event) => setDetectionLocationName(event.target.value)}
          />
        </label>

        {/* Coordinates are fixed to the default detection location. */}

        {sourceType === 'esp32' && (
          <>
            <label className="camera-control camera-control--wide">
              Stream URL
              <input
                type="url"
                placeholder="http://192.168.1.88:81/stream"
                value={esp32StreamUrl}
                onChange={(event) => setEsp32StreamUrl(event.target.value)}
              />
            </label>
            <label className="camera-control camera-control--wide">
              Snapshot URL
              <input
                type="url"
                placeholder="http://192.168.1.88/capture"
                value={esp32SnapshotUrl}
                onChange={(event) => setEsp32SnapshotUrl(event.target.value)}
              />
            </label>
            <label className="camera-control camera-control--checkbox">
              <input
                type="checkbox"
                checked={esp32UseCors}
                onChange={(event) => setEsp32UseCors(event.target.checked)}
              />
              Enable Browser CORS Capture (Faster/Bypasses ESP32 Limits)
            </label>
          </>
        )}
      </div>

      <div className="camera-frame">
        {sourceType === 'webcam' ? (
          <video
            className="camera-media"
            ref={videoRef}
            autoPlay
            muted
            playsInline
            onLoadedMetadata={() => setIsReady(true)}
          />
        ) : (
          esp32StreamUrl ? (
            <img
              className="camera-media"
              ref={imgRef}
              src={esp32StreamUrl}
              alt="ESP32-CAM stream"
              crossOrigin={esp32UseCors ? 'anonymous' : undefined}
              onLoad={() => setIsReady(true)}
              onError={() => setError('Unable to load the ESP32-CAM stream. Check the URL or network connection.')}
            />
          ) : (
            <div className="camera-empty">Waiting for ESP32 stream URL...</div>
          )
        )}
        <canvas className="camera-overlay" ref={overlayRef} />
      </div>

      <div className="camera-status">
        <span className={`camera-pill ${lastResult?.fire_detected ? 'camera-pill--alert' : ''}`}>
          {lastResult ? (lastResult.fire_detected ? 'Fire detected' : 'No fire detected') : 'Awaiting detection'}
        </span>
        <span className="camera-pill">
          {isDetecting ? 'Analyzing...' : 'Idle'}
        </span>
        {lastResult && (
          <span className="camera-pill">
            {(lastResult.highest_confidence * 100).toFixed(1)}% max confidence
          </span>
        )}
      </div>
      {error && <p className="camera-error">{error}</p>}
    </section>
  );
};

export default CameraPanel;
