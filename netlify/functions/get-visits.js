const https = require('https');

exports.handler = async () => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'public, max-age=120',
  };

  const { JSONBIN_VISITS_ID, JSONBIN_KEY } = process.env;
  if (!JSONBIN_VISITS_ID || !JSONBIN_KEY) {
    return { statusCode: 200, headers, body: JSON.stringify({ visits: [], configured: false }) };
  }

  return new Promise((resolve) => {
    const options = {
      hostname: 'api.jsonbin.io',
      path: `/v3/b/${JSONBIN_VISITS_ID}/latest`,
      method: 'GET',
      headers: { 'X-Master-Key': JSONBIN_KEY },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          const visits = Array.isArray(parsed.record?.visits) ? parsed.record.visits : [];
          resolve({ statusCode: 200, headers, body: JSON.stringify({ visits, configured: true }) });
        } catch {
          resolve({ statusCode: 200, headers, body: JSON.stringify({ visits: [], configured: true }) });
        }
      });
    });
    req.on('error', () => resolve({ statusCode: 200, headers, body: JSON.stringify({ visits: [], configured: true }) }));
    req.end();
  });
};
