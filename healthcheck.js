const http = require('http');

const port = process.env.PORT || 3000;
const path = process.env.HEALTHCHECK_PATH || '/api/v1/health';

const options = {
  hostname: 'localhost',
  port: port,
  path: path,
  method: 'GET',
  timeout: 5000
};

let dataReceived = false;

const req = http.request(options, (res) => {
  let body = '';
  
  res.on('data', (chunk) => {
    body += chunk;
    dataReceived = true;
  });
  
  res.on('end', () => {
    try {
      const response = JSON.parse(body);
      if (res.statusCode === 200 && response.status === 'ok') {
        process.exit(0);
      } else {
        console.error(`Health check failed: status=${res.statusCode}, body=${body}`);
        process.exit(1);
      }
    } catch (e) {
      console.error(`Failed to parse response: ${e.message}, body=${body}`);
      process.exit(1);
    }
  });
});

req.on('error', (err) => {
  console.error(`Health check request failed: ${err.message}`);
  process.exit(1);
});

req.on('timeout', () => {
  console.error('Health check timeout');
  req.destroy();
  process.exit(1);
});

req.setTimeout(5000);
req.end();
