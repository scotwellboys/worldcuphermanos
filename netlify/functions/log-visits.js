// Logs a page visit: timestamp and user agent only.
// No geo-lookup (removes an extra outbound API call per visit to save credits).
// Stores in a separate JSONBin bin (JSONBIN_VISITS_ID).

const https = require('https');

const CORS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function jsonbinRequest(method, path, body, key) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : undefined;
    const options = {
      hostname: 'api.jsonbin.io',
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': key,
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
      },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { resolve({ record: {} }); }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };

  const { JSONBIN_VISITS_ID, JSONBIN_KEY } = process.env;
  if (!JSONBIN_VISITS_ID || !JSONBIN_KEY) {
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ ok: false, reason: 'not configured' }) };
  }

  const userAgent = event.headers['user-agent'] || 'unknown';

  const visit = {
    time: new Date().toISOString(),
    userAgent,
  };

  try {
    const current = await jsonbinRequest('GET', `/v3/b/${JSONBIN_VISITS_ID}/latest`, null, JSONBIN_KEY);
    const visits = Array.isArray(current.record?.visits) ? current.record.visits : [];
    visits.unshift(visit);
    const trimmed = visits.slice(0, 500);
    await jsonbinRequest('PUT', `/v3/b/${JSONBIN_VISITS_ID}`, { visits: trimmed }, JSONBIN_KEY);
  } catch (e) {
    // Don't fail the page load if logging breaks
  }

  return { statusCode: 200, headers: CORS, body: JSON.stringify({ ok: true }) };
};
Done
