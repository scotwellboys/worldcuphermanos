// Saves a score to JSONBin.io — no npm dependencies, pure Node https.
// Environment variables needed:
//   ADMIN_PASSWORD  — password to protect score entry
//   JSONBIN_BIN_ID  — the bin ID from jsonbin.io
//   JSONBIN_KEY     — your JSONBin master or access key

const https = require('https');

const CORS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function jsonbinRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : undefined;
    const options = {
      hostname: 'api.jsonbin.io',
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': process.env.JSONBIN_KEY,
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
      },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { resolve(data); }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method not allowed' }) };

  const { ADMIN_PASSWORD, JSONBIN_BIN_ID, JSONBIN_KEY } = process.env;
  if (!ADMIN_PASSWORD || !JSONBIN_BIN_ID || !JSONBIN_KEY)
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: 'Missing environment variables.' }) };

  let body;
  try { body = JSON.parse(event.body); }
  catch { return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid JSON' }) }; }

  if (body.password !== ADMIN_PASSWORD)
    return { statusCode: 401, headers: CORS, body: JSON.stringify({ error: 'Wrong password' }) };

  const { matchId, home, away } = body;
  if (matchId == null || home == null || away == null)
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'matchId, home and away required' }) };

  // Fetch current scores from JSONBin
  const current = await jsonbinRequest('GET', `/v3/b/${JSONBIN_BIN_ID}/latest`);
  const scores = current.record || {};

  // Update the score for this match
  scores[String(matchId)] = { home: Number(home), away: Number(away) };

  // Write back
  await jsonbinRequest('PUT', `/v3/b/${JSONBIN_BIN_ID}`, scores);

  return { statusCode: 200, headers: CORS, body: JSON.stringify({ ok: true }) };
};
