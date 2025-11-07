# Security Policy for vibesync

Thank you for helping keep vibesync secure. This document explains how to report security vulnerabilities, what we support, and how we handle reports.

## Supported Versions
We actively maintain and support:
- The latest commit on the `main` branch (active development).
- The latest published release and the previous minor release where applicable.

If you're unsure whether a particular version is supported, include the version/commit SHA in your report and we'll confirm.

## Reporting a Vulnerability

If you believe you've found a security vulnerability in vibesync, please report it privately — do not create a public issue.

Preferred reporting methods (in order):
1. Email: vibesync@alwaysdata.net
2. GitHub Security Advisories: https://github.com/GitMaster254/vibesync/security/advisories (private)

When reporting, please include:
- A short, descriptive summary of the problem.
- Product & version (e.g., vibesync v1.2.3 or commit SHA).
- Component or file(s) affected.
- Steps to reproduce (minimum working reproduction if possible).
- Proof-of-concept code or PoC demonstration (screenshots, recorded steps, exploit code).
- Impact assessment (what an attacker could do).
- Any suggested mitigations or fixes (optional).
- Your contact information and preferred disclosure method.
- If you prefer encrypted communication, include your PGP key or request our PGP key (see below).

PGP encryption: If you want to encrypt your report, request our PGP key at security@vibesync.dev and we will provide a fingerprint or public key.

## What to Expect (Triage & Response)
- Acknowledgement: We'll acknowledge receipt within 48 hours.
- Triage: We'll triage and start an investigation within 7 days.
- Updates: We'll provide status updates at reasonable intervals until resolved.
- Patch & Disclosure: We'll coordinate with you on timelines for fixes and public disclosure. Our goal is to provide a fix or mitigation before public disclosure whenever possible.

Typical disclosure timeline: we aim to resolve issues within 90 days, but timelines depend on severity, complexity, and coordination with downstream projects. For critical issues that pose immediate danger to users, we may provide faster turnaround and emergency mitigations.

## Severity Classification
We prioritize fixes by severity. Examples:
- Critical: Remote code execution, server-side auth bypass, critical data exfiltration.
- High: Privilege escalation, sensitive data exposure, major auth bypass.
- Medium: CSRF, information leaks with limited impact, insecure defaults.
- Low: Minor issues, security best-practices improvements.

If your report includes a CVSS score or recommended severity, it will help our triage, but we will perform our own assessment.

## Safe Harbor
If you make a good-faith effort to follow this policy (report privately and avoid data exfiltration or destructive testing), we will not pursue legal action and we will treat your report with respect. Do not violate applicable laws or privacy of other users while testing.

## Public Disclosure
We will coordinate public disclosure with the reporter. If coordination is not possible, or the reporter chooses to disclose, we may disclose the issue after reasonable efforts to protect our users (patches, mitigations) have been made.

## Fixes, Credits, and Acknowledgements
When a report leads to a fix, we will:
- Publish a security advisory (if appropriate).
- Credit the reporter unless they request anonymity.
- Backport fixes to supported releases where feasible.

## Third-Party Components
vibesync depends on third-party libraries. If the vulnerability is in a dependency, we will:
- Open an issue or pull request with the dependency maintainer, and/or
- Patch or pin the dependency until an upstream fix is available.

## Contact
Email: vibesync@alwaysdata.net

If email is not possible, open a private GitHub Security Advisory for the repository: https://github.com/GitMaster254/vibesync/security/advisories

---

Thank you for helping improve the security of vibesync. We take reports seriously and will work with you to remediate vulnerabilities quickly and responsibly.
