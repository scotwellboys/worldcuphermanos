const https = require('https');

function fdRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.football-data.org',
      path,
      method: 'GET',
      headers: { 'X-Auth-Token': process.env.FDORG_KEY },
    };
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, json: JSON.parse(body) }); }
        catch { resolve({ status: res.statusCode, json: null }); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

exports.handler = async () => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'public, max-age=45',
  };

  if (!process.env.FDORG_KEY) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'FDORG_KEY environment variable not set in Netlify.' }) };
  }

  try {
    const [matchesRes, standingsRes] = await Promise.all([
      fdRequest('/v4/competitions/WC/matches?season=2026'),
      fdRequest('/v4/competitions/WC/standings?season=2026'),
    ]);

    if (matchesRes.status !== 200) {
      return { statusCode: matchesRes.status, headers, body: JSON.stringify(matchesRes.json || { error: 'API error' }) };
    }

    const result = {
      matches: matchesRes.json?.matches || [],
      standings: standingsRes.status === 200 ? (standingsRes.json?.standings || []) : [],
    };

    return { statusCode: 200, headers, body: JSON.stringify(result) };
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
  }
};
