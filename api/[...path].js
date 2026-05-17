const DEFAULT_TIMEOUT_MS = 20000;

function buildTargetUrl(req) {
  const base = process.env.UDC_API_URL || process.env.BACKEND_URL;

  if (!base) {
    return null;
  }

  const path = Array.isArray(req.query.path) ? req.query.path.join('/') : req.query.path || '';
  const query = new URLSearchParams();

  Object.entries(req.query).forEach(([key, value]) => {
    if (key === 'path') return;

    if (Array.isArray(value)) {
      value.forEach((item) => query.append(key, item));
      return;
    }

    if (value !== undefined) {
      query.set(key, value);
    }
  });

  const suffix = query.toString() ? `?${query.toString()}` : '';
  return `${base.replace(/\/$/, '')}/${path}${suffix}`;
}

function buildHeaders(req) {
  const headers = {};
  const allowedHeaders = ['authorization', 'content-type', 'accept'];

  allowedHeaders.forEach((headerName) => {
    const value = req.headers[headerName];

    if (value) {
      headers[headerName] = value;
    }
  });

  return headers;
}

function buildBody(req) {
  if (req.method === 'GET' || req.method === 'HEAD') {
    return undefined;
  }

  if (req.body === undefined || req.body === null) {
    return undefined;
  }

  return typeof req.body === 'string' || Buffer.isBuffer(req.body) ? req.body : JSON.stringify(req.body);
}

module.exports = async function handler(req, res) {
  const targetUrl = buildTargetUrl(req);

  if (!targetUrl) {
    res.status(503).json({
      message: 'Backend no configurado. Define UDC_API_URL en Vercel con la URL del backend.',
    });
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: buildHeaders(req),
      body: buildBody(req),
      signal: controller.signal,
    });

    const contentType = response.headers.get('content-type') || 'application/json; charset=utf-8';
    const payload = await response.arrayBuffer();

    res.status(response.status);
    res.setHeader('content-type', contentType);
    res.send(Buffer.from(payload));
  } catch (error) {
    const isTimeout = error?.name === 'AbortError';

    res.status(isTimeout ? 504 : 502).json({
      message: isTimeout ? 'El backend no respondio a tiempo.' : 'No se pudo conectar con el backend.',
    });
  } finally {
    clearTimeout(timeout);
  }
};
