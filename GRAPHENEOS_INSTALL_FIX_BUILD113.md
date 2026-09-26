# BUILD113 Android / GrapheneOS installation packaging fix

The original delivered BUILD113 was V1/V2/V3 signed but its uncompressed `resources.arsc` became misaligned after the V1 `jarsigner` step. Because the app targets API 35, Android 11+ can reject that APK at install time.

Fallback release order is now explicitly:

1. build unsigned APK;
2. V1 sign with `jarsigner`;
3. 4-byte align the V1-signed APK;
4. add V2/V3 APK Signing Block signatures;
5. verify ZIP integrity, signatures and alignment.

No runtime/financial/T212 logic is changed by this packaging fix.
