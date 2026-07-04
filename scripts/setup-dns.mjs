#!/usr/bin/env node
/**
 * Add jacob.nash.engineering DNS records at Namecheap (preserves existing hosts).
 *
 * Required env:
 *   NAMECHEAP_API_USER
 *   NAMECHEAP_API_KEY
 *   NAMECHEAP_USERNAME
 *   NAMECHEAP_CLIENT_IP   (whitelisted IP at namecheap.com → Profile → Tools → API Access)
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

const SLD = 'nash';
const TLD = 'engineering';
const DOMAIN = 'jacob.nash.engineering';
const PROJECT = 'about-me-a66fd';
const SITE = 'about-me-a66fd';

function env(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

function parseXmlHosts(xml) {
  const hosts = [];
  const blockRe = /<host\s+([^>]+)\/>/g;
  for (const match of xml.matchAll(blockRe)) {
    const attrs = Object.fromEntries(
      [...match[1].matchAll(/(\w+)="([^"]*)"/g)].map((m) => [m[1], m[2]]),
    );
    hosts.push({
      name: attrs.Name,
      type: attrs.Type,
      address: attrs.Address,
      ttl: attrs.TTL || '1800',
      mxPref: attrs.MXPref,
    });
  }
  return hosts;
}

function hostKey(host) {
  return `${host.name}|${host.type}|${host.address}`;
}

async function namecheapApi(command, extra = {}) {
  const params = new URLSearchParams({
    ApiUser: env('NAMECHEAP_API_USER'),
    ApiKey: env('NAMECHEAP_API_KEY'),
    UserName: env('NAMECHEAP_USERNAME'),
    ClientIp: env('NAMECHEAP_CLIENT_IP'),
    Command: command,
    ...extra,
  });
  const res = await fetch(`https://api.namecheap.com/xml.response?${params}`);
  const text = await res.text();
  if (!text.includes('Status="OK"')) {
    throw new Error(`Namecheap ${command} failed:\n${text}`);
  }
  return text;
}

async function getFirebaseDnsRecords() {
  const tokens = configstore.get('tokens');
  if (!tokens?.refresh_token) throw new Error('Run `firebase login` first.');
  const { access_token } = await auth.getAccessToken(tokens.refresh_token, []);
  const url = `https://firebasehosting.googleapis.com/v1beta1/projects/${PROJECT}/sites/${SITE}/customDomains/${encodeURIComponent(DOMAIN)}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${access_token}` } });
  const body = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(body));

  const records = [];
  const groups = [body.requiredDnsUpdates?.desired, body.cert?.verification?.dns?.desired].filter(Boolean);
  for (const group of groups) {
    for (const entry of group) {
      for (const record of entry.records ?? []) {
        if (record.requiredAction === 'REMOVE') continue;
        const fqdn = record.domainName;
        const host = fqdn === 'nash.engineering' ? '@' : fqdn.replace(/\.nash\.engineering$/, '');
        records.push({ host, type: record.type, address: record.rdata });
      }
    }
  }
  return records;
}

async function main() {
  const desired = await getFirebaseDnsRecords();
  const existingXml = await namecheapApi('namecheap.domains.dns.getHosts', { SLD, TLD });
  const existing = parseXmlHosts(existingXml);
  const merged = [...existing];
  const keys = new Set(existing.map(hostKey));

  for (const record of desired) {
    const host = { name: record.host, type: record.type, address: record.address, ttl: '1800' };
    if (!keys.has(hostKey(host))) {
      merged.push(host);
      keys.add(hostKey(host));
    }
  }

  const params = { SLD, TLD };
  merged.forEach((host, index) => {
    const n = index + 1;
    params[`HostName${n}`] = host.name;
    params[`RecordType${n}`] = host.type;
    params[`Address${n}`] = host.address;
    params[`TTL${n}`] = host.ttl;
    if (host.mxPref) params[`MXPref${n}`] = host.mxPref;
  });

  await namecheapApi('namecheap.domains.dns.setHosts', params);
  console.log(`Updated ${SLD}.${TLD} with ${merged.length} records (${desired.length} from Firebase).`);
  for (const record of desired) {
    console.log(`  ${record.type} ${record.host} → ${record.address}`);
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
