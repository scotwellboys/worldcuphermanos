const https = require('https');

exports.handler = async (event) => {
  const apiKey = process.env.FDORG_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'FDORG_KEY environment variable not set in Netlify.' }),
    };
  }

  return new Promise((resolve) => {
    const options = {
      hostname: 'api.football-data.org',
      path: '/v4/competitions/WC/matches?season=2026',
      method: 'GET',
      headers: { 'X-Auth-Token': apiKey },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, max-age=45',
          },
          body,
        });
      });
    });

    req.on('error', (err) => {
      resolve({
        statusCode: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: err.message }),
      });
    });

    req.end();
  });
};
