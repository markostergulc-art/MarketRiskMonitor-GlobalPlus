package com.marko.marketrisk.globalplus;

import android.content.Context;

import androidx.annotation.NonNull;
import androidx.work.Worker;
import androidx.work.WorkerParameters;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.List;
import java.util.Locale;

import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Background-safe raw-data prefetcher. It does not execute or alter the financial engine.
 * It refreshes only URLs that the foreground app has already successfully used, then stores
 * raw provider responses in the same bounded native cache used as a transport fallback.
 */
public final class BackgroundRefreshWorker extends Worker {
    private static final int MAX_BYTES = 6 * 1024 * 1024;
    public BackgroundRefreshWorker(@NonNull Context context, @NonNull WorkerParameters params) {
        super(context, params);
    }

    @NonNull @Override public Result doWork() {
        RiskDatabase db = new RiskDatabase(getApplicationContext());
        try {
            List<String> urls = db.listBackgroundRefreshUrls(48);
            long startedAt = System.currentTimeMillis();
            if (urls.isEmpty()) {
                recordRun(startedAt, 0, 0, true, "[]");
                return Result.success();
            }
            int successes = 0;
            JSONArray endpointResults = new JSONArray();
            for (String url : urls) {
                if (isStopped()) break;
                long endpointStarted = System.currentTimeMillis();
                FetchResult r;
                try {
                    r = fetch(url);
                    if (r != null && r.ok() && r.body.length > 0) {
                        db.saveHttpCache(url, r.contentType, r.body, System.currentTimeMillis());
                        successes++;
                    }
                } catch (Exception e) {
                    r = FetchResult.failure(0, e.getClass().getSimpleName());
                    // Provider isolation: one failed endpoint never aborts the whole periodic job.
                }
                try {
                    URL parsed = new URL(url);
                    JSONObject d = new JSONObject();
                    d.put("host", parsed.getHost());
                    d.put("status", r == null ? 0 : r.status);
                    d.put("success", r != null && r.ok());
                    d.put("latencyMs", Math.max(0L, System.currentTimeMillis() - endpointStarted));
                    d.put("error", r == null ? "NO_RESULT" : r.error);
                    endpointResults.put(d);
                } catch (Exception ignored) {}
            }
            boolean ok = successes > 0;
            recordRun(startedAt, urls.size(), successes, ok, endpointResults.toString());
            return ok ? Result.success() : Result.retry();
        } finally {
            db.close();
        }
    }

    private void recordRun(long startedAt, int attempted, int successes, boolean completed, String endpointResults) {
        try {
            getApplicationContext().getSharedPreferences("mrm_background", Context.MODE_PRIVATE).edit()
                    .putLong("lastRunStartedAt", startedAt)
                    .putLong("lastRunFinishedAt", System.currentTimeMillis())
                    .putInt("lastAttempted", attempted)
                    .putInt("lastSuccesses", successes)
                    .putBoolean("lastCompleted", completed)
                    .putString("lastEndpointResults", endpointResults == null ? "[]" : endpointResults)
                    .putString("engine", "HTTP_PREFETCH_ONLY")
                    .apply();
        } catch (Exception ignored) {}
    }

    private static final class FetchResult {
        final String contentType; final byte[] body; final int status; final String error;
        FetchResult(String contentType, byte[] body, int status, String error) {
            this.contentType = contentType; this.body = body == null ? new byte[0] : body; this.status = status; this.error = error;
        }
        static FetchResult failure(int status, String error) { return new FetchResult("application/octet-stream", new byte[0], status, error); }
        boolean ok() { return status >= 200 && status < 300 && error == null; }
    }

    private FetchResult fetch(String target) throws Exception {
        URL u = new URL(target);
        if (!"https".equalsIgnoreCase(u.getProtocol()) || !allowed(u.getHost())) return FetchResult.failure(0, "HOST_NOT_ALLOWED");
        HttpURLConnection c = (HttpURLConnection) u.openConnection();
        c.setConnectTimeout(12000); c.setReadTimeout(18000); c.setInstanceFollowRedirects(true);
        c.setRequestProperty("User-Agent", "Mozilla/5.0 (Linux; Android) MarketRiskMonitor/2026.09.26.3");
        c.setRequestProperty("Accept", "application/json,text/csv,text/plain,*/*");
        if ("agsi.gie.eu".equalsIgnoreCase(u.getHost())) {
            String agsiKey = AgsiKeyStore.load(getApplicationContext());
            if (agsiKey == null || agsiKey.isEmpty()) { c.disconnect(); return FetchResult.failure(0, "AGSI_KEY_MISSING"); }
            c.setRequestProperty("x-key", agsiKey);
        }
        try {
            int status = c.getResponseCode();
            if (status < 200 || status >= 300) return FetchResult.failure(status, "HTTP_" + status);
            long declared = c.getContentLengthLong(); if (declared > MAX_BYTES) return FetchResult.failure(status, "RESPONSE_TOO_LARGE");
            try (InputStream in = c.getInputStream(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
                byte[] buf = new byte[16384]; int total = 0, n;
                while ((n = in.read(buf)) != -1) {
                    total += n; if (total > MAX_BYTES) return FetchResult.failure(status, "RESPONSE_TOO_LARGE"); out.write(buf, 0, n);
                }
                String ct = c.getContentType();
                return new FetchResult(ct == null ? "application/octet-stream" : ct, out.toByteArray(), status, null);
            }
        } finally { c.disconnect(); }
    }

    private boolean allowed(String host) {
        if (host == null) return false;
        String h = host.toLowerCase(Locale.ROOT);
        return h.endsWith(".stlouisfed.org") || h.equals("fred.stlouisfed.org") ||
                h.endsWith(".worldbank.org") || h.endsWith(".ecb.europa.eu") ||
                h.endsWith(".cboe.com") || h.endsWith(".finance.yahoo.com") ||
                h.endsWith(".zse.hr") || h.endsWith(".fiscaldata.treasury.gov") ||
                h.endsWith(".newyorkfed.org") || h.endsWith(".financialresearch.gov") ||
                h.endsWith(".cftc.gov") || h.endsWith(".eia.gov") || h.endsWith(".energy.gov") ||
                h.endsWith(".gold.org") || h.endsWith(".gie.eu") || h.endsWith(".ec.europa.eu") ||
                h.equals("ssga.com") || h.endsWith(".ssga.com") ||
                h.equals("bundesbank.de") || h.endsWith(".bundesbank.de") ||
                h.equals("api.statistiken.bundesbank.de");
    }
}
