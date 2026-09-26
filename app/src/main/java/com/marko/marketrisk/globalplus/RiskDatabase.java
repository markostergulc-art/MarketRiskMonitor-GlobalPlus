package com.marko.marketrisk.globalplus;

import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteOpenHelper;

import org.json.JSONArray;
import org.json.JSONObject;

public class RiskDatabase extends SQLiteOpenHelper {
    private static final String DB_NAME = "market_risk.db";
    private static final int DB_VERSION = 4;
    private static final int MAX_HISTORY_DAYS = 1900;

    public RiskDatabase(Context context) {
        super(context, DB_NAME, null, DB_VERSION);
    }

    @Override
    public void onCreate(SQLiteDatabase db) {
        db.execSQL("CREATE TABLE indicator_snapshot (" +
                "id INTEGER PRIMARY KEY AUTOINCREMENT," +
                "market TEXT NOT NULL," +
                "indicator TEXT NOT NULL," +
                "timestamp TEXT NOT NULL," +
                "value REAL," +
                "status TEXT," +
                "source TEXT," +
                "confidence TEXT," +
                "UNIQUE(market, indicator, timestamp) ON CONFLICT REPLACE)");
        db.execSQL("CREATE TABLE risk_history (" +
                "day TEXT PRIMARY KEY," +
                "global_score REAL," +
                "contagion_score REAL," +
                "payload_json TEXT NOT NULL)");
        db.execSQL("CREATE INDEX idx_indicator_market_time ON indicator_snapshot(market, timestamp)");
        db.execSQL("CREATE INDEX idx_indicator_timestamp ON indicator_snapshot(timestamp)");
        db.execSQL("CREATE TABLE http_cache (" +
                "url TEXT PRIMARY KEY," +
                "content_type TEXT," +
                "body BLOB NOT NULL," +
                "fetched_at INTEGER NOT NULL," +
                "last_accessed INTEGER NOT NULL)");
        db.execSQL("CREATE INDEX idx_http_cache_access ON http_cache(last_accessed)");
        createV4Tables(db);
    }

    @Override
    public void onUpgrade(SQLiteDatabase db, int oldVersion, int newVersion) {
        if (oldVersion < 2) {
            db.execSQL("CREATE INDEX IF NOT EXISTS idx_indicator_timestamp ON indicator_snapshot(timestamp)");
        }
        if (oldVersion < 3) {
            db.execSQL("CREATE TABLE IF NOT EXISTS http_cache (" +
                    "url TEXT PRIMARY KEY," +
                    "content_type TEXT," +
                    "body BLOB NOT NULL," +
                    "fetched_at INTEGER NOT NULL," +
                    "last_accessed INTEGER NOT NULL)");
            db.execSQL("CREATE INDEX IF NOT EXISTS idx_http_cache_access ON http_cache(last_accessed)");
        }
        if (oldVersion < 4) createV4Tables(db);
    }

    private static void createV4Tables(SQLiteDatabase db) {
        db.execSQL("CREATE TABLE IF NOT EXISTS calculation_snapshot (" +
                "calculation_id TEXT PRIMARY KEY," +
                "calculated_at TEXT NOT NULL," +
                "model_version TEXT," +
                "app_version TEXT," +
                "config_hash TEXT," +
                "input_hash TEXT," +
                "global_score REAL," +
                "coverage REAL," +
                "payload_json TEXT NOT NULL)");
        db.execSQL("CREATE INDEX IF NOT EXISTS idx_calc_snapshot_time ON calculation_snapshot(calculated_at)");
        db.execSQL("CREATE TABLE IF NOT EXISTS observation_revision (" +
                "revision_id TEXT PRIMARY KEY," +
                "metric_id TEXT NOT NULL," +
                "observation_date TEXT," +
                "detected_at TEXT NOT NULL," +
                "payload_json TEXT NOT NULL)");
        db.execSQL("CREATE INDEX IF NOT EXISTS idx_observation_revision_metric ON observation_revision(metric_id, observation_date)");
        db.execSQL("CREATE TABLE IF NOT EXISTS change_event (" +
                "event_id TEXT PRIMARY KEY," +
                "created_at TEXT NOT NULL," +
                "before_calculation_id TEXT," +
                "after_calculation_id TEXT," +
                "event_type TEXT," +
                "metric_id TEXT," +
                "payload_json TEXT NOT NULL)");
        db.execSQL("CREATE INDEX IF NOT EXISTS idx_change_event_time ON change_event(created_at)");
        db.execSQL("CREATE TABLE IF NOT EXISTS alert_rule (" +
                "rule_id TEXT PRIMARY KEY," +
                "updated_at TEXT NOT NULL," +
                "payload_json TEXT NOT NULL)");
        db.execSQL("CREATE TABLE IF NOT EXISTS alert_event (" +
                "alert_id TEXT PRIMARY KEY," +
                "created_at TEXT NOT NULL," +
                "alert_type TEXT," +
                "state TEXT," +
                "calculation_id TEXT," +
                "payload_json TEXT NOT NULL)");
        db.execSQL("CREATE INDEX IF NOT EXISTS idx_alert_event_time ON alert_event(created_at)");
    }

    public void persistPayload(String json) throws Exception {
        JSONObject root = new JSONObject(json);
        String generatedTs = root.optString("generatedAt", "");
        if (generatedTs.isEmpty()) return;
        String day = generatedTs.length() >= 10 ? generatedTs.substring(0, 10) : generatedTs;
        String ts = day;
        SQLiteDatabase db = getWritableDatabase();
        db.beginTransaction();
        try {
            JSONObject global = root.optJSONObject("global");
            if (global != null) {
                putIndicator(db, "GLOBAL", "GLOBAL_RISK_SCORE", ts, global.optDouble("score", Double.NaN),
                        global.optJSONObject("band") != null ? global.optJSONObject("band").optString("label", "") : "",
                        "Internal risk model", "MODEL");
                putIndicator(db, "GLOBAL", "CONTAGION_SCORE", ts, global.optDouble("contagion", Double.NaN),
                        global.optString("corrRegime", ""), "Internal correlation model", "MODEL");
            }


            JSONObject crossAsset = root.optJSONObject("crossAsset");
            if (crossAsset != null) {
                putIndicator(db, "XASSET", "CROSS_ASSET_RISK_SCORE", ts, crossAsset.optDouble("score", Double.NaN),
                        crossAsset.optJSONObject("scenario") != null ? crossAsset.optJSONObject("scenario").optString("name", "") : "",
                        "Cross-asset composite", "MODEL");
                JSONArray xa = crossAsset.optJSONArray("indicators");
                if (xa != null) {
                    for (int i = 0; i < xa.length(); i++) {
                        JSONObject e = xa.optJSONObject(i); if (e == null) continue;
                        putIndicator(db, "XASSET", e.optString("name", "XASSET_" + i), ts,
                                e.optDouble("value", Double.NaN), "", e.optString("source", ""), "SOURCE");
                    }
                }
            }

            JSONArray countries = root.optJSONArray("countries");
            if (countries != null) {
                for (int i = 0; i < countries.length(); i++) {
                    JSONObject c = countries.optJSONObject(i);
                    if (c == null) continue;
                    String market = c.optString("code", "UNKNOWN");
                    JSONObject metrics = c.optJSONObject("metrics");
                    JSONObject quality = c.optJSONObject("quality");
                    String source = quality != null ? quality.optString("source", "") : "";
                    String confidence = quality != null ? quality.optString("confidence", "") : "";
                    if (metrics != null) {
                        putIndicator(db, market, "MAIN_INDEX", ts, metrics.optDouble("value", Double.NaN), "", source, confidence);
                        putIndicator(db, market, "RETURN_1D_PCT", ts, metrics.optDouble("d1", Double.NaN), "", source, confidence);
                        putIndicator(db, market, "DIST_200DMA_PCT", ts, metrics.optDouble("dist200", Double.NaN), "", source, confidence);
                        putIndicator(db, market, "DRAWDOWN_52W_PCT", ts, metrics.optDouble("draw52", Double.NaN), "", source, confidence);
                        putIndicator(db, market, "REALIZED_VOL_20D_PCT", ts, metrics.optDouble("rv20", Double.NaN), "", source, confidence);
                    }
                    putIndicator(db, market, "COUNTRY_RISK_SCORE", ts, c.optDouble("risk", Double.NaN),
                            c.optJSONObject("band") != null ? c.optJSONObject("band").optString("label", "") : "",
                            "Internal risk model", "MODEL");
                    JSONObject subs = c.optJSONObject("subscores");
                    if (subs != null) {
                        String[] keys = {"market", "macro", "credit", "liquidity", "valuation", "technical", "systemic"};
                        for (String key : keys) {
                            putIndicator(db, market, "SUBSCORE_" + key.toUpperCase(), ts,
                                    subs.optDouble(key, Double.NaN), "", "Internal risk model", "MODEL");
                        }
                    }
                }
            }

            JSONArray early = root.optJSONArray("early");
            if (early != null) {
                for (int i = 0; i < early.length(); i++) {
                    JSONObject e = early.optJSONObject(i);
                    if (e == null) continue;
                    putIndicator(db, "GLOBAL", e.optString("name", "EARLY_" + i), ts,
                            e.optDouble("value", Double.NaN), "", e.optString("source", ""), "SOURCE");
                }
            }

            ContentValues hist = new ContentValues();
            hist.put("day", day);
            hist.put("global_score", global != null ? global.optDouble("score", Double.NaN) : Double.NaN);
            hist.put("contagion_score", global != null ? global.optDouble("contagion", Double.NaN) : Double.NaN);
            hist.put("payload_json", json);
            db.insertWithOnConflict("risk_history", null, hist, SQLiteDatabase.CONFLICT_REPLACE);
            db.delete("indicator_snapshot", "timestamp < date('now', '-' || ? || ' days')", new String[]{String.valueOf(MAX_HISTORY_DAYS)});
            db.delete("risk_history", "day < date('now', '-' || ? || ' days')", new String[]{String.valueOf(MAX_HISTORY_DAYS)});
            db.setTransactionSuccessful();
        } finally {
            db.endTransaction();
        }
    }

    public String loadLatestPayload() {
        SQLiteDatabase db = getReadableDatabase();
        try (Cursor c = db.rawQuery("SELECT payload_json FROM risk_history ORDER BY day DESC LIMIT 1", null)) {
            return c.moveToFirst() ? c.getString(0) : null;
        }
    }

    public static final class HttpCacheEntry {
        public final String url;
        public final String contentType;
        public final byte[] body;
        public final long fetchedAt;
        HttpCacheEntry(String url, String contentType, byte[] body, long fetchedAt) {
            this.url = url; this.contentType = contentType; this.body = body; this.fetchedAt = fetchedAt;
        }
    }

    public synchronized void saveHttpCache(String url, String contentType, byte[] body, long fetchedAt) {
        if (url == null || url.isEmpty() || body == null || body.length == 0 || body.length > 6 * 1024 * 1024) return;
        SQLiteDatabase db = getWritableDatabase();
        ContentValues cv = new ContentValues();
        cv.put("url", url);
        cv.put("content_type", contentType == null ? "application/octet-stream" : contentType);
        cv.put("body", body);
        cv.put("fetched_at", fetchedAt);
        cv.put("last_accessed", System.currentTimeMillis());
        db.insertWithOnConflict("http_cache", null, cv, SQLiteDatabase.CONFLICT_REPLACE);
        // Bounded cache: retain recently used rows and remove very old payloads.
        db.delete("http_cache", "fetched_at < ?", new String[]{String.valueOf(System.currentTimeMillis() - 7L * 24L * 60L * 60L * 1000L)});
        db.execSQL("DELETE FROM http_cache WHERE url NOT IN (SELECT url FROM http_cache ORDER BY last_accessed DESC LIMIT 96)");
    }

    public synchronized void deleteHttpCachePrefix(String prefix) {
        if (prefix == null || prefix.isEmpty()) return;
        SQLiteDatabase db = getWritableDatabase();
        db.delete("http_cache", "url LIKE ?", new String[]{prefix + "%"});
    }

    public synchronized HttpCacheEntry loadHttpCache(String url, long maxAgeMs) {
        if (url == null || url.isEmpty()) return null;
        SQLiteDatabase db = getWritableDatabase();
        try (Cursor c = db.rawQuery("SELECT content_type, body, fetched_at FROM http_cache WHERE url=? LIMIT 1", new String[]{url})) {
            if (!c.moveToFirst()) return null;
            long fetchedAt = c.getLong(2);
            if (maxAgeMs > 0 && System.currentTimeMillis() - fetchedAt > maxAgeMs) return null;
            byte[] body = c.getBlob(1);
            String contentType = c.getString(0);
            ContentValues touch = new ContentValues(); touch.put("last_accessed", System.currentTimeMillis());
            db.update("http_cache", touch, "url=?", new String[]{url});
            return new HttpCacheEntry(url, contentType, body, fetchedAt);
        }
    }

    public synchronized java.util.List<String> listBackgroundRefreshUrls(int limit) {
        java.util.ArrayList<String> out = new java.util.ArrayList<>();
        SQLiteDatabase db = getReadableDatabase();
        int n = Math.max(1, Math.min(48, limit));
        try (Cursor c = db.rawQuery("SELECT url FROM http_cache ORDER BY last_accessed DESC LIMIT " + n, null)) {
            while (c.moveToNext()) out.add(c.getString(0));
        }
        return out;
    }

    public synchronized void persistCalculationSnapshot(String json) throws Exception {
        JSONObject o = new JSONObject(json);
        String id = o.optString("calculationId", "");
        String at = o.optString("calculatedAt", "");
        if (id.isEmpty() || at.isEmpty()) return;
        ContentValues cv = new ContentValues();
        cv.put("calculation_id", id); cv.put("calculated_at", at);
        cv.put("model_version", o.optString("modelVersion", null));
        cv.put("app_version", o.optString("appVersion", null));
        cv.put("config_hash", o.optString("configHash", null));
        cv.put("input_hash", o.optString("inputSetHash", null));
        if (o.has("globalScore") && !o.isNull("globalScore")) cv.put("global_score", o.optDouble("globalScore")); else cv.putNull("global_score");
        if (o.has("coverage") && !o.isNull("coverage")) cv.put("coverage", o.optDouble("coverage")); else cv.putNull("coverage");
        cv.put("payload_json", json);
        SQLiteDatabase db = getWritableDatabase();
        db.insertWithOnConflict("calculation_snapshot", null, cv, SQLiteDatabase.CONFLICT_REPLACE);
        db.execSQL("DELETE FROM calculation_snapshot WHERE calculation_id NOT IN (SELECT calculation_id FROM calculation_snapshot ORDER BY calculated_at DESC LIMIT 240)");
    }

    public synchronized String loadCalculationSnapshots(int limit) {
        int n = Math.max(1, Math.min(240, limit));
        JSONArray out = new JSONArray();
        SQLiteDatabase db = getReadableDatabase();
        try (Cursor c = db.rawQuery("SELECT payload_json FROM (SELECT payload_json, calculated_at FROM calculation_snapshot ORDER BY calculated_at DESC LIMIT " + n + ") ORDER BY calculated_at ASC", null)) {
            while (c.moveToNext()) try { out.put(new JSONObject(c.getString(0))); } catch (Exception ignored) {}
        }
        return out.toString();
    }

    public synchronized void persistChangeEvents(String jsonArray) throws Exception {
        JSONArray a = new JSONArray(jsonArray);
        SQLiteDatabase db = getWritableDatabase();
        db.beginTransaction();
        try {
            for (int i=0;i<a.length();i++) {
                JSONObject o=a.optJSONObject(i); if(o==null) continue;
                String id=o.optString("eventId",""); if(id.isEmpty()) continue;
                ContentValues cv=new ContentValues();
                cv.put("event_id",id); cv.put("created_at",o.optString("createdAt",""));
                cv.put("before_calculation_id",o.optString("beforeCalculationId",null));
                cv.put("after_calculation_id",o.optString("afterCalculationId",null));
                cv.put("event_type",o.optString("type",null)); cv.put("metric_id",o.optString("metricId",null));
                cv.put("payload_json",o.toString());
                db.insertWithOnConflict("change_event",null,cv,SQLiteDatabase.CONFLICT_REPLACE);
            }
            db.execSQL("DELETE FROM change_event WHERE event_id NOT IN (SELECT event_id FROM change_event ORDER BY created_at DESC LIMIT 800)");
            db.setTransactionSuccessful();
        } finally { db.endTransaction(); }
    }

    public synchronized String loadChangeEvents(int limit) {
        int n=Math.max(1,Math.min(800,limit)); JSONArray out=new JSONArray(); SQLiteDatabase db=getReadableDatabase();
        try(Cursor c=db.rawQuery("SELECT payload_json FROM change_event ORDER BY created_at DESC LIMIT "+n,null)){
            while(c.moveToNext())try{out.put(new JSONObject(c.getString(0)));}catch(Exception ignored){}
        } return out.toString();
    }

    public synchronized void persistAlertEvents(String jsonArray) throws Exception {
        JSONArray a=new JSONArray(jsonArray); SQLiteDatabase db=getWritableDatabase(); db.beginTransaction();
        try { for(int i=0;i<a.length();i++){JSONObject o=a.optJSONObject(i);if(o==null)continue;String id=o.optString("alertId","");if(id.isEmpty())continue;ContentValues cv=new ContentValues();cv.put("alert_id",id);cv.put("created_at",o.optString("createdAt",""));cv.put("alert_type",o.optString("type",null));cv.put("state",o.optString("state",null));cv.put("calculation_id",o.optString("calculationId",null));cv.put("payload_json",o.toString());db.insertWithOnConflict("alert_event",null,cv,SQLiteDatabase.CONFLICT_REPLACE);} db.execSQL("DELETE FROM alert_event WHERE alert_id NOT IN (SELECT alert_id FROM alert_event ORDER BY created_at DESC LIMIT 500)"); db.setTransactionSuccessful(); } finally { db.endTransaction(); }
    }

    public synchronized String loadAlertEvents(int limit) {
        int n=Math.max(1,Math.min(500,limit)); JSONArray out=new JSONArray(); SQLiteDatabase db=getReadableDatabase();
        try(Cursor c=db.rawQuery("SELECT payload_json FROM alert_event ORDER BY created_at DESC LIMIT "+n,null)){while(c.moveToNext())try{out.put(new JSONObject(c.getString(0)));}catch(Exception ignored){}} return out.toString();
    }

    private void putIndicator(SQLiteDatabase db, String market, String indicator, String ts,
                              double value, String status, String source, String confidence) {
        ContentValues cv = new ContentValues();
        cv.put("market", market);
        cv.put("indicator", indicator);
        cv.put("timestamp", ts);
        if (!Double.isNaN(value) && !Double.isInfinite(value)) cv.put("value", value); else cv.putNull("value");
        cv.put("status", status);
        cv.put("source", source);
        cv.put("confidence", confidence);
        db.insertWithOnConflict("indicator_snapshot", null, cv, SQLiteDatabase.CONFLICT_REPLACE);
    }
}
