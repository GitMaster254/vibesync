# 🛡️ Security Policy

The VibeSync team (**GitMaster254** & **Hedmon0094**) takes security seriously. We appreciate the community's efforts in making our offline-first player safer for everyone.

## 📦 Supported Versions

| Version | Supported | Notes |
| :--- | :---: | :--- |
| **`main`** | ✅ | Latest development branch. |
| **Latest Release** | ✅ | Most recent tag. |
| **Legacy** | ❌ | Please upgrade to the latest version. |

## 🚨 Reporting a Vulnerability

**Please do not report security issues in public issues.**

### How to Report
1.  **Email:** [vibesync@alwaysdata.net](mailto:admin@alwaysdata.net)
2.  **GitHub Advisory:** Open a private advisory [here](https://github.com/GitMaster254/vibesync/security/advisories).

### What to Include
* **Summary:** A brief description of the vulnerability.
* **Component:** e.g., `Stream Proxy`, `Metadata Worker`, `Playlist Import`.
* **Severity:** Your assessment (Critical, High, Medium, Low).
* **Proof of Concept:** Steps or code to reproduce the issue.

## ⏳ Response Timeline
* **Ack:** Within 48 hours.
* **Triage:** Within 7 days.
* **Fix:** Aiming for < 90 days.

## 🚦 Severity & Scope
We are most interested in:
* Remote Code Execution (RCE) via the API.
* CORS configuration bypasses.
* Unauthorized access to local file systems beyond user intent.
* Stored XSS in playlist metadata.

## 🤝 Safe Harbor
If you conduct security research in good faith and follow this policy, we will:
* **Not** pursue legal action against you.
* **Work with you** to resolve the issue.
* **Credit you** for your contribution (unless you prefer anonymity).

## 🏆 Credits
We maintain a Security Hall of Fame to thank researchers who responsibly disclose vulnerabilities.

---

**Maintainers** * GitMaster254 ([@GitMaster254](https://github.com/GitMaster254))
* Hedmon0094 ([@Hedmon0094](https://github.com/Hedmon0094))