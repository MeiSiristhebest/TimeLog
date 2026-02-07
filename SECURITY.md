# Security Policy

## Supported Versions

| Version | Supported          |
|---------|--------------------|
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

**Please DO NOT report security vulnerabilities through public GitHub issues.**

Instead, please report them via email to: **[To be configured - project maintainer email]**

You should receive a response within 48 hours. If for some reason you do not, please follow up via email.

Please include the following information in your report:

- **Type of issue** (e.g., buffer overflow, SQL injection, XSS, authentication bypass)
- **Full paths of source file(s)** related to the manifestation of the issue
- **Location of the affected source code** (tag/branch/commit or direct URL)
- **Step-by-step instructions** to reproduce the issue
- **Proof-of-concept or exploit code** (if possible)
- **Impact of the issue**, including how an attacker might exploit it

## Security Best Practices

### For Contributors

1. **Never commit secrets**: Always use `.env` files for sensitive data. Never commit API keys, passwords, or tokens to
   the repository.
2. **Use `devLog` wrapper**: Never use `console.log` directly - it can leak sensitive information in production.
3. **Validate user input**: Always sanitize and validate user input before database operations or rendering.
4. **Secure storage**: Use `expo-secure-store` for storing tokens, passwords, and other sensitive data.
5. **Regular updates**: Keep all dependencies up to date. Run `npm audit` regularly.
6. **Code review**: All PRs must be reviewed before merging, with special attention to security implications.

### For Users

1. **Keep app updated**: Always use the latest version to benefit from security patches.
2. **Device security**: Use device PIN, password, or biometric authentication.
3. **Network security**: Avoid using public WiFi for sensitive operations.
4. **Permissions**: Review app permissions regularly and only grant necessary permissions.
5. **Data privacy**: Regularly review your privacy settings and data sharing preferences.

## Security Features

### Data Protection

- **Local-First Architecture**: All data is stored locally first, with optional cloud backup.
- **Encrypted Storage**: Tokens and credentials are stored in device-secure storage (iOS Keychain / Android Keystore).
- **Offline-First Sync**: Network failures don't expose data - operations are queued securely.

### Authentication

- **Device Code Flow**: Elderly users use QR code authentication, avoiding password complexity.
- **Session Management**: Auto-refresh tokens with secure rotation.
- **Rate Limiting**: Protection against brute force attacks (5 attempts per 10 minutes).

### Privacy

- **Log Scrubbing**: Production builds never log PII or transcripts.
- **Zero Retention**: Account deletion includes physical file deletion.
- **Local Processing**: Voice Activity Detection (VAD) runs on-device, not in cloud.

## Known Security Considerations

### Audio Files

- **Storage Location**: Audio files are stored in app-private storage (`FileSystem.documentDirectory`).
- **Access Control**: Files are only accessible by the app and OS (sandboxed).
- **Backup Policy**: iOS users should be aware that audio files may be backed up to iCloud if enabled.

### Cloud Sync

- **Transport Security**: All cloud sync uses HTTPS with TLS 1.2+.
- **Authentication**: Every request includes fresh access tokens from Supabase.
- **File Integrity**: MD5 checksums verify file integrity during upload/download.

## Disclosure Policy

We follow a **responsible disclosure** policy:

1. Security issues are addressed in priority order.
2. Fixes are released in patch versions as soon as possible.
3. Public disclosure happens after:
    - A fix is available
    - Sufficient time for users to update (typically 30 days)
    - Coordination with the reporter

## Security Audit History

| Date       | Type        | Results                                     |
|:-----------|:------------|:--------------------------------------------|
| 2026-01-25 | Code Review | Logging standardization, ESLint rules added |
| -          | -           | No external audits yet                      |

---

**Last Updated**: 2026-01-25  
**Contact**: [To be configured]
