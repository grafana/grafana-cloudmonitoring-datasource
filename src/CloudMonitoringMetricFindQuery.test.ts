import { dateTime } from '@grafana/data';

import CloudMonitoringMetricFindQuery from './CloudMonitoringMetricFindQuery';
import { MetricFindQueryTypes } from './dataquery';
import type CloudMonitoringDatasource from './datasource';
import { type CloudMonitoringVariableQuery } from './types/types';

function labelValuesQuery(): CloudMonitoringVariableQuery {
  return {
    refId: 'A',
    selectedQueryType: MetricFindQueryTypes.LabelValues,
    selectedService: '',
    selectedMetricType: 'compute.googleapis.com/instance/cpu/utilization',
    selectedSLOService: '',
    labelKey: 'zone',
    projects: [],
    sloServices: [],
    projectName: 'my-project',
  };
}

describe('CloudMonitoringMetricFindQuery', () => {
  it('passes the dashboard time range into label value lookups', async () => {
    const getLabels = jest.fn().mockResolvedValue({ zone: ['us-central1-a'] });
    const datasource = {
      getDefaultProject: () => 'my-project',
      templateSrv: { replace: (value: string) => value },
      getLabels,
    } as unknown as CloudMonitoringDatasource;
    const from = dateTime('2026-01-01T00:00:00.000Z');
    const to = dateTime('2026-01-08T00:00:00.000Z');
    const timeRange = { from, to, raw: { from: 'now-7d', to: 'now' } };

    const results = await new CloudMonitoringMetricFindQuery(datasource).execute(labelValuesQuery(), timeRange);

    expect(getLabels).toHaveBeenCalledWith(
      'compute.googleapis.com/instance/cpu/utilization',
      'handleLabelValuesQuery',
      'my-project',
      { groupBys: ['zone'], crossSeriesReducer: 'REDUCE_MEAN' },
      timeRange
    );
    expect(results).toEqual([{ text: 'us-central1-a', expandable: true }]);
  });
});
