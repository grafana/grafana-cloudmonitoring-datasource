import { config } from '@grafana/runtime';

/**
 * Checks whether the current Grafana instance is running on Grafana Cloud.
 *
 * Cloud instances use a namespace of the form `stacks-{stackId}`, whereas
 * on-prem instances use an org-based namespace (for example `org-{orgId}`).
 *
 * Workload Identity Federation relies on Grafana Cloud's auth middleware to
 * exchange the external identity for a Google Cloud access token, so the option
 * is only offered on Cloud.
 *
 * @returns true if the instance is Grafana Cloud, false otherwise
 */
export function isCloud(): boolean {
  return config.namespace?.startsWith('stacks-') ?? false;
}
