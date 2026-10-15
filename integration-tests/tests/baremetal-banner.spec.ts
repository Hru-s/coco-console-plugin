import { test, expect } from '@playwright/test';
import {
  navigateTo,
  assertNoReactErrors,
  waitForContent,
} from './helpers.js';
import { oc, ocAvailable } from './cluster.js';

const expectedBannerVisibility = (): boolean | null => {
  if (!ocAvailable()) return null;

  try {
    const infra = JSON.parse(
      oc('get infrastructure cluster -o json'),
    );

    const platform =
      infra.status?.platformStatus?.type ??
      infra.status?.platform;

    if (!platform) return null;

    const rawConfigMap = oc(
      'get configmap peer-pods-cm -n openshift-sandboxed-containers-operator --ignore-not-found -o json',
    );

    const data = rawConfigMap
      ? JSON.parse(rawConfigMap).data ?? {}
      : {};

    const cvmPeerPods =
      Boolean(data.CLOUD_PROVIDER) &&
      data.DISABLECVM !== 'true';

    return (
      platform !== 'BareMetal' &&
      platform !== 'None' &&
      !cvmPeerPods
    );
  } catch {
    return null;
  }
};

test.describe('Gap 2: Bare-metal scope banner', () => {
  const cases = [
    {
      name: 'Overview',
      path: '/confidential-containers',
      content: /overview|confidential/i,
    },
    {
      name: 'Setup',
      path: '/confidential-containers/setup',
      content: /setup|checklist/i,
    },
  ];

  for (const item of cases) {
    test(`${item.name} banner matches cluster state`, async ({
      page,
      baseURL,
    }) => {
      const expected = expectedBannerVisibility();

      if (expected === null) {
        test.skip(
          true,
          'Cluster platform or peer-pods state unavailable',
        );
        return;
      }

      await navigateTo(page, baseURL!, item.path);
      await waitForContent(page, item.content);

      const banner = page.getByText(
        'Unsupported infrastructure',
        { exact: true },
      );

      if (expected) {
        await expect(banner).toBeVisible();
      } else {
        await expect(banner).toHaveCount(0);
      }

      await assertNoReactErrors(page);
    });
  }
});
