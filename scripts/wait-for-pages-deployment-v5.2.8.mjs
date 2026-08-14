const repository = process.env.GITHUB_REPOSITORY;
const sha = process.env.GITHUB_SHA;
const token = process.env.GITHUB_TOKEN;
const liveUrl = process.env.TEMPLE_LIVE_URL || 'https://christus-rex.github.io/temple-of-maat/';
const expectedVersion = process.env.TEMPLE_EXPECTED_VERSION || '5.2.8';
const expectedBuild = process.env.TEMPLE_EXPECTED_BUILD || '2026-08-14-v5.2.8-library-journey-offline-hardening';
const pagesTimeoutMs = Number(process.env.TEMPLE_PAGES_TIMEOUT_MS || 10 * 60 * 1000);
const liveTimeoutMs = Number(process.env.TEMPLE_LIVE_TIMEOUT_MS || 3 * 60 * 1000);
const pollMs = 5000;

if (!repository || !sha || !token) {
  throw new Error('Exact-SHA Pages wait requires GITHUB_REPOSITORY, GITHUB_SHA, and GITHUB_TOKEN.');
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function githubJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28'
    },
    cache: 'no-store'
  });
  if (!response.ok) throw new Error(`GitHub API ${response.status} while waiting for Pages: ${await response.text()}`);
  return response.json();
}

async function waitForExactPagesRun() {
  const deadline = Date.now() + pagesTimeoutMs;
  let last = null;
  while (Date.now() < deadline) {
    const endpoint = `https://api.github.com/repos/${repository}/actions/runs?head_sha=${encodeURIComponent(sha)}&per_page=50`;
    const data = await githubJson(endpoint);
    const candidates = (data.workflow_runs || [])
      .filter((run) => run.name === 'pages build and deployment' && run.head_sha === sha)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const run = candidates[0] || null;
    last = run;

    if (run?.status === 'completed') {
      if (run.conclusion !== 'success') {
        throw new Error(`Pages deployment for ${sha} completed with ${run.conclusion}: ${run.html_url}`);
      }
      return {
        id: run.id,
        htmlUrl: run.html_url,
        headSha: run.head_sha,
        conclusion: run.conclusion,
        updatedAt: run.updated_at
      };
    }

    await sleep(pollMs);
  }
  throw new Error(`Timed out waiting for Pages deployment of ${sha}. Last observed run: ${JSON.stringify(last)}`);
}

async function waitForLiveIdentity() {
  const deadline = Date.now() + liveTimeoutMs;
  const versionUrl = new URL('./version.json', liveUrl);
  let last = null;
  while (Date.now() < deadline) {
    try {
      versionUrl.searchParams.set('deployed_wait', `${Date.now()}-${sha.slice(0, 12)}`);
      const response = await fetch(versionUrl, { cache: 'no-store' });
      if (response.ok) {
        const data = await response.json();
        last = data;
        if (data.version === expectedVersion && data.build === expectedBuild) return data;
      } else {
        last = { status: response.status };
      }
    } catch (error) {
      last = { error: error.message };
    }
    await sleep(pollMs);
  }
  throw new Error(`Pages reported success for ${sha}, but live version identity never reached ${expectedVersion} / ${expectedBuild}. Last observed: ${JSON.stringify(last)}`);
}

const pages = await waitForExactPagesRun();
const live = await waitForLiveIdentity();
console.log(JSON.stringify({ ok: true, repository, sha, pages, liveUrl, live }, null, 2));
