const http = require('http');

const port = process.env.PORT || 3000;
const path = process.env.HEALTHCHECK_PATH || '/api/v1/health';

const options = {
  hostname: 'localhost',
  port: port,
  path: path,
  method: 'GET',
  timeout: 2000
};

const req = http.request(options, (res) => {
  if (res.statusCode === 200) {
    process.exit(0);
  } else {
    process.exit(1);
  }
});

req.on('error', () => {
  process.exit(1);
});

req.on('timeout', () => {
  req.destroy();
  process.exit(1);
});

req.end();
