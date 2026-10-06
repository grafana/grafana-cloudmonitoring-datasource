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

func example(summary, description string, value map[string]any) *spec3.Example {
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
						"jsonData": map[string]any{
							"authenticationType": "jwt",
							"defaultProject":     "my-gcp-project",
							"clientEmail":        "grafana@my-gcp-project.iam.gserviceaccount.com",
							"tokenUri":           "https://oauth2.googleapis.com/token",
						},
						"secureJsonData": map[string]any{
							"privateKey": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
						},
					}),
				"jwtKeyFile": example(
					"Google JWT File with private key on disk",
					"Service account authentication where the private key is read from a file on the Grafana server instead of being stored as a secret. privateKeyPath takes precedence over secureJsonData.privateKey when both are set.",
					map[string]any{
						"jsonData": map[string]any{
							"authenticationType": "jwt",
							"defaultProject":     "my-gcp-project",
							"clientEmail":        "grafana@my-gcp-project.iam.gserviceaccount.com",
							"tokenUri":           "https://oauth2.googleapis.com/token",
							"privateKeyPath":     "/etc/grafana/secrets/gcp-key.json",
						},
					}),
				"jwtImpersonation": example(
					"Google JWT File with service account impersonation",
					"Authenticate with a JWT key file, then impersonate another service account. serviceAccountToImpersonate only takes effect when usingImpersonation is true.",
					map[string]any{
						"jsonData": map[string]any{
							"authenticationType":          "jwt",
							"defaultProject":              "my-gcp-project",
							"clientEmail":                 "grafana@my-gcp-project.iam.gserviceaccount.com",
							"tokenUri":                    "https://oauth2.googleapis.com/token",
							"usingImpersonation":          true,
							"serviceAccountToImpersonate": "monitoring-viewer@my-gcp-project.iam.gserviceaccount.com",
						},
						"secureJsonData": map[string]any{
							"privateKey": "REPLACE_WITH_PRIVATE_KEY",
						},
					}),
				"gce": example(
					"GCE Default Service Account",
					"Use the default service account of the Google Compute Engine VM Grafana runs on. Only works on GCE. defaultProject may be omitted; it is resolved from the metadata server.",
					map[string]any{
						"jsonData": map[string]any{
							"authenticationType": "gce",
						},
					}),
				"workloadIdentityFederation": example(
					"Workload Identity Federation",
					"Federated identity authentication (Grafana Cloud). workloadIdentityPoolProvider is required; wifServiceAccountEmail optionally impersonates a service account. oauthPassThru is set by the editor when this method is chosen.",
					map[string]any{
						"jsonData": map[string]any{
							"authenticationType":           "workloadIdentityFederation",
							"defaultProject":               "my-gcp-project",
							"workloadIdentityPoolProvider": "projects/123456789/locations/global/workloadIdentityPools/my-pool/providers/my-provider",
							"wifServiceAccountEmail":       "monitoring-viewer@my-gcp-project.iam.gserviceaccount.com",
							"oauthPassThru":                true,
						},
					}),
				"forwardOAuthIdentity": example(
					"Forward OAuth Identity",
					"Forward the signed-in Grafana user's Google OAuth token to Cloud Monitoring. defaultProject is required. Alerting is not supported with this method.",
					map[string]any{
						"jsonData": map[string]any{
							"authenticationType": "forwardOAuthIdentity",
							"defaultProject":     "my-gcp-project",
							"oauthPassThru":      true,
						},
					}),
				"universeDomain": example(
					"Custom universe domain",
					"A non-default Google Cloud universe. The editor only shows this setting when the Grafana instance has the secure socks proxy enabled; provisioning can always set it.",
					map[string]any{
						"jsonData": map[string]any{
							"authenticationType": "gce",
							"universeDomain":     "googleapis.mtls.google.com",
						},
					}),
			},
		},
	})
}
