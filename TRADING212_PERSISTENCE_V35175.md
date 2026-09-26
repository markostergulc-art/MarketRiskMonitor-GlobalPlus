# Trading 212 credential persistence — v3.5.1.75

## Required behavior
- API key + secret are entered only in Settings → Data → Trading 212.
- Before credentials exist, no T212 badge is rendered elsewhere in the app.
- TEST and REMOVE are hidden until credentials exist.
- Availability continues to mean **tradable in the authenticated Trading 212 instrument catalog**, never portfolio ownership.

## Full Android build
The existing `Trading212CredentialsStore.java` is retained. It uses AndroidKeyStore AES/GCM and stores only IV/ciphertext in private SharedPreferences. The native bridge exposes save/has/clear and the native WebView proxy applies Basic auth to the official read-only instrument-catalog request.

## Manual fallback APK used in this environment
Because this environment has no Android SDK/Gradle, the installable fallback shell cannot compile the full Java bridge. v3.5.1.75 therefore adds persistent encrypted fallback storage:
- WebCrypto AES-GCM 256-bit key
- key generated as **non-extractable**
- CryptoKey stored through IndexedDB structured cloning
- IV + encrypted credential payload stored in IndexedDB
- no plaintext key/secret in localStorage, source, APK, logs, exports or cache

If WebCrypto/IndexedDB are unavailable, credentials are not silently persisted in plaintext.

## Visibility transition
- Unconfigured → Settings entry only.
- Credentials restored/saved → instrument catalog is loaded.
- Catalog ready → T212 badges are rendered globally where applicable.
- Invalid/API error → error remains visible in Settings; global T212 badges are not created from an unverified catalog.
- Remove credentials → badges disappear immediately after re-render.
