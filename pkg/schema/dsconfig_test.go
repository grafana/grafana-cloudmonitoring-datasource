package schema_test

import (
	_ "embed"
	"testing"

	"github.com/grafana/dsconfig/schema"
	"github.com/grafana/grafana-plugin-sdk-go/experimental/pluginschema"
	"k8s.io/kube-openapi/pkg/spec3"

	"github.com/grafana/grafana-cloudmonitoring-datasource/pkg/cloudmonitoring"
)

//go:embed dsconfig.json
var configSchemaJSON []byte

// example builds a settings example shaped like a DataSource resource
// (grafana/grafana pkg/apis/datasource/v0alpha1): metadata.name, spec.jsonData and
// secure.<key>.create. Pass nil secure for examples that store no secrets.
func example(summary, description string, jsonData map[string]any, secure map[string]any) *spec3.Example {
	value := map[string]any{
		"metadata": map[string]any{"name": "my-datasource"},
		"spec":     map[string]any{"jsonData": jsonData},
	}
	if len(secure) > 0 {
		value["secure"] = secure
	}
	return &spec3.Example{ExampleProps: spec3.ExampleProps{Summary: summary, Description: description, Value: value}}
}

//go:generate go test -run TestPlugin -generateArtifacts
func TestPlugin(t *testing.T) {
	schema.RunPluginTests(t, schema.PluginUnderTest{
		ID:                "stackdriver",
		ConfigSchemaJSON:  configSchemaJSON,
		SettingsJSONModel: cloudmonitoring.DatasourceJSONData{},
		SecureKeys:        []string{"privateKey"},
		SettingsExamples: &pluginschema.SettingsExamples{
			Examples: map[string]*spec3.Example{
				"": example(
					"Default configuration",
					"The defaults a new datasource starts with: Google JWT File authentication. The service account details and private key must be filled in to get a working datasource.",
					map[string]any{
						"authenticationType": "jwt",
						"defaultProject":     "my-gcp-project",
						"clientEmail":        "grafana@my-gcp-project.iam.gserviceaccount.com",
						"tokenUri":           "https://oauth2.googleapis.com/token",
					}, map[string]any{
						"privateKey": map[string]any{"create": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"},
					}),
				"jwtKeyFile": example(
					"Google JWT File with private key on disk",
					"Service account authentication where the private key is read from a file on the Grafana server instead of being stored as a secret. Self-hosted Grafana only. The file must contain just the PEM private key (the `private_key` value), not the full service account JSON. privateKeyPath takes precedence over secure.privateKey when both are set.",
					map[string]any{
						"authenticationType": "jwt",
						"defaultProject":     "my-gcp-project",
						"clientEmail":        "grafana@my-gcp-project.iam.gserviceaccount.com",
						"tokenUri":           "https://oauth2.googleapis.com/token",
						"privateKeyPath":     "/etc/grafana/secrets/gcp-key.json",
					}, nil),
				"jwtImpersonation": example(
					"Google JWT File with service account impersonation",
					"Authenticate with a JWT key file, then impersonate another service account. serviceAccountToImpersonate only takes effect when usingImpersonation is true.",
					map[string]any{
						"authenticationType":          "jwt",
						"defaultProject":              "my-gcp-project",
						"clientEmail":                 "grafana@my-gcp-project.iam.gserviceaccount.com",
						"tokenUri":                    "https://oauth2.googleapis.com/token",
						"usingImpersonation":          true,
						"serviceAccountToImpersonate": "monitoring-viewer@my-gcp-project.iam.gserviceaccount.com",
					}, map[string]any{
						"privateKey": map[string]any{"create": "REPLACE_WITH_PRIVATE_KEY"},
					}),
				"gce": example(
					"GCE Default Service Account",
					"Use the default service account of the Google Compute Engine VM Grafana runs on. Only works on GCE. defaultProject may be omitted; it is resolved from the metadata server.",
					map[string]any{
						"authenticationType": "gce",
					}, nil),
				"workloadIdentityFederation": example(
					"Workload Identity Federation",
					"Federated identity authentication (Grafana Cloud). workloadIdentityPoolProvider is required; wifServiceAccountEmail optionally impersonates a service account. oauthPassThru is set by the editor when this method is chosen.",
					map[string]any{
						"authenticationType":           "workloadIdentityFederation",
						"defaultProject":               "my-gcp-project",
						"workloadIdentityPoolProvider": "projects/123456789/locations/global/workloadIdentityPools/my-pool/providers/my-provider",
						"wifServiceAccountEmail":       "monitoring-viewer@my-gcp-project.iam.gserviceaccount.com",
						"oauthPassThru":                true,
					}, nil),
				"forwardOAuthIdentity": example(
					"Forward OAuth Identity",
					"Forward the signed-in Grafana user's Google OAuth token to Cloud Monitoring. defaultProject is required. Alerting is not supported with this method.",
					map[string]any{
						"authenticationType": "forwardOAuthIdentity",
						"defaultProject":     "my-gcp-project",
						"oauthPassThru":      true,
					}, nil),
				"universeDomain": example(
					"Custom universe domain",
					"A non-default Google Cloud universe. The editor only shows this setting when the Grafana instance has the secure socks proxy enabled; provisioning can always set it.",
					map[string]any{
						"authenticationType": "gce",
						"universeDomain":     "googleapis.mtls.google.com",
					}, nil),
				"secureSocksProxy": example(
					"Secure Socks Proxy",
					"Route the datasource connection through Grafana's Secure Socks Proxy (Private Data source Connect). The editor only shows this setting when the Grafana instance has the proxy enabled; provisioning can always set it.",
					map[string]any{
						"authenticationType":     "gce",
						"enableSecureSocksProxy": true,
					}, nil),
			},
		},
	})
}
