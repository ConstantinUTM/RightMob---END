import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

const file = path.join(process.cwd(), 'server', 'tmp-upload.json');
const body = fs.readFileSync(file, 'utf8');

(async () => {
  try {
    const res = await fetch('http://localhost:3001/api/gallery/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-token': 'testtoken' },
      body
    });
    const text = await res.text();
    console.log('STATUS', res.status);
    console.log(text);
  } catch (e) {
    console.error('ERR', e);
  }
})();
