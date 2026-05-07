# Security Policy

## Supported versions

| Version | Supported |
| ------- | --------- |
| 0.0.x   | Yes       |

Only the latest published version receives security fixes. Update to the latest version before reporting a vulnerability.

## Scope

This library is a set of TypeScript base classes and interfaces with no runtime I/O and no built-in network access. The attack surface is limited to:

- Dependencies introduced via `npm install @aseguragonzalez/ts-seedwork`
- Any infrastructure implementations built by consumers using the provided ports

## Reporting a vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

Report them via [GitHub private vulnerability reporting](https://github.com/aseguragonzalez/ts-seedwork/security/advisories/new). This keeps the details private until a fix is available.

Include in your report:

- A description of the vulnerability and its potential impact.
- Steps to reproduce or a minimal proof of concept.
- The package version(s) affected.
- Any suggested mitigations, if known.

## Response process

| Step                | Target timeline                                         |
| ------------------- | ------------------------------------------------------- |
| Acknowledgement     | 72 hours                                                |
| Validity assessment | 7 days                                                  |
| Patched release     | 14 days for confirmed vulnerabilities                   |
| Public disclosure   | Coordinated with the reporter after the fix is released |

If you do not receive an acknowledgement within 72 hours, follow up by opening a regular GitHub issue mentioning that you submitted a private advisory — do not include vulnerability details in the public issue.
