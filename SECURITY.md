# SECURITY v3.4

No credentials, passwords or private API tokens are hardcoded. HTTPS is required for remote providers. Input values are parsed/validated before scoring. Missing and malformed provider results fail closed to N/A/STALE rather than becoming market observations.


Release signing material is bundled under `signing/` only because the project owner explicitly requested it for upgrade-compatible source deliveries. The signing directory is confidential and must not be published or committed to a public repository. No provider API keys or remote-service credentials are hardcoded.
