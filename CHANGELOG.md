# Changelog

## 12.6.1

- Removed included dashboards from plugin.json.

## 12.6.0

- Add support for [Google Cloud Workload Identity Federation](https://cloud.google.com/iam/docs/workload-identity-federation) as a new authentication type. Available on Grafana Cloud only.

## 12.5.2

- Classified invalid query JSON as downstream errors.

## 12.5.1

- Added included dashboards back to plugin.json.

## 12.5.0

- Add support for [Forward OAuth Identity](https://grafana.com/docs/grafana/latest/datasources/google-cloud-monitoring/google-authentication/) as a new authentication type. Each query runs as the Google-signed-in Grafana user by forwarding their OAuth token. Requires Grafana to be configured with [Google OAuth](https://grafana.com/docs/grafana/latest/setup-grafana/configure-security/configure-authentication/google/) login.

## 12.4.3

- Removed includes from plugin.json so dashboards don't get imported automatically.

## 12.4.2

- Initial release.
