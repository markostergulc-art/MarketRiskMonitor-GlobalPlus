package com.marko.marketrisk.globalplus;

import android.content.Context;
import android.content.SharedPreferences;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;

import java.nio.charset.StandardCharsets;
import java.security.KeyStore;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;

/** Device-bound encrypted storage for the user-supplied Trading 212 read-only API key pair. */
final class Trading212CredentialsStore {
    private static final String ANDROID_KEYSTORE = "AndroidKeyStore";
    private static final String KEY_ALIAS = "mrm_trading212_api_v1";
    private static final String PREFS = "mrm_secrets";
    private static final String PREF_IV = "t212_iv_v1";
    private static final String PREF_CT = "t212_ct_v1";
    private static final char SEP = '\n';

    private Trading212CredentialsStore() {}

    static boolean save(Context context, String rawKey, String rawSecret) {
        String key = rawKey == null ? "" : rawKey.trim();
        String secret = rawSecret == null ? "" : rawSecret.trim();
        if (!validPart(key) || !validPart(secret)) return false;
        try {
            SecretKey aes = getOrCreateKey();
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, aes);
            byte[] encrypted = cipher.doFinal((key + SEP + secret).getBytes(StandardCharsets.UTF_8));
            context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
                    .putString(PREF_IV, Base64.encodeToString(cipher.getIV(), Base64.NO_WRAP))
                    .putString(PREF_CT, Base64.encodeToString(encrypted, Base64.NO_WRAP))
                    .apply();
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    static Credentials load(Context context) {
        try {
            SharedPreferences p = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
            String iv64 = p.getString(PREF_IV, null);
            String ct64 = p.getString(PREF_CT, null);
            if (iv64 == null || ct64 == null) return null;
            KeyStore ks = KeyStore.getInstance(ANDROID_KEYSTORE);
            ks.load(null);
            java.security.Key existing = ks.getKey(KEY_ALIAS, null);
            if (!(existing instanceof SecretKey)) return null;
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, (SecretKey) existing,
                    new GCMParameterSpec(128, Base64.decode(iv64, Base64.NO_WRAP)));
            String plain = new String(cipher.doFinal(Base64.decode(ct64, Base64.NO_WRAP)), StandardCharsets.UTF_8);
            int split = plain.indexOf(SEP);
            if (split <= 0 || split >= plain.length() - 1) return null;
            String key = plain.substring(0, split).trim();
            String secret = plain.substring(split + 1).trim();
            return validPart(key) && validPart(secret) ? new Credentials(key, secret) : null;
        } catch (Exception e) {
            return null;
        }
    }

    static boolean has(Context context) { return load(context) != null; }

    static void clear(Context context) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
                .remove(PREF_IV).remove(PREF_CT).apply();
    }

    private static boolean validPart(String s) {
        if (s == null || s.length() < 8 || s.length() > 512) return false;
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if (c == '\r' || c == '\n' || Character.isISOControl(c)) return false;
        }
        return true;
    }

    private static SecretKey getOrCreateKey() throws Exception {
        KeyStore ks = KeyStore.getInstance(ANDROID_KEYSTORE);
        ks.load(null);
        java.security.Key existing = ks.getKey(KEY_ALIAS, null);
        if (existing instanceof SecretKey) return (SecretKey) existing;
        KeyGenerator kg = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, ANDROID_KEYSTORE);
        KeyGenParameterSpec spec = new KeyGenParameterSpec.Builder(
                KEY_ALIAS, KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT)
                .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                .setRandomizedEncryptionRequired(true)
                .build();
        kg.init(spec);
        return kg.generateKey();
    }

    static final class Credentials {
        final String apiKey;
        final String apiSecret;
        Credentials(String apiKey, String apiSecret) {
            this.apiKey = apiKey;
            this.apiSecret = apiSecret;
        }
    }
}
