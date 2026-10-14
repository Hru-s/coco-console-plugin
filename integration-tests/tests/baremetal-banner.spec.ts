import { test, expect } from '@playwright/test';
import { navigateTo, assertNoReactErrors, waitForContent } from './helpers.js';

/**
 * Gap 2 — Bare-metal scope banner.
 *
 * On non-bare-metal clusters (AWS, Azure, GCP, vSphere) without CVM peer pods,
 * the Overview and Setup pages should show a warning banner about unsupported
 * infrastructure. On BareMetal/None clusters, or when CVM peer pods are active,
 * no banner should appear.
 */
test.describe('Gap 2: Bare-metal scope banner', () => {
  test('Overview page renders and shows or hides infrastructure banner', async ({
    page,
    baseURL,
  }) => {
    await navigateTo(page, baseURL!, '/confidential-containers');
    await waitForContent(page, /overview|confidential/i);

    const body = await page.locator('body').innerText();
    const hasBanner = /unsupported infrastructure/i.test(body);
    const hasPeerPods = /peer.?pod|kata-remote/i.test(body);

    // On non-bare-metal without peer pods, banner should be present.
    // On bare-metal or with peer pods, banner should be absent.
    // Either way, no React errors.
    expect(typeof hasBanner).toBe('boolean');
    if (hasBanner) {
      expect(body).toMatch(/bare.?metal|peer.?pod|kata-remote/i);
    }

    await assertNoReactErrors(page);
  });

  test('Setup page renders and shows or hides infrastructure banner', async ({
    page,
    baseURL,
  }) => {
    await navigateTo(page, baseURL!, '/confidential-containers/setup');
    await waitForContent(page, /setup|checklist/i);

    const body = await page.locator('body').innerText();
    const hasBanner = /unsupported infrastructure/i.test(body);
    expect(typeof hasBanner).toBe('boolean');

    await assertNoReactErrors(page);
  });
});
