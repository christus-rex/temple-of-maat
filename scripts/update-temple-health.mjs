const repository = process.env.GITHUB_REPOSITORY || 'christus-rex/temple-of-maat';
const token = process.env.GITHUB_TOKEN;
const component = process.env.TEMPLE_HEALTH_COMPONENT;
const rawStatus = process.env.TEMPLE_HEALTH_STATUS;
const commit = process.env.TEMPLE_HEALTH_COMMIT || process.env.GITHUB_SHA || null;
const runUrl = process.env.TEMPLE_HEALTH_RUN_URL || null;
const recordUrl = process.env.TEMPLE_HEALTH_RECORD_URL || null;
const updatedAt = process.env.TEMPLE_HEALTH_UPDATED_AT || new Date().toISOString();
const releaseVersion = process.env.TEMPLE_RELEASE_VERSION || null;
const releaseBuild = process.env.TEMPLE_RELEASE_BUILD || null;
const branch = process.env.TEMPLE_HEALTH_BRANCH || 'temple-status';
const path = process.env.TEMPLE_HEALTH_PATH || 'temple-health.json';

if (!token) throw new Error('GITHUB_TOKEN is required to update the Temple health record.');
if (!['ci', 'pages', 'deployed_visual'].includes(component)) throw new Error(`Unsupported TEMPLE_HEALTH_COMPONENT: ${component}`);
if (!rawStatus) throw new Error('TEMPLE_HEALTH_STATUS is required.');

function normalizeStatus(type, value) {
  const status = String(value || '').trim().toLowerCase();
  if (type === 'pages') {
    if (['success', 'succeed', 'succeeded', 'built', 'deployed'].includes(status)) return 'success';
    if (['error', 'errored', 'failure', 'failed'].includes(status)) return 'failure';
    if (['pending', 'queued', 'building', 'in_progress', 'in-progress'].includes(status)) return 'pending';
  }
  if (['success', 'succeed', 'succeeded'].includes(status)) return 'success';
  if (['error', 'errored', 'failure', 'failed'].includes(status)) return 'failure';
  return status || 'unknown';
}

const status = normalizeStatus(component, rawStatus);
const apiBase = `https://api.github.com/repos/${repository}/contents/${path}`;
const headers = {
  Accept: 'application/vnd.github+json',
  Authorization: `Bearer ${token}`,
  'X-GitHub-Api-Version': '2022-11-28'
};

async function githubJson(url, options = {}) {
  const response = await fetch(url, { ...options, headers: { ...headers, ...(options.headers || {}) }, cache: 'no-store' });
  if (!response.ok) {
    const body = await response.text();
    const error = new Error(`GitHub API ${response.status}: ${body}`);
    error.status = response.status;
    throw error;
  }
  return response.json();
}

function decode(content) {
  return Buffer.from(String(content || '').replace(/\n/g, ''), 'base64').toString('utf8');
}

function encode(content) {
  return Buffer.from(content, 'utf8').toString('base64');
}

function patchHealth(current) {
  const next = structuredClone(current || {});
  next.schema = 2;
  next.repository = repository;
  next.source_branch = 'main';
  next.status_branch = branch;
  next.live_url = next.live_url || 'https://christus-rex.github.io/temple-of-maat/';
  next.release = next.release || {};
  if (releaseVersion) next.release.version = releaseVersion;
  if (releaseBuild) next.release.build = releaseBuild;

  const record = {
    ...(next[component] || {}),
    status,
    commit,
    updated_at: updatedAt
  };
  if (component === 'pages') {
    record.raw_status = rawStatus;
    record.record_url = recordUrl;
  } else {
    record.run_url = runUrl;
  }
  next[component] = record;

  if (component === 'ci') {
    next.connector = {
      status,
      commit,
      updated_at: updatedAt,
      context: 'temple/connector-ci',
      run_url: runUrl
    };
    if (status === 'success') {
      next.last_successful_validation = { commit, updated_at: updatedAt, run_url: runUrl };
    }
  }

  if (component === 'deployed_visual') {
    next.live_smoke = {
      status,
      commit,
      updated_at: updatedAt,
      context: 'temple/live-smoke',
      run_url: runUrl
    };
    if (status === 'success') {
      next.last_successful_live_smoke = { commit, updated_at: updatedAt, run_url: runUrl };
    }
  }

  const ciCommit = next.ci?.commit || null;
  const pagesCommit = next.pages?.commit || null;
  const liveSmoke = next.live_smoke || next.deployed_visual || null;
  const liveCommit = liveSmoke?.commit || null;
  const sameCommit = Boolean(ciCommit && ciCommit === pagesCommit && ciCommit === liveCommit);
  next.green_release = Boolean(
    sameCommit &&
    next.ci?.status === 'success' &&
    next.pages?.status === 'success' &&
    liveSmoke?.status === 'success'
  );
  next.green_release_commit = next.green_release ? ciCommit : null;
  next.updated_at = new Date().toISOString();
  return next;
}

let lastError = null;
for (let attempt = 1; attempt <= 4; attempt += 1) {
  try {
    const meta = await githubJson(`${apiBase}?ref=${encodeURIComponent(branch)}`);
    const current = JSON.parse(decode(meta.content));
    const next = patchHealth(current);
    const body = {
      message: `Update Temple health: ${component} ${status}`,
      content: encode(`${JSON.stringify(next, null, 2)}\n`),
      sha: meta.sha,
      branch
    };
    await githubJson(apiBase, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    console.log(JSON.stringify({ ok: true, component, rawStatus, status, commit, green_release: next.green_release, green_release_commit: next.green_release_commit }, null, 2));
    process.exit(0);
  } catch (error) {
    lastError = error;
    if (![409, 422].includes(error.status) || attempt === 4) break;
    await new Promise((resolve) => setTimeout(resolve, attempt * 750));
  }
}

throw lastError;
