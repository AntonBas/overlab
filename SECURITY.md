# Security policy

Overlab is an unofficial fan site run by one person. Please report a vulnerability privately, not in a public issue.

- Use GitHub's "Report a vulnerability" button on the Security tab of this repository (private vulnerability reporting).
- Include what you found, how to reproduce it and which address or page is affected.
- Do not test with real user data, do not run denial-of-service or automated scanners against the production site, and do not call the Blizzard endpoints through it.

Reports are answered as soon as the maintainer can, usually within a few days. Fixes ship through the normal deploy (see [docs/DEPLOY.md](docs/DEPLOY.md)).

Security measures already in place are described in [docs/API.md](docs/API.md) (authentication, rate limits, admin protection) and [docs/DEPLOY.md](docs/DEPLOY.md) (edge headers, backups, secrets).

Dependencies are checked automatically: `npm audit` and Trivy in CI, and a weekly OWASP dependency-check of the backend jar in the Security workflow (`dependency-check` job, fails on CVSS 9 and above, report kept as an artifact). Add an `NVD_API_KEY` repository secret (free key from the National Vulnerability Database) so the weekly scan can download the vulnerability data quickly.
