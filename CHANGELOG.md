# Changelog

## 12.5.0

- Add support for [Forward OAuth Identity](https://grafana.com/docs/grafana/latest/datasources/google-cloud-monitoring/google-authentication/) as a new authentication type. Each query runs as the Google-signed-in Grafana user by forwarding their OAuth token. Requires Grafana to be configured with [Google OAuth](https://grafana.com/docs/grafana/latest/setup-grafana/configure-security/configure-authentication/google/) login.

## 12.4.3

- Removed includes from plugin.json so dashboards don't get imported automatically.

## 12.4.2

Initial release.
