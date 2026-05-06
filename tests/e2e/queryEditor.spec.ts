import { expect, test } from '@grafana/plugin-e2e';

import { CloudMonitoringOptions } from '../../src/types/types';

const PLUGIN_TYPE = 'stackdriver';
const PROVISIONED_FILE = 'datasources.yml';

const DS_DEFAULT_PROJECT = process.env.DS_INSTANCE_DEFAULT_PROJECT ?? 'example-project-id';

function exploreUrl(uid: string, queryType: string, queryPayload: Record<string, unknown> = {}): string {
  const panes = {
    e1p: {
      datasource: uid,
      queries: [
        {
          refId: 'A',
          datasource: { type: PLUGIN_TYPE, uid },
          queryType,
          ...queryPayload,
        },
      ],
      range: { from: 'now-1h', to: 'now' },
    },
  };
  return `/explore?schemaVersion=1&panes=${encodeURIComponent(JSON.stringify(panes))}&orgId=1`;
}

function builderModeUrl(uid: string): string {
  return exploreUrl(uid, 'timeSeriesList', {
    timeSeriesList: {
      projectName: DS_DEFAULT_PROJECT,
      filters: [],
      view: 'FULL',
      crossSeriesReducer: 'REDUCE_NONE',
      alignmentPeriod: 'cloud-monitoring-auto',
      perSeriesAligner: 'ALIGN_MEAN',
      groupBys: [],
    },
  });
}

test.describe('Query editor', () => {
  test(
    'smoke: renders all query type options',
    { tag: '@plugins' },
    async ({ readProvisionedDataSource, page }) => {
      const ds = await readProvisionedDataSource<CloudMonitoringOptions>({ fileName: PROVISIONED_FILE });
      await page.goto(builderModeUrl(ds.uid));

      await expect(page.getByText('Query type:', { exact: true })).toBeVisible();
      await page.getByRole('combobox', { name: /Query type/ }).click();

      await expect(page.getByRole('option', { name: 'Builder', exact: true })).toBeVisible();
      await expect(page.getByRole('option', { name: 'MQL', exact: true })).toBeVisible();
      await expect(page.getByRole('option', { name: 'Service Level Objectives (SLO)', exact: true })).toBeVisible();
      await expect(page.getByRole('option', { name: 'PromQL', exact: true })).toBeVisible();
    }
  );

  test.describe('Builder mode', () => {
    test('shows expected fields', async ({ readProvisionedDataSource, page }) => {
      const ds = await readProvisionedDataSource<CloudMonitoringOptions>({ fileName: PROVISIONED_FILE });
      await page.goto(builderModeUrl(ds.uid));

      await expect(page.getByRole('combobox', { name: 'Project', exact: true })).toBeVisible();
      await expect(page.getByRole('combobox', { name: 'Service', exact: true })).toBeVisible();
      await expect(page.getByText('Metric name', { exact: true })).toBeVisible();
      await expect(page.getByText('Filter', { exact: true })).toBeVisible();
      await expect(page.getByText('Pre-processing', { exact: true })).toBeVisible();
      await expect(page.getByRole('combobox', { name: 'Group by', exact: true })).toBeVisible();
      await expect(page.getByRole('combobox', { name: 'Group by function', exact: true })).toBeVisible();
      await expect(page.getByRole('combobox', { name: 'Alignment function', exact: true })).toBeVisible();
      await expect(page.getByRole('combobox', { name: 'Alignment period', exact: true })).toBeVisible();
      await expect(page.getByRole('textbox', { name: 'Alias by', exact: true })).toBeVisible();
    });

    test('can select a service and metric name', async ({ readProvisionedDataSource, page }) => {
      const ds = await readProvisionedDataSource<CloudMonitoringOptions>({ fileName: PROVISIONED_FILE });
      await page.goto(builderModeUrl(ds.uid));

      await page.getByRole('combobox', { name: 'Service', exact: true }).click();
      await page.getByRole('option', { name: 'Compute', exact: true }).click();

      await expect(page.getByRole('combobox', { name: 'Metric name', exact: true })).toBeVisible();
      await page.getByRole('combobox', { name: 'Metric name', exact: true }).click();
      await page.getByRole('option', { name: 'compute.googleapis.com/instance/cpu/utilization' }).click();
    });
  });

  test.describe('MQL mode', () => {
    test('shows expected fields', async ({ readProvisionedDataSource, page }) => {
      const ds = await readProvisionedDataSource<CloudMonitoringOptions>({ fileName: PROVISIONED_FILE });
      await page.goto(builderModeUrl(ds.uid));

      await expect(page.getByText('Query type:', { exact: true })).toBeVisible();
      await page.getByRole('combobox', { name: /Query type/ }).click();
      await page.getByRole('option', { name: 'MQL', exact: true }).click();

      await expect(page.getByRole('combobox', { name: 'Project', exact: true })).toBeVisible();
      await expect(page.getByRole('textbox', { name: 'Alias by', exact: true })).toBeVisible();
      await expect(page.getByRole('textbox', { name: /Cloud Monitoring MQL query/ })).toBeVisible();
      await expect(page.getByText('Graph period', { exact: true })).toBeVisible();
    });

    test('can enter a MQL query string', async ({ readProvisionedDataSource, page }) => {
      const ds = await readProvisionedDataSource<CloudMonitoringOptions>({ fileName: PROVISIONED_FILE });
      await page.goto(builderModeUrl(ds.uid));

      await expect(page.getByText('Query type:', { exact: true })).toBeVisible();
      await page.getByRole('combobox', { name: /Query type/ }).click();
      await page.getByRole('option', { name: 'MQL', exact: true }).click();

      const mqlQuery = 'fetch gce_instance::compute.googleapis.com/instance/cpu/utilization';
      const textarea = page.getByRole('textbox', { name: /Cloud Monitoring MQL query/ });
      await textarea.fill(mqlQuery);
      await expect(textarea).toHaveValue(mqlQuery);
    });
  });

  test.describe('SLO mode', () => {
    test('renders expected fields', async ({ readProvisionedDataSource, page }) => {
      const ds = await readProvisionedDataSource<CloudMonitoringOptions>({ fileName: PROVISIONED_FILE });
      await page.goto(builderModeUrl(ds.uid));

      await expect(page.getByText('Query type:', { exact: true })).toBeVisible();
      await page.getByRole('combobox', { name: /Query type/ }).click();
      await page.getByRole('option', { name: 'Service Level Objectives (SLO)', exact: true }).click();

      await expect(page.getByRole('combobox', { name: 'Project', exact: true })).toBeVisible();
      await expect(page.getByRole('combobox', { name: 'Service', exact: true })).toBeVisible();
      await expect(page.getByRole('combobox', { name: 'SLO', exact: true })).toBeVisible();
      await expect(page.getByRole('combobox', { name: 'Selector', exact: true })).toBeVisible();
      await expect(page.getByRole('combobox', { name: 'Alignment period', exact: true })).toBeVisible();
      await expect(page.getByRole('textbox', { name: 'Alias by', exact: true })).toBeVisible();
    });

    test('can select a service and SLO', async ({ readProvisionedDataSource, page }) => {
      const ds = await readProvisionedDataSource<CloudMonitoringOptions>({ fileName: PROVISIONED_FILE });
      await page.goto(builderModeUrl(ds.uid));

      await expect(page.getByText('Query type:', { exact: true })).toBeVisible();
      await page.getByRole('combobox', { name: /Query type/ }).click();
      await page.getByRole('option', { name: 'Service Level Objectives (SLO)', exact: true }).click();

      await page.getByRole('combobox', { name: 'Service', exact: true }).click();
      await page.getByRole('option').first().click();

      await page.getByRole('combobox', { name: 'SLO', exact: true }).click();
      await page.getByRole('option').first().click();
    });
  });

  test.describe('PromQL mode', () => {
    test('renders expected fields', async ({ readProvisionedDataSource, page }) => {
      const ds = await readProvisionedDataSource<CloudMonitoringOptions>({ fileName: PROVISIONED_FILE });
      await page.goto(builderModeUrl(ds.uid));

      await expect(page.getByText('Query type:', { exact: true })).toBeVisible();
      await page.getByRole('combobox', { name: /Query type/ }).click();
      await page.getByRole('option', { name: 'PromQL', exact: true }).click();

      await expect(page.getByRole('combobox', { name: 'Project', exact: true })).toBeVisible();
      await expect(page.getByRole('textbox', { name: /Cloud Monitoring Prometheus query/ })).toBeVisible();
      await expect(page.getByText('Min step', { exact: true })).toBeVisible();
    });

    test('can enter a PromQL query string', async ({ readProvisionedDataSource, page }) => {
      const ds = await readProvisionedDataSource<CloudMonitoringOptions>({ fileName: PROVISIONED_FILE });
      await page.goto(builderModeUrl(ds.uid));

      await expect(page.getByText('Query type:', { exact: true })).toBeVisible();
      await page.getByRole('combobox', { name: /Query type/ }).click();
      await page.getByRole('option', { name: 'PromQL', exact: true }).click();

      const promqlQuery = '{__name__="compute.googleapis.com/instance/cpu/utilization"}';
      const textarea = page.getByRole('textbox', { name: /Cloud Monitoring Prometheus query/ });
      await textarea.fill(promqlQuery);
      await expect(textarea).toHaveValue(promqlQuery);
    });
  });
});

test.describe('Query editor with live data', () => {
  test.describe.configure({ mode: 'serial' });

  test('Builder mode: compute.googleapis.com/instance/cpu/utilization returns results', async ({
    readProvisionedDataSource,
    page,
  }) => {
    test.skip(
      !process.env.DS_INSTANCE_PRIVATE_KEY,
      'Requires valid Google Cloud credentials — set DS_INSTANCE_PRIVATE_KEY or run in CI'
    );
    const ds = await readProvisionedDataSource<CloudMonitoringOptions>({ fileName: PROVISIONED_FILE });
    const queryPayload = {
      timeSeriesList: {
        projectName: DS_DEFAULT_PROJECT,
        filters: ['metric.type', '=', 'compute.googleapis.com/instance/cpu/utilization'],
        view: 'FULL',
        crossSeriesReducer: 'REDUCE_NONE',
        alignmentPeriod: 'cloud-monitoring-auto',
        perSeriesAligner: 'ALIGN_MEAN',
        groupBys: [],
        preprocessor: 'none',
      },
    };
    const responsePromise = page.waitForResponse(
      async (response) => {
        if (!response.url().includes('/api/ds/query')) {
          return false;
        }
        const body = await response.text().catch(() => '');
        return body.includes('"results"');
      },
      { timeout: 30000 }
    );
    await page.goto(exploreUrl(ds.uid, 'timeSeriesList', queryPayload));
    const response = await responsePromise;
    const body = await response.json();

    expect(body.results).toBeDefined();
    expect(body.results['A']).toBeDefined();
    expect(body.results['A'].error).toBeUndefined();
  });

  test('MQL mode: compute.googleapis.com/instance/cpu/utilization returns results', async ({ readProvisionedDataSource, page }) => {
    test.skip(
      !process.env.DS_INSTANCE_PRIVATE_KEY,
      'Requires valid Google Cloud credentials — set DS_INSTANCE_PRIVATE_KEY or run in CI'
    );
    const ds = await readProvisionedDataSource<CloudMonitoringOptions>({ fileName: PROVISIONED_FILE });
    const mqlQuery = `fetch gce_instance::compute.googleapis.com/instance/cpu/utilization`;
    const queryPayload = {
      timeSeriesQuery: { projectName: DS_DEFAULT_PROJECT, query: mqlQuery },
    };

    const responsePromise = page.waitForResponse(
      async (response) => {
        if (!response.url().includes('/api/ds/query')) {
          return false;
        }
        const body = await response.text().catch(() => '');
        return body.includes('"results"');
      },
      { timeout: 30000 }
    );
    await page.goto(exploreUrl(ds.uid, 'timeSeriesQuery', queryPayload));
    const response = await responsePromise;
    const body = await response.json();

    expect(body.results).toBeDefined();
    expect(body.results['A']).toBeDefined();
    expect(body.results['A'].error).toBeUndefined();
  });

  test('SLO mode: first SLO option returns results', async ({ readProvisionedDataSource, page }) => {
    test.skip(
      !process.env.DS_INSTANCE_PRIVATE_KEY,
      'Requires valid Google Cloud credentials — set DS_INSTANCE_PRIVATE_KEY or run in CI'
    );
    const ds = await readProvisionedDataSource<CloudMonitoringOptions>({ fileName: PROVISIONED_FILE });
    await page.goto(builderModeUrl(ds.uid));

    await expect(page.getByText('Query type:', { exact: true })).toBeVisible();
    await page.getByRole('combobox', { name: /Query type/ }).click();
    await page.getByRole('option', { name: 'Service Level Objectives (SLO)', exact: true }).click();

    await page.getByRole('combobox', { name: 'Service', exact: true }).click();
    await page.getByRole('option').first().click();

    await page.getByRole('combobox', { name: 'SLO', exact: true }).click();

    const responsePromise = page.waitForResponse(
      async (response) => {
        if (!response.url().includes('/api/ds/query')) {
          return false;
        }
        const body = await response.text().catch(() => '');
        return body.includes('"results"');
      },
      { timeout: 30000 }
    );
    await page.getByRole('option').first().click();
    const response = await responsePromise;
    const body = await response.json();

    expect(body.results).toBeDefined();
    expect(body.results['A']).toBeDefined();
    expect(body.results['A'].error).toBeUndefined();
  });

  test('PromQL mode: compute.googleapis.com/instance/cpu/utilization returns results', async ({
    readProvisionedDataSource,
    page,
  }) => {
    test.skip(
      !process.env.DS_INSTANCE_PRIVATE_KEY,
      'Requires valid Google Cloud credentials — set DS_INSTANCE_PRIVATE_KEY or run in CI'
    );
    const ds = await readProvisionedDataSource<CloudMonitoringOptions>({ fileName: PROVISIONED_FILE });
    const queryPayload = {
      promQLQuery: {
        projectName: DS_DEFAULT_PROJECT,
        expr: '{__name__="compute.googleapis.com/instance/cpu/utilization"}',
        step: '60s',
      },
    };

    const responsePromise = page.waitForResponse(
      async (response) => {
        if (!response.url().includes('/api/ds/query')) {
          return false;
        }
        const body = await response.text().catch(() => '');
        return body.includes('"results"');
      },
      { timeout: 30000 }
    );
    await page.goto(exploreUrl(ds.uid, 'promQL', queryPayload));
    const response = await responsePromise;
    const body = await response.json();

    expect(body.results).toBeDefined();
    expect(body.results['A']).toBeDefined();
    expect(body.results['A'].error).toBeUndefined();
  });
});
