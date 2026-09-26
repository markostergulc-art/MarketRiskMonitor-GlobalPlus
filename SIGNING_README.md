# Release signing material

Release private keys and passwords are **not included in this public repository**. The `signing/` directory, keystores and `keystore.properties` are excluded by `.gitignore`.

The existing signed BUILD127 APK is available in `bin/`. Downloading or installing it does not require any signing material.

For an upgrade-compatible release build, the owner must supply the original key locally:

- `signing/<existing-release-keystore>`
- `signing/keystore.properties`, containing `storeFile`, `storePassword`, `keyAlias` and `keyPassword`

`storeFile` is relative to `signing/`. The BUILD127 manual release script expects the existing PKCS#12 keystore. The standard Gradle source also reads this properties file when it exists.

Do not commit these files or publish them in source archives. Do not replace the release key for a normal upgrade: the application ID and signing identity must remain compatible with the installed app.

The BUILD127 audit records this signing-certificate SHA-256:

```text
c17fdf8d2fc50db4bf77577fb3d6d9d9105e00f2b5952df362f7c27cad8a16b6
```

This is the public certificate fingerprint, not a private key or APK checksum. The APK's separate file checksum is stored beside it in `bin/`.
