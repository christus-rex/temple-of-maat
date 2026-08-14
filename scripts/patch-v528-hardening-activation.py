#!/usr/bin/env python3
from pathlib import Path

path = Path('scripts/smoke-release-hardening-v5.2.8.mjs')
source = path.read_text(encoding='utf-8')

source = source.replace(
    "return await page.evaluate(async ({ currentNamespace }) => {",
    "return await page.evaluate(async ({ currentNamespace, priorNamespace }) => {",
    1,
)

old = """    const activeRegistration = await navigator.serviceWorker.getRegistration('./');
    const cachesNow = await caches.keys();
    return {
      before,
      after: navigator.serviceWorker.controller?.scriptURL || '',
      active: activeRegistration?.active?.scriptURL || '',
      caches: cachesNow,
      currentCachePresent: cachesNow.some((name) => name.startsWith(currentNamespace)),
      priorCachePresent: cachesNow.some((name) => name.includes('v5.2.7-prior-release-fixture'))
    };
  }, { currentNamespace: CURRENT_NAMESPACE });
"""
new = """    // controllerchange can fire while the new worker is still finishing activate-event
    // cleanup. Wait for the worker to reach activated and for the prior namespace to
    // disappear before judging the update contract.
    let activeRegistration = null;
    let cachesNow = [];
    const cleanupDeadline = Date.now() + 90000;
    while (Date.now() < cleanupDeadline) {
      activeRegistration = await navigator.serviceWorker.getRegistration('./');
      cachesNow = await caches.keys();
      const activeReady = activeRegistration?.active?.state === 'activated';
      const priorCachePresent = cachesNow.some((name) => name.includes(priorNamespace));
      if (activeReady && !priorCachePresent) break;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    return {
      before,
      after: navigator.serviceWorker.controller?.scriptURL || '',
      active: activeRegistration?.active?.scriptURL || '',
      activeState: activeRegistration?.active?.state || '',
      caches: cachesNow,
      currentCachePresent: cachesNow.some((name) => name.startsWith(currentNamespace)),
      priorCachePresent: cachesNow.some((name) => name.includes(priorNamespace))
    };
  }, { currentNamespace: CURRENT_NAMESPACE, priorNamespace: PRIOR_NAMESPACE });
"""
if old not in source:
    raise SystemExit('Activation result block not found')
source = source.replace(old, new, 1)

old = """  const prior = await installPriorWorker(page);
  const upgrade = await upgradeToCurrentWorker(page);
  if (!prior.controller.includes('__prior-v527-sw.js')) throw new Error(`Prior worker never controlled the test origin: ${JSON.stringify(prior)}`);
"""
new = """  const prior = await installPriorWorker(page);
  const upgrade = await upgradeToCurrentWorker(page);
  fs.writeFileSync(path.join(outDir, 'service-worker-upgrade.json'), JSON.stringify({ prior, upgrade }, null, 2));
  await page.screenshot({ path: path.join(outDir, 'service-worker-upgrade-state.png'), fullPage: false });
  if (!prior.controller.includes('__prior-v527-sw.js')) throw new Error(`Prior worker never controlled the test origin: ${JSON.stringify(prior)}`);
"""
if old not in source:
    raise SystemExit('Upgrade evidence insertion point not found')
source = source.replace(old, new, 1)

old = """  if (!upgrade.after.endsWith('/sw.js') || !upgrade.active.endsWith('/sw.js') || !upgrade.currentCachePresent || upgrade.priorCachePresent) {
"""
new = """  if (!upgrade.after.endsWith('/sw.js') || !upgrade.active.endsWith('/sw.js') || upgrade.activeState !== 'activated' || !upgrade.currentCachePresent || upgrade.priorCachePresent) {
"""
if old not in source:
    raise SystemExit('Upgrade assertion block not found')
source = source.replace(old, new, 1)

old = """    upgradedToCurrentWorker: upgrade.after.endsWith('/sw.js') && upgrade.active.endsWith('/sw.js') && upgrade.currentCachePresent && !upgrade.priorCachePresent,
"""
new = """    upgradedToCurrentWorker: upgrade.after.endsWith('/sw.js') && upgrade.active.endsWith('/sw.js') && upgrade.activeState === 'activated' && upgrade.currentCachePresent && !upgrade.priorCachePresent,
"""
if old not in source:
    raise SystemExit('Upgrade result assertion marker not found')
source = source.replace(old, new, 1)

path.write_text(source, encoding='utf-8')
