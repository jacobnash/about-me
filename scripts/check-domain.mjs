#!/usr/bin/env node
/**
 * Print Firebase Hosting custom-domain status and required DNS records.
 */
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

function loadFirebase(subpath) {
  try {
    return require(require.resolve(`firebase-tools/lib/${subpath}`));
  } catch {
    return require(`/opt/homebrew/lib/node_modules/firebase-tools/lib/${subpath}`);
  }
}

const auth = loadFirebase('auth');
const { configstore } = loadFirebase('configstore');

const PROJECT = 'about-me-a66fd';
const SITE = 'about-me-a66fd';
const DOMAIN = 'jacob.nash.engineering';

async function getToken() {
  const tokens = configstore.get('tokens');
  if (!tokens?.refresh_token) throw new Error('Run `firebase login` first.');
  const { access_token } = await auth.getAccessToken(tokens.refresh_token, []);
  return access_token;
}

async function main() {
  const token = await getToken();
  const url = `https://firebasehosting.googleapis.com/v1beta1/projects/${PROJECT}/sites/${SITE}/customDomains/${encodeURIComponent(DOMAIN)}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const body = await res.json();
  if (!res.ok) {
    console.error(JSON.stringify(body, null, 2));
    process.exit(1);
  }

  console.log(`Domain: ${DOMAIN}`);
  console.log(`Host state: ${body.hostState}`);
  console.log(`Ownership: ${body.ownershipState}`);
  console.log(`Cert state: ${body.cert?.state ?? 'n/a'}`);
  console.log('\nRequired DNS records:\n');

  const groups = [body.requiredDnsUpdates?.desired, body.cert?.verification?.dns?.desired].filter(Boolean);
  for (const group of groups) {
    for (const entry of group) {
      for (const record of entry.records ?? []) {
        if (record.requiredAction === 'REMOVE') continue;
        const host =
          record.domainName === 'nash.engineering'
            ? '@'
            : record.domainName.replace(/\.nash\.engineering$/, '');
        console.log(`  ${record.type.padEnd(6)} ${host.padEnd(28)} ${record.rdata}`);
      }
    }
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
