import { expect, test } from '@grafana/plugin-e2e';

import { CloudMonitoringOptions } from '../../src/types/types';

const PLUGIN_TYPE = 'stackdriver';
const PROVISIONED_FILE = 'datasources.yml';

const DS_AUTHN_TYPE = process.env.DS_INSTANCE_AUTHN_TYPE ?? 'jwt';
const DS_DEFAULT_PROJECT = process.env.DS_INSTANCE_DEFAULT_PROJECT ?? 'example-project-id';
const DS_CLIENT_EMAIL =
  process.env.DS_INSTANCE_CLIENT_EMAIL ??
  'example-account@example-project-id.iam.gserviceaccount.com';
const DS_TOKEN_URI = process.env.DS_INSTANCE_TOKEN_URI ?? 'https://oauth2.googleapis.com/token';

test.describe('Config editor', () => {
  test.describe('rendering', () => {
    test(
      'smoke: should render config editor',
      { tag: '@plugins' },
      async ({ createDataSourceConfigPage, page }) => {
        await createDataSourceConfigPage({ type: PLUGIN_TYPE });

        await expect(page.getByText(/^Type\s*Google Cloud Monitoring$/, { exact: true })).toBeVisible();
        await expect(page.getByText('Authentication type', { exact: true })).toBeVisible();
      }
    );

    test('should render Authentication section', async ({ createDataSourceConfigPage, page }) => {
      await createDataSourceConfigPage({ type: PLUGIN_TYPE });

      const authSection = page.getByText('Authentication', { exact: true }).first();
      await authSection.scrollIntoViewIfNeeded();
      await expect(authSection).toBeVisible();

      await expect(page.getByRole('radio', { name: 'JWT button' })).toBeChecked();
      await expect(page.getByRole('radio', { name: 'GCE button' })).not.toBeChecked();
    });

    test('should render JWT Key Details section', async ({ createDataSourceConfigPage, page }) => {
      await createDataSourceConfigPage({ type: PLUGIN_TYPE });

      const jwtSection = page.getByText('JWT Key Details', { exact: true });
      await jwtSection.scrollIntoViewIfNeeded();
      await expect(jwtSection).toBeVisible();

      await expect(page.getByRole('button', { name: 'Paste JWT Token' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Fill In JWT Token manually' })).toBeVisible();
    });
  });

  test.describe('provisioned datasource', () => {
    test('should load provisioned JWT key details', async ({
      readProvisionedDataSource,
      gotoDataSourceConfigPage,
      page,
    }) => {
      // The config editor will only load provisioned values if the JWT is valid.
      // The provisioning file committed to the repo does not contain a real JWT,
      // so this test is skipped for local runs.
      test.skip(
        !process.env.DS_INSTANCE_PRIVATE_KEY,
        'Requires valid Google Cloud credentials — set DS_INSTANCE_PRIVATE_KEY or run in CI'
      );
      const ds = await readProvisionedDataSource<CloudMonitoringOptions>({ fileName: PROVISIONED_FILE });
      await gotoDataSourceConfigPage(ds.uid);

      await expect(page.getByRole('radio', { name: 'JWT button' })).toBeChecked();
      await expect(page.getByRole('textbox', { name: 'Project ID' })).toHaveValue(DS_DEFAULT_PROJECT);
      await expect(page.getByRole('textbox', { name: 'Client email' })).toHaveValue(DS_CLIENT_EMAIL);
      await expect(page.getByRole('textbox', { name: 'Token URI' })).toHaveValue(DS_TOKEN_URI);
      await expect(page.getByRole('textbox', { name: 'Private key' })).toHaveValue('configured');
    });
  });

  test.describe('save & test', () => {
    test('should pass health check for provisioned datasource', async ({
      readProvisionedDataSource,
      gotoDataSourceConfigPage,
      page,
    }) => {
      // The config editor will only load provisioned values if the JWT is valid.
      // The provisioning file committed to the repo does not contain a real JWT,
      // so this test is skipped for local runs.
      test.skip(
        !process.env.DS_INSTANCE_PRIVATE_KEY,
        'Requires valid Google Cloud credentials — set DS_INSTANCE_PRIVATE_KEY or run in CI'
      );
      const ds = await readProvisionedDataSource<CloudMonitoringOptions>({ fileName: PROVISIONED_FILE });
      const configPage = await gotoDataSourceConfigPage(ds.uid);

      await page.getByRole('button', { name: /Save & test|Test/ }).click();
      await expect(configPage).toHaveAlert('success', { timeout: 30000 });
    });

    test('should show error alert when health check fails', async ({ createDataSourceConfigPage, page }) => {
      const configPage = await createDataSourceConfigPage({ type: PLUGIN_TYPE });
      await page.route(/\/api\/datasources\/.*\/health/, async (route) => {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Invalid credentials' }),
        });
      });
      await page.getByRole('button', { name: /Save & test|Test/ }).click();
      await expect(configPage).toHaveAlert('error');
    });

    test('should show error alert when backend is unreachable', async ({ createDataSourceConfigPage, page }) => {
      const configPage = await createDataSourceConfigPage({ type: PLUGIN_TYPE });
      await page.route(/\/api\/datasources\/.*\/health/, async (route) => {
        await route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Could not connect to Google Cloud Monitoring API' }),
        });
      });
      await page.getByRole('button', { name: /Save & test|Test/ }).click();
      await expect(configPage).toHaveAlert('error');
    });
  });
});
