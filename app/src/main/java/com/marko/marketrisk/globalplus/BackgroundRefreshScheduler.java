package com.marko.marketrisk.globalplus;

import android.content.Context;

import androidx.work.Constraints;
import androidx.work.ExistingPeriodicWorkPolicy;
import androidx.work.NetworkType;
import androidx.work.PeriodicWorkRequest;
import androidx.work.WorkManager;

import java.util.concurrent.TimeUnit;

/** Battery-aware, unique periodic background refresh scheduling. */
public final class BackgroundRefreshScheduler {
    public static final String UNIQUE_WORK = "market-risk-background-refresh";
    private BackgroundRefreshScheduler() {}

    public static void configure(Context context, int requestedMinutes, boolean enabled) {
        WorkManager wm = WorkManager.getInstance(context.getApplicationContext());
        if (!enabled || requestedMinutes <= 0) {
            wm.cancelUniqueWork(UNIQUE_WORK);
            return;
        }
        long minutes = Math.max(15L, requestedMinutes);
        Constraints constraints = new Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .build();
        PeriodicWorkRequest request = new PeriodicWorkRequest.Builder(
                BackgroundRefreshWorker.class, minutes, TimeUnit.MINUTES)
                .setConstraints(constraints)
                .build();
        wm.enqueueUniquePeriodicWork(UNIQUE_WORK, ExistingPeriodicWorkPolicy.UPDATE, request);
    }
}
