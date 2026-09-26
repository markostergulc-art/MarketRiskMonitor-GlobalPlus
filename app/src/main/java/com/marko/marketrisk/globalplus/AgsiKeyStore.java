package com.marko.marketrisk.globalplus;

import android.content.Context;
import android.content.SharedPreferences;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;

import java.nio.charset.StandardCharsets;
import java.security.KeyStore;
import java.util.regex.Pattern;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;

/** Device-bound encrypted storage for the user-supplied GIE AGSI API key. */
final class AgsiKeyStore {
    private static final String ANDROID_KEYSTORE = "AndroidKeyStore";
    private static final String KEY_ALIAS = "mrm_gie_agsi_api_v1";
    private static final String PREFS = "mrm_secrets";
    private static final String PREF_IV = "agsi_iv_v1";
    private static final String PREF_CT = "agsi_ct_v1";
    private static final Pattern WS = Pattern.compile("\\s");

    private AgsiKeyStore() {}

    static boolean save(Context context, String raw) {
        String key = raw == null ? "" : raw.trim();
        if (key.length() < 16 || key.length() > 256 || WS.matcher(key).find()) return false;
        try {
            SecretKey secret = getOrCreateKey();
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, secret);
            byte[] encrypted = cipher.doFinal(key.getBytes(StandardCharsets.UTF_8));
            SharedPreferences p = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
            p.edit()
                    .putString(PREF_IV, Base64.encodeToString(cipher.getIV(), Base64.NO_WRAP))
                    .putString(PREF_CT, Base64.encodeToString(encrypted, Base64.NO_WRAP))
                    .apply();
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    static String load(Context context) {
        try {
            SharedPreferences p = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
            String iv64 = p.getString(PREF_IV, null);
            String ct64 = p.getString(PREF_CT, null);
            if (iv64 == null || ct64 == null) return null;
            KeyStore ks = KeyStore.getInstance(ANDROID_KEYSTORE);
            ks.load(null);
            java.security.Key key = ks.getKey(KEY_ALIAS, null);
            if (!(key instanceof SecretKey)) return null;
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, (SecretKey) key, new GCMParameterSpec(128, Base64.decode(iv64, Base64.NO_WRAP)));
            String out = new String(cipher.doFinal(Base64.decode(ct64, Base64.NO_WRAP)), StandardCharsets.UTF_8).trim();
            return out.isEmpty() ? null : out;
        } catch (Exception e) {
            return null;
        }
    }

    static boolean has(Context context) { return load(context) != null; }

    static void clear(Context context) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().remove(PREF_IV).remove(PREF_CT).apply();
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
}
