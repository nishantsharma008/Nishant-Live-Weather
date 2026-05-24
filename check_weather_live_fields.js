const http = require('http');

const url = 'http://localhost:3000/api/weather?city=30.7811,76.6168';

http.get(url, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const d = JSON.parse(data);
      console.log('response keys:', Object.keys(d));
      console.log('success:', d.success);
      console.log('error:', d.error);

      if (Array.isArray(d.hourly)) {
        console.log('hourly length:', d.hourly.length);
        console.log('hourly[0] keys:', d.hourly[0] ? Object.keys(d.hourly[0]) : null);
        console.log('hourly[0]:', d.hourly[0]);
      } else {
        console.log('hourly is not an array:', typeof d.hourly);
      }

      process.exit(0);
    } catch (e) {
      console.error('Failed to parse JSON:', e);
      process.exit(1);
    }
  });
}).on('error', (e) => {
  console.error('Request failed:', e);
  process.exit(1);
});
