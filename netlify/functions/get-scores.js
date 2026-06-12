// Fetches all manual scores from JSONBin.io — no npm dependencies.

const https = require('https');

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'public, max-age=20',
  };

  const { JSONBIN_BIN_ID, JSONBIN_KEY } = process.env;
  if (!JSONBIN_BIN_ID || !JSONBIN_KEY)
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Missing JSONBIN env vars' }) };

  return new Promise((resolve) => {
    const options = {
      hostname: 'api.jsonbin.io',
      path: `/v3/b/${JSONBIN_BIN_ID}/latest`,
      method: 'GET',
      headers: {
        'X-Master-Key': JSONBIN_KEY,
      },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ statusCode: 200, headers, body: JSON.stringify(parsed.record || {}) });
        } catch {
          resolve({ statusCode: 200, headers, body: '{}' });
        }
      });
    });
    req.on('error', (err) => {
      resolve({ statusCode: 500, headers, body: JSON.stringify({ error: err.message }) });
    });
    req.end();
  });
};
