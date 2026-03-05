import { expect, test } from '@grafana/plugin-e2e';

test(
  'smoke: should render config editor',
  {
    tag: '@plugins',
  },
  async ({ createDataSourceConfigPage, page }) => {
    await createDataSourceConfigPage({ type: 'stackdriver' });

    await expect(await page.getByText('Type: Google Cloud Monitoring', { exact: true })).toBeVisible();
    await expect(await page.getByText('Google JWT File', { exact: true })).toBeVisible();
  }
);
