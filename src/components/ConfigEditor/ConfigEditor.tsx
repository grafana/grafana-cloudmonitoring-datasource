import { memo, useMemo } from 'react';

import { type DataSourcePluginOptionsEditorProps, updateDatasourcePluginJsonDataOption } from '@grafana/data';
import {
  AuthConfig,
  GoogleAuthType,
  GOOGLE_AUTH_TYPE_OPTIONS,
  OAUTH_PASSTHROUGH_AUTH_TYPE_OPTION,
  WIF_AUTH_TYPE_OPTION,
} from '@grafana/google-sdk';
import { ConfigSection, DataSourceDescription } from '@grafana/plugin-ui';
import { config, reportInteraction } from '@grafana/runtime';
import { Alert, Divider, Field, Input, SecureSocksProxySettings, Stack } from '@grafana/ui';

import { type CloudMonitoringOptions, type CloudMonitoringSecureJsonData } from '../../types/types';
import { isCloud } from '../../utils';

export type Props = DataSourcePluginOptionsEditorProps<CloudMonitoringOptions, CloudMonitoringSecureJsonData>;

export const ConfigEditor = memo(({ options, onOptionsChange }: Props) => {
  const handleOnOptionsChange = (options: Props['options']) => {
    if (options.jsonData.privateKeyPath || options.secureJsonFields['privateKey']) {
      reportInteraction('grafana_cloud_monitoring_config_changed', {
        authenticationType: 'JWT',
        privateKey: options.secureJsonFields['privateKey'],
        privateKeyPath: !!options.jsonData.privateKeyPath,
      });
    }
    onOptionsChange(options);
  };

  const authOptions = useMemo(
    () => [
      ...GOOGLE_AUTH_TYPE_OPTIONS,
      ...(isCloud() ? [WIF_AUTH_TYPE_OPTION, OAUTH_PASSTHROUGH_AUTH_TYPE_OPTION] : []),
    ],
    []
  );

  const authenticationType = options.jsonData.authenticationType || GoogleAuthType.JWT;
  const showServiceAccountImpersonation =
    authenticationType === GoogleAuthType.JWT || authenticationType === GoogleAuthType.GCE;

  return (
    <>
      <DataSourceDescription
        dataSourceName="Google Cloud Monitoring"
        docsLink="https://grafana.com/docs/grafana/latest/datasources/google-cloud-monitoring/"
        hasRequiredFields
      />
      <Divider />
      <AuthConfig
        authOptions={authOptions}
        options={options}
        onOptionsChange={handleOnOptionsChange}
        showServiceAccountImpersonationConfig={showServiceAccountImpersonation}
      />
      {authenticationType !== GoogleAuthType.ForwardOAuthIdentity && (
        <div className="grafana-info-box" style={{ marginTop: '16px' }}>
          <p>
            Don&apos;t know how to get a service account key file or create a service account? Read more{' '}
            <a
              className="external-link"
              target="_blank"
              rel="noopener noreferrer"
              href="https://grafana.com/docs/grafana/latest/datasources/google-cloud-monitoring/google-authentication/"
            >
              in the documentation.
            </a>
          </p>
        </div>
      )}
      {authenticationType === GoogleAuthType.GCE && (
        <Alert title="" severity="info">
          Verify GCE default service account by clicking Save &amp; Test
        </Alert>
      )}
      {config.secureSocksDSProxyEnabled && (
        <>
          <Divider />
          <ConfigSection
            title="Additional settings"
            description="Additional settings are optional settings that can be configured for more control over your data source. This includes Secure Socks Proxy and Universe Domain."
            isCollapsible
            isInitiallyOpen={
              options.jsonData.enableSecureSocksProxy !== undefined || options.jsonData.universeDomain !== undefined
            }
          >
            <Stack direction={'column'}>
              <Field noMargin label="Universe Domain">
                <Input
                  width={50}
                  value={options.jsonData.universeDomain}
                  onChange={(event) =>
                    updateDatasourcePluginJsonDataOption(
                      { options, onOptionsChange },
                      'universeDomain',
                      event.currentTarget.value
                    )
                  }
                  placeholder="googleapis.com"
                ></Input>
              </Field>
              <SecureSocksProxySettings options={options} onOptionsChange={onOptionsChange} />
            </Stack>
          </ConfigSection>
        </>
      )}
      <Divider />
    </>
  );
});
ConfigEditor.displayName = 'ConfigEditor';
