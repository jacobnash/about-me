import { access } from 'node:fs/promises';

const required = [
  'web/public/index.html',
  'web/public/resume.html',
  'web/public/cv.html',
  'web/public/css/styles.css',
  'firebase.json',
  '.firebaserc',
];

for (const file of required) {
  await access(file);
}

console.log('Hosting bundle validation passed.');
