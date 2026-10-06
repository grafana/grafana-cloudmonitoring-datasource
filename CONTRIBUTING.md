# Contributing

## Signed commits are required

> [!IMPORTANT]
> All commits must be [signed](https://docs.github.com/en/authentication/managing-commit-signature-verification/signing-commits) (GPG, SSH, or S/MIME) to be merged into this repository. Pull requests with unsigned commits will need to be re-committed with signatures before they can be merged.

Thank you for your interest in contributing to the Google Cloud Monitoring data source for Grafana! We welcome contributions from the community.

Feel free to [browse open issues](https://github.com/grafana/grafana-cloudmonitoring-datasource/issues) or open a new one. For more general guidance, see [Grafana's Contributing Guide](https://github.com/grafana/grafana/blob/main/CONTRIBUTING.md).

This project adheres to the [Grafana Code of Conduct](https://github.com/grafana/grafana/blob/main/CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## Prerequisites

- [Git](https://git-scm.com/)
- [Go](https://golang.org/dl/) (see [go.mod](go.mod) for the minimum required version)
- [Mage](https://magefile.org/)
- [Node.js LTS](https://nodejs.org)
- [npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) (see [package.json](package.json) for the minimum required version)
- [Docker](https://docs.docker.com/get-docker/)

## Frontend

1. Install dependencies:

   ```shell
   npm install
   ```

2. Build plugin in development mode and watch for changes:

   ```shell
   npm run dev
   ```

3. Build plugin in production mode:

   ```shell
   npm run build
   ```

4. Run frontend tests:

   ```shell
   npm run test:ci
   ```

## Backend

1. Build the backend binaries:

   ```shell
   mage -v
   ```

2. Run backend tests:

   ```shell
   mage test
   ```

## Data Source Configuration Schema

`pkg/schema/dsconfig.json` is the **single source of truth** for the data source's
configuration surface: every field a user can set, where it is stored (`root`, `jsonData`,
`secureJsonData`), its type, validation rules and UI hints. It is consumed by provisioning
tooling, documentation and automation.

The schema format is defined and documented by [`grafana/dsconfig`](https://github.com/grafana/dsconfig/tree/main/dsconfig):

- [README](https://github.com/grafana/dsconfig/tree/main/dsconfig#readme): concepts and a worked example for each field shape (root / jsonData / secret / array / virtual), plus current gaps and limitations.
- [`schema.md`](https://github.com/grafana/dsconfig/blob/main/dsconfig/schema.md): full property reference.
- [`schema.json`](https://github.com/grafana/dsconfig/blob/main/dsconfig/schema.json): the JSON Schema `dsconfig.json` validates against. It is pinned via the `$schema` key at the top of our file, so editors autocomplete from it; bump that URL when you bump `github.com/grafana/dsconfig/schema` in `go.mod`.

The rest of this section covers only what is specific to this repository.

### Layout

| File in `pkg/schema/` | Description                                                                                                                       |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `dsconfig.json`       | Source of truth, **edit this**                                                                                                    |
| `dsconfig_test.go`    | Wires the schema into the shared conformance suite; also holds `SecureKeys` and the provisioning examples shipped with the plugin |
| `*.gen.json`          | Generated artifacts, **never hand-edit**; `npm run build` copies them into `dist/schema/` via `webpack.config.ts`                  |

### Adding a new settings option

1. **Declare the field** in `pkg/schema/dsconfig.json` under `fields`, and add its `id` to
   the appropriate `groups[].fieldRefs` entry. Field ids follow the `<target>_<key>`
   convention, e.g. `jsonData_universeDomain`.
2. **Add the matching Go field** to `DatasourceJSONData` in `pkg/cloudmonitoring/cloudmonitoring.go`
   with a json tag equal to the schema `key`. This parity is enforced in both directions: a
   field in the schema but not the struct (or vice versa) fails the test suite. Secrets
   (`target: secureJsonData`) are the exception: they get no struct field, but their key
   must be added to `SecureKeys` in `pkg/schema/dsconfig_test.go`.
3. **Regenerate the artifacts** and commit them with your change:

   ```shell
   go generate ./pkg/schema/...
   ```

4. **Verify**:

   ```shell
   go test ./pkg/schema/...
   ```

If you add a setting that changes what a typical configuration looks like, update
the examples in `pkg/schema/dsconfig_test.go` too. Those are the provisioning payloads
shipped with the plugin. Use placeholders like `REPLACE_WITH_PRIVATE_KEY`, never real credentials.

### When the conformance suite fails

Most failures are self-explanatory from the assertion message. The three you are most
likely to hit:

- `SchemaArtifactInSync`: a `.gen.json` file has drifted. Run `go generate ./pkg/schema/...` and commit the result.
- `JSONDataMatchesStruct` / `JSONDataTypesMatchStruct`: the schema and `DatasourceJSONData` disagree on keys or types. Update whichever side is behind.
- `SecureValuesMatchLoadSettings`: the schema's `secureJsonData` fields and `SecureKeys` disagree.

## Local development environment

To provision a Google Cloud Monitoring datasource with valid credentials, create a new YAML file in `provisioning/datasources` and reference the [documentation](https://grafana.com/docs/grafana/latest/datasources/google-cloud-monitoring/configure/#provision-the-data-source) for examples.

`npm run server` starts a Grafana instance with the plugin pre-provisioned:

```shell
npm run server
```

## E2E tests

When ran locally, E2E tests which require valid credentials are skipped.

```shell
npm run server
npm run e2e
```

Or, to install Playwright browsers first:

```shell
npx playwright install --with-deps
npm run server
npm run e2e
```

## Release

You need commit access to the repository to publish a release.

1. Update the version number in `package.json`.
2. Update `CHANGELOG.md` with the changes included in the release.
3. Open a PR with the changes and merge it.
4. Follow the release process described [here](https://enghub.grafana-ops.net/docs/default/component/grafana-plugins-platform/plugins-ci-github-actions/010-plugins-ci-github-actions/#cd_1).
