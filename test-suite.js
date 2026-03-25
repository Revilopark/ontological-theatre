#!/usr/bin/env node
/**
 * Ontological Theatre — Automated Test Suite
 * Runs comprehensive checks on all pages, assets, and APIs
 * Called by cron, can also run manually: node test-suite.js
 */

const https = require('https');
const http = require('http');

const BASE = 'https://revilopark.github.io/ontological-theatre';
const PROXY = 'https://awareness-proxy-328246068140.us-central1.run.app';

const results = { pass: [], fail: [], warn: [] };
const log = (type, msg) => { results[type].push(msg); process.stdout.write(`[${type.toUpperCase()}] ${msg}\n`); };

function fetch(url, opts = {}) {
  return new Promise((resolve) => {
    const mod = url.startsWith('https') ? https : http;
    const req = mod.get(url, { timeout: 10000, ...opts }, (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => resolve({ status: res.statusCode, body: data, headers: res.headers }));
    });
    req.on('error', e => resolve({ status: 0, error: e.message }));
    req.on('timeout', () => { req.destroy(); resolve({ status: 0, error: 'TIMEOUT' }); });
  });
}

async function checkPage(name, path, opts = {}) {
  const r = await fetch(`${BASE}/${path}`);
  if (r.status === 200) {
    const size = r.body.length;
    if (opts.minSize && size < opts.minSize) {
      log('warn', `${name}: 200 but suspiciously small (${size} bytes)`);
    } else {
      log('pass', `${name}: 200 OK (${(size/1024).toFixed(0)}KB)`);
    }
    if (opts.mustContain) {
      for (const needle of opts.mustContain) {
        if (!r.body.includes(needle)) log('warn', `${name}: missing expected content "${needle.slice(0,40)}"`);
      }
    }
  } else {
    log('fail', `${name}: ${r.status || r.error}`);
  }
}

async function checkAsset(name, path) {
  const r = await fetch(`${BASE}/${path}`);
  if (r.status === 200) log('pass', `Asset ${name}: OK`);
  else log('fail', `Asset ${name}: ${r.status || r.error}`);
}

async function checkProxy(endpoint) {
  const r = await fetch(`${PROXY}${endpoint}`);
  if (r.status === 200 || r.status === 405) log('pass', `Proxy ${endpoint}: reachable (${r.status})`);
  else if (r.status === 503) log('fail', `Proxy ${endpoint}: 503 SERVICE UNAVAILABLE — needs restart`);
  else log('warn', `Proxy ${endpoint}: ${r.status || r.error}`);
}

async function run() {
  console.log(`\n=== ONTOLOGICAL THEATRE TEST SUITE ===`);
  console.log(`Time: ${new Date().toISOString()}\n`);

  // Core pages
  await checkPage('JLo Universe', 'jlo-universe.html', {
    minSize: 10_000_000,
    mustContain: ['const FAN_STORIES', 'DEMO_GALLERY', 'generateAll', 'openSettings', 'fan-stories']
  });
  await checkPage('Clarksdale Series', 'clarksdale-series.html', {
    minSize: 40_000_000,
    mustContain: ['const EPISODES', 'regenPanelInStyle', 'cs-panel-overrides', 'csGemini']
  });
  await checkPage('JLo Pitch', 'jlo-pitch.html', { minSize: 50_000 });
  await checkPage('JLo Infographic', 'jlo-infographic.html', { minSize: 50_000 });
  await checkPage('IAM Classroom', 'iam-classroom.html', { minSize: 200_000 });
  await checkPage('Panel Overrides JS', 'cs-panel-overrides.js', { minSize: 2000 });

  // Clarksdale panels (spot check all episodes)
  const panelSpots = [
    ['ep02-p1','cs-panels/ep02-p1.jpg'],['ep02-p6','cs-panels/ep02-p6.jpg'],
    ['ep06-p1','cs-panels/ep06-p1.jpg'],['ep09-p6','cs-panels/ep09-p6.jpg'],
    ['ep12-p1','cs-panels/ep12-p1.jpg'],['ep14-p6','cs-panels/ep14-p6.jpg'],
    ['ep15-p8','cs-panels/ep15-p8.jpg'],
  ];
  for (const [name, path] of panelSpots) await checkAsset(name, path);

  // JLo story backgrounds
  const stories = ['story-block-girl','story-torch','story-mixed-girl','story-flag','story-oscar','story-album','story-reclaim'];
  for (const s of stories) await checkAsset(s, `jlo-stories/${s}.jpg`);

  // Image test panels
  for (let i = 1; i <= 5; i++) {
    await checkAsset(`cs-test-${i}`, `test-panels/cs-test-${i}.jpg`);
    await checkAsset(`jlo-test-${i}`, `test-panels/jlo-test-${i}.jpg`);
  }

  // Proxy health
  await checkProxy('/health');
  await checkProxy('/gemini/generate');

  // Summary
  console.log(`\n=== RESULTS ===`);
  console.log(`PASS: ${results.pass.length}  WARN: ${results.warn.length}  FAIL: ${results.fail.length}`);

  if (results.fail.length > 0) {
    console.log('\nFAILURES:');
    results.fail.forEach(f => console.log(`  ✗ ${f}`));
  }
  if (results.warn.length > 0) {
    console.log('\nWARNINGS:');
    results.warn.forEach(w => console.log(`  ⚠ ${w}`));
  }

  return { pass: results.pass.length, warn: results.warn.length, fail: results.fail.length, failures: results.fail, warnings: results.warn };
}

module.exports = { run };
if (require.main === module) run().then(r => process.exit(r.fail > 0 ? 1 : 0));
