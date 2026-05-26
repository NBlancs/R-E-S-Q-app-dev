const ML_API_BASE_URL = (
  import.meta.env.VITE_ML_API_URL
  || 'http://localhost:8001'
).replace(/\/$/, '');

const buildMlUrl = (path) => {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${ML_API_BASE_URL}${normalizedPath}`;
};

const parseMlError = async (response) => {
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    const payload = await response.json();
    if (payload?.detail) {
      return payload.detail;
    }
  } else {
    const text = await response.text();
    if (text) {
      return text;
    }
  }

  return 'Detection failed.';
};

export const detectFireBase64 = async (image, signal) => {
  const response = await fetch(buildMlUrl('/detect/base64'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ image }),
    signal,
  });

  if (!response.ok) {
    const message = await parseMlError(response);
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return response.json();
};

export const detectFireFromUrl = async (url, signal) => {
  const response = await fetch(buildMlUrl('/detect/url'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url }),
    signal,
  });

  if (!response.ok) {
    const message = await parseMlError(response);
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return response.json();
};
