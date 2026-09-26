package com.marko.marketrisk.globalplus;

import android.Manifest;
import android.app.Activity;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.content.ContentValues;
import android.content.ContentResolver;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.content.res.Configuration;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.MediaStore;
import android.os.Environment;
import android.util.Base64;
import android.view.DisplayCutout;
import android.view.WindowInsets;
import android.view.Window;
import android.view.View;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class MainActivity extends Activity {
    private static final String CHANNEL_ID = "market_risk_alerts";
    private static final String APP_ORIGIN = "https://app.local/";
    private static final String PROXY_PREFIX = "https://app.local/proxy?u=";
    private static final int MAX_UPSTREAM_BYTES = 6 * 1024 * 1024;
    private static final Set<String> ALLOWED_HOSTS = new HashSet<>(Arrays.asList(
            "fred.stlouisfed.org", "api.worldbank.org", "data-api.ecb.europa.eu",
            "cdn.cboe.com", "www.cboe.com", "cboe.com",
            "query1.finance.yahoo.com", "query2.finance.yahoo.com",
            "zse.hr", "www.zse.hr", "api.fiscaldata.treasury.gov",
            "markets.newyorkfed.org", "www.newyorkfed.org", "newyorkfed.org",
            "www.financialresearch.gov", "financialresearch.gov",
            "publicreporting.cftc.gov", "www.cftc.gov", "cftc.gov",
            "www.eia.gov", "eia.gov", "ir.eia.gov", "www.energy.gov", "energy.gov",
            "www.gold.org", "gold.org",
            "www.gie.eu", "gie.eu", "agsi.gie.eu", "ec.europa.eu"
    ));

    private WebView webView;
    private RiskDatabase riskDatabase;
    private volatile int insetTopPx = 0, insetBottomPx = 0, insetLeftPx = 0, insetRightPx = 0;
    private final ExecutorService dbExecutor = Executors.newSingleThreadExecutor(r -> {
        Thread t = new Thread(r, "risk-db-writer");
        t.setDaemon(true);
        return t;
    });

    @Override protected void onCreate(Bundle savedInstanceState) {
        String initialTheme = getSharedPreferences("mrm_ui", MODE_PRIVATE).getString("theme", "system");
        boolean initialDark = resolveNativeDark(initialTheme);
        setTheme(initialDark ? R.style.AppThemeDark : R.style.AppThemeLight);
        super.onCreate(savedInstanceState);
        createNotificationChannel();
        riskDatabase = new RiskDatabase(this);
        SharedPreferences bgPrefs = getSharedPreferences("mrm_background", MODE_PRIVATE);
        BackgroundRefreshScheduler.configure(this, bgPrefs.getInt("minutes", 30), bgPrefs.getBoolean("enabled", false));
        WebView.setWebContentsDebuggingEnabled(false);

        webView = new WebView(this);
        webView.setBackgroundColor(initialDark ? Color.parseColor("#0B1220") : Color.parseColor("#F5F7FA"));
        applyNativeTheme(initialTheme);
        WebSettings s = webView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setAllowFileAccessFromFileURLs(false);
        s.setAllowUniversalAccessFromFileURLs(false);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        s.setCacheMode(WebSettings.LOAD_DEFAULT);
        s.setSupportMultipleWindows(false);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) s.setSafeBrowsingEnabled(true);

        webView.setWebViewClient(new NativeDataClient());
        webView.setWebChromeClient(new WebChromeClient());
        webView.addJavascriptInterface(new AndroidBridge(this), "Android");
        // Single inset ownership model: CSS owns layout padding. Native Android only
        // reports the actual system-bar / cutout dimensions as CSS custom properties.
        // CSS uses max(env(safe-area-inset-*), native value), so insets are never doubled.
        webView.setOnApplyWindowInsetsListener((v, insets) -> {
            int top = Math.max(0, insets.getSystemWindowInsetTop());
            int bottom = Math.max(0, insets.getSystemWindowInsetBottom());
            int left = Math.max(0, insets.getSystemWindowInsetLeft());
            int right = Math.max(0, insets.getSystemWindowInsetRight());
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                DisplayCutout cutout = insets.getDisplayCutout();
                if (cutout != null) {
                    top = Math.max(top, cutout.getSafeInsetTop());
                    bottom = Math.max(bottom, cutout.getSafeInsetBottom());
                    left = Math.max(left, cutout.getSafeInsetLeft());
                    right = Math.max(right, cutout.getSafeInsetRight());
                }
            }
            insetTopPx = top; insetBottomPx = bottom; insetLeftPx = left; insetRightPx = right;
            applyInsetsToWeb();
            return insets; // keep them unconsumed; we do not add native view padding
        });
        setContentView(webView);
        webView.loadUrl(APP_ORIGIN + "index.html");
    }

    private void applyInsetsToWeb() {
        if (webView == null) return;
        final int top = insetTopPx, bottom = insetBottomPx, left = insetLeftPx, right = insetRightPx;
        webView.post(() -> {
            if (webView == null) return;
            String js = "(function(){var s=document.documentElement&&document.documentElement.style;if(!s)return;" +
                    "s.setProperty('--native-safe-top','" + top + "px');" +
                    "s.setProperty('--native-safe-bottom','" + bottom + "px');" +
                    "s.setProperty('--native-safe-left','" + left + "px');" +
                    "s.setProperty('--native-safe-right','" + right + "px');})();";
            webView.evaluateJavascript(js, null);
        });
    }

    private final class NativeDataClient extends WebViewClient {
        @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
            return intercept(view, request.getUrl().toString(), request.getRequestHeaders());
        }

        @SuppressWarnings("deprecation")
        @Override public WebResourceResponse shouldInterceptRequest(WebView view, String url) {
            return intercept(view, url, Collections.emptyMap());
        }

        @Override public void onPageFinished(WebView view, String url) {
            super.onPageFinished(view, url);
            applyInsetsToWeb();
        }

        @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            if (!request.isForMainFrame()) return false;
            return handleNavigation(request.getUrl());
        }

        @SuppressWarnings("deprecation")
        @Override public boolean shouldOverrideUrlLoading(WebView view, String url) {
            return handleNavigation(Uri.parse(url));
        }

        private boolean handleNavigation(Uri uri) {
            if (uri == null) return true;
            if ("app.local".equalsIgnoreCase(uri.getHost())) return false;
            if ("https".equalsIgnoreCase(uri.getScheme())) {
                try { startActivity(new Intent(Intent.ACTION_VIEW, uri)); } catch (Exception ignored) {}
            }
            return true;
        }

        private WebResourceResponse intercept(WebView view, String url, Map<String, String> requestHeaders) {
            try {
                if ((APP_ORIGIN + "index.html").equals(url)) {
                    return new WebResourceResponse("text/html", "UTF-8", view.getContext().getAssets().open("index.html"));
                }
                if ((APP_ORIGIN + "app_icon.png").equals(url)) {
                    return new WebResourceResponse("image/png", null, view.getContext().getAssets().open("app_icon.png"));
                }
                if (url != null && url.startsWith(PROXY_PREFIX)) {
                    Uri proxyUri = Uri.parse(url);
                    String target = proxyUri.getQueryParameter("u");
                    boolean force = "1".equals(proxyUri.getQueryParameter("fresh"));
                    long maxAge = 0L;
                    try { maxAge = Long.parseLong(String.valueOf(proxyUri.getQueryParameter("maxAge"))); } catch (Exception ignored) {}
                    if (target == null || target.isEmpty()) return errorResponse(400, "Missing upstream URL");
                    if (!force && maxAge > 0L) {
                        RiskDatabase.HttpCacheEntry cached = riskDatabase.loadHttpCache(target, Math.min(maxAge, 7L * 24L * 60L * 60L * 1000L));
                        if (cached != null && cached.body != null) {
                            return new WebResourceResponse(cached.contentType, "UTF-8", new ByteArrayInputStream(cached.body));
                        }
                    }
                    return fetchAllowed(target, 0);
                }
            } catch (Exception e) {
                if (url != null && url.startsWith(PROXY_PREFIX)) {
                    try {
                        String target = Uri.parse(url).getQueryParameter("u");
                        RiskDatabase.HttpCacheEntry cached = target == null ? null : riskDatabase.loadHttpCache(target, 7L * 24L * 60L * 60L * 1000L);
                        if (cached != null && cached.body != null) {
                            return new WebResourceResponse(cached.contentType, "UTF-8", new ByteArrayInputStream(cached.body));
                        }
                    } catch (Exception ignored) {}
                }
                return errorResponse(502, "Native data bridge failed");
            }
            return null;
        }

        private WebResourceResponse fetchAllowed(String target, int redirects) throws Exception {
            if (redirects > 4) return errorResponse(508, "Too many redirects");
            URL u = new URL(target);
            if (!"https".equalsIgnoreCase(u.getProtocol()) || !isAllowedHost(u.getHost())) {
                return errorResponse(403, "Upstream host is not allowed");
            }

            HttpURLConnection c = (HttpURLConnection) u.openConnection();
            c.setConnectTimeout(12000);
            c.setReadTimeout(18000);
            c.setInstanceFollowRedirects(false);
            c.setRequestMethod("GET");
            c.setRequestProperty("User-Agent", "Mozilla/5.0 (Linux; Android) AppleWebKit/537.36 MarketRiskMonitor/3.5.1.36");
            c.setRequestProperty("Accept", "application/json,text/csv,text/plain,*/*");
            if ("agsi.gie.eu".equalsIgnoreCase(u.getHost())) {
                String agsiKey = AgsiKeyStore.load(MainActivity.this);
                if (agsiKey == null || agsiKey.isEmpty()) { c.disconnect(); return errorResponse(401, "GIE AGSI API key not configured"); }
                c.setRequestProperty("x-key", agsiKey);
            }
            int status = c.getResponseCode();

            if (status >= 300 && status < 400) {
                String location = c.getHeaderField("Location");
                c.disconnect();
                if (location == null || location.isEmpty()) return errorResponse(502, "Redirect without location");
                URL next = new URL(u, location);
                return fetchAllowed(next.toString(), redirects + 1);
            }

            long declared = c.getContentLengthLong();
            if (declared > MAX_UPSTREAM_BYTES) {
                c.disconnect();
                return errorResponse(413, "Upstream response too large");
            }
            InputStream in = status >= 400 ? c.getErrorStream() : c.getInputStream();
            if (in == null) {
                c.disconnect();
                return errorResponse(status, "Empty upstream response");
            }
            String ct = c.getContentType();
            byte[] body;
            try (InputStream src = in; ByteArrayOutputStream out = new ByteArrayOutputStream()) {
                byte[] buf = new byte[16384];
                int total = 0, n;
                while ((n = src.read(buf)) != -1) {
                    total += n;
                    if (total > MAX_UPSTREAM_BYTES) {
                        c.disconnect();
                        return errorResponse(413, "Upstream response too large");
                    }
                    out.write(buf, 0, n);
                }
                body = out.toByteArray();
            } finally {
                c.disconnect();
            }

            String mime = ct != null && ct.toLowerCase(Locale.ROOT).contains("json") ? "application/json" :
                    (ct != null && ct.toLowerCase(Locale.ROOT).contains("csv") ? "text/csv" : "text/plain");
            final byte[] cacheBody = body;
            final String cacheMime = mime;
            if (!"agsi.gie.eu".equalsIgnoreCase(u.getHost()) || (status >= 200 && status < 300)) dbExecutor.execute(() -> {
                try { riskDatabase.saveHttpCache(target, cacheMime, cacheBody, System.currentTimeMillis()); } catch (Exception ignored) {}
            });
            WebResourceResponse response = new WebResourceResponse(mime, "UTF-8", new ByteArrayInputStream(body));
            response.setStatusCodeAndReasonPhrase(status, status >= 400 ? "Upstream Error" : "OK");
            Map<String, String> diagnosticHeaders = new java.util.HashMap<>();
            diagnosticHeaders.put("X-MRM-Upstream-URL", u.toString());
            diagnosticHeaders.put("X-MRM-Redirect-Count", String.valueOf(redirects));
            diagnosticHeaders.put("X-MRM-Response-Bytes", String.valueOf(body.length));
            response.setResponseHeaders(diagnosticHeaders);
            return response;
        }

        private boolean isAllowedHost(String host) {
            if (host == null) return false;
            String h = host.toLowerCase(Locale.ROOT);
            if (ALLOWED_HOSTS.contains(h)) return true;
            return h.endsWith(".stlouisfed.org") || h.endsWith(".worldbank.org") || h.endsWith(".ecb.europa.eu") ||
                    h.endsWith(".cboe.com") || h.endsWith(".finance.yahoo.com") || h.endsWith(".zse.hr") ||
                    h.endsWith(".fiscaldata.treasury.gov") || h.endsWith(".newyorkfed.org") ||
                    h.endsWith(".financialresearch.gov") || h.endsWith(".cftc.gov") || h.endsWith(".eia.gov") ||
                    h.endsWith(".energy.gov") || h.endsWith(".gold.org") || h.endsWith(".gie.eu") ||
                    h.endsWith(".ec.europa.eu") || h.endsWith(".fao.org");
        }

        private WebResourceResponse errorResponse(int status, String message) {
            String safe = message == null ? "Bridge error" : message.replace("\\", "'").replace("\"", "'");
            byte[] body = ("{\"error\":\"" + safe + "\"}").getBytes(StandardCharsets.UTF_8);
            WebResourceResponse r = new WebResourceResponse("application/json", "UTF-8", new ByteArrayInputStream(body));
            r.setStatusCodeAndReasonPhrase(Math.max(400, status), "Bridge Error");
            return r;
        }
    }


    private boolean resolveNativeDark(String mode) {
        if ("dark".equalsIgnoreCase(mode)) return true;
        if ("light".equalsIgnoreCase(mode)) return false;
        int night = getResources().getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK;
        return night == Configuration.UI_MODE_NIGHT_YES;
    }

    private void applyNativeTheme(String mode) {
        final String safeMode = ("dark".equalsIgnoreCase(mode) || "light".equalsIgnoreCase(mode)) ? mode.toLowerCase(Locale.ROOT) : "system";
        final boolean dark = resolveNativeDark(safeMode);
        runOnUiThread(() -> {
            try {
                int bg = Color.parseColor(dark ? "#0B1220" : "#F5F7FA");
                Window window = getWindow();
                window.setStatusBarColor(bg);
                window.setNavigationBarColor(bg);
                View decor = window.getDecorView();
                int flags = decor.getSystemUiVisibility();
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    if (dark) flags &= ~View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
                    else flags |= View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
                }
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    if (dark) flags &= ~View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
                    else flags |= View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
                }
                decor.setSystemUiVisibility(flags);
                if (webView != null) webView.setBackgroundColor(bg);
            } catch (Exception ignored) {}
        });
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(CHANNEL_ID, "Market risk alerts", NotificationManager.IMPORTANCE_DEFAULT);
            channel.setDescription("Alerts when configured market-risk thresholds are crossed");
            getSystemService(NotificationManager.class).createNotificationChannel(channel);
        }
    }

    private final class AndroidBridge {
        private final Context context;
        AndroidBridge(Context context) { this.context = context; }

        @JavascriptInterface public void requestNotificationPermission() {
            if (Build.VERSION.SDK_INT >= 33 && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                runOnUiThread(() -> requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, 4201));
            }
        }

        @JavascriptInterface public void persistSnapshot(String json) {
            if (json == null || json.isEmpty() || json.length() > 12_000_000) return;
            dbExecutor.execute(() -> {
                try { riskDatabase.persistPayload(json); } catch (Exception ignored) {}
            });
        }

        @JavascriptInterface public String loadLatestSnapshot() {
            try { return riskDatabase.loadLatestPayload(); } catch (Exception ignored) { return null; }
        }

        @JavascriptInterface public boolean saveAgsiApiKey(String apiKey) {
            boolean ok = AgsiKeyStore.save(context, apiKey);
            if (ok) dbExecutor.execute(() -> { try { riskDatabase.deleteHttpCachePrefix("https://agsi.gie.eu/"); } catch (Exception ignored) {} });
            return ok;
        }

        @JavascriptInterface public boolean hasAgsiApiKey() { return AgsiKeyStore.has(context); }

        @JavascriptInterface public void clearAgsiApiKey() {
            AgsiKeyStore.clear(context);
            dbExecutor.execute(() -> { try { riskDatabase.deleteHttpCachePrefix("https://agsi.gie.eu/"); } catch (Exception ignored) {} });
        }

        @JavascriptInterface public void setThemeMode(String mode) {
            String safeMode = ("dark".equalsIgnoreCase(mode) || "light".equalsIgnoreCase(mode)) ? mode.toLowerCase(Locale.ROOT) : "system";
            getSharedPreferences("mrm_ui", MODE_PRIVATE).edit().putString("theme", safeMode).apply();
            applyNativeTheme(safeMode);
        }

        @JavascriptInterface public void configureBackgroundRefresh(int minutes, boolean enabled) {
            int safeMinutes = Math.max(15, minutes);
            getSharedPreferences("mrm_background", MODE_PRIVATE).edit()
                    .putBoolean("enabled", enabled)
                    .putInt("minutes", safeMinutes)
                    .apply();
            BackgroundRefreshScheduler.configure(context, safeMinutes, enabled);
        }

        @JavascriptInterface public String backgroundRefreshStatus() {
            SharedPreferences p = getSharedPreferences("mrm_background", MODE_PRIVATE);
            return "{\"enabled\":" + p.getBoolean("enabled", false) + ",\"minutes\":" + p.getInt("minutes", 30) + "}";
        }

        @JavascriptInterface public String saveExportFile(String fileName, String mimeType, String base64Payload) {
            if (fileName == null || fileName.isEmpty() || base64Payload == null || base64Payload.isEmpty()) return "ERROR|Invalid export payload";
            String safeName = fileName.replaceAll("[^A-Za-z0-9._-]", "_");
            if (safeName.length() > 180) safeName = safeName.substring(safeName.length() - 180);
            if (safeName.isEmpty()) return "ERROR|Invalid filename";
            String safeMime = (mimeType == null || mimeType.isEmpty()) ? "application/octet-stream" : mimeType;
            try {
                byte[] data = Base64.decode(base64Payload, Base64.DEFAULT);
                if (data.length == 0) return "ERROR|Empty export payload";
                if (data.length > 12 * 1024 * 1024) return "ERROR|Export exceeds 12 MB native-save limit";
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    ContentValues values = new ContentValues();
                    values.put(MediaStore.MediaColumns.DISPLAY_NAME, safeName);
                    values.put(MediaStore.MediaColumns.MIME_TYPE, safeMime);
                    values.put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/MarketRiskMonitor");
                    values.put(MediaStore.MediaColumns.IS_PENDING, 1);
                    ContentResolver resolver = context.getContentResolver();
                    Uri uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
                    if (uri == null) return "ERROR|MediaStore insert failed";
                    try (OutputStream out = resolver.openOutputStream(uri)) {
                        if (out == null) return "ERROR|Cannot open Downloads output stream";
                        out.write(data);
                        out.flush();
                    }
                    values.clear();
                    values.put(MediaStore.MediaColumns.IS_PENDING, 0);
                    resolver.update(uri, values, null, null);
                } else {
                    File dir = context.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);
                    if (dir == null) return "ERROR|Legacy export directory unavailable";
                    if (!dir.exists() && !dir.mkdirs()) return "ERROR|Cannot create legacy export directory";
                    File outFile = new File(dir, safeName);
                    try (FileOutputStream out = new FileOutputStream(outFile, false)) {
                        out.write(data);
                        out.flush();
                    }
                }
                return "OK|" + safeName + "|" + data.length;
            } catch (Exception e) {
                String msg = e.getMessage();
                return "ERROR|" + e.getClass().getSimpleName() + (msg == null || msg.isEmpty() ? "" : ": " + msg);
            }
        }

        @JavascriptInterface public void notifyUser(String title, String message) {
            if (Build.VERSION.SDK_INT >= 33 && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) return;
            NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            android.app.Notification.Builder b = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                    ? new android.app.Notification.Builder(context, CHANNEL_ID)
                    : new android.app.Notification.Builder(context);
            b.setContentTitle(title == null ? "Market Risk Monitor" : title)
                    .setContentText(message == null ? "Risk alert" : message)
                    .setSmallIcon(android.R.drawable.stat_notify_error)
                    .setAutoCancel(true);
            nm.notify((int) (System.currentTimeMillis() & 0x7fffffff), b.build());
        }
    }

    private void fallbackBackNavigation() {
        if (webView != null && webView.canGoBack()) { webView.goBack(); return; }
        MainActivity.super.onBackPressed();
    }

    @Override public void onBackPressed() {
        if (webView == null) { super.onBackPressed(); return; }
        try {
            webView.evaluateJavascript(
                    "(function(){try{return window.MRMHandleBack?!!window.MRMHandleBack():false}catch(e){return false}})();",
                    value -> { if (!"true".equals(value)) fallbackBackNavigation(); });
        } catch (Exception ignored) {
            fallbackBackNavigation();
        }
    }

    @Override protected void onDestroy() {
        if (webView != null) {
            webView.removeJavascriptInterface("Android");
            webView.stopLoading();
            webView.loadUrl("about:blank");
            webView.destroy();
            webView = null;
        }
        dbExecutor.shutdownNow();
        if (riskDatabase != null) riskDatabase.close();
        super.onDestroy();
    }
}
