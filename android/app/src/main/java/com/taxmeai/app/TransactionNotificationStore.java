package com.taxmeai.app;

import android.content.Context;
import android.content.SharedPreferences;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.List;

/**
 * Persists bank transactions parsed from notifications until the JS layer
 * drains them. Backed by SharedPreferences (not a DB) since the queue is
 * small and short-lived — items are removed as soon as the user reviews
 * them in the app.
 */
final class TransactionNotificationStore {
    private static final String PREFS_NAME = "bank_notification_queue";
    private static final String KEY_QUEUE = "queue";
    // Caps the queue so a long stretch without opening the app can't grow
    // this unbounded — oldest entries are dropped first.
    private static final int MAX_QUEUE_SIZE = 200;

    private TransactionNotificationStore() {}

    static synchronized void add(Context context, JSONObject transaction) {
        SharedPreferences prefs = prefs(context);
        try {
            JSONArray queue = new JSONArray(prefs.getString(KEY_QUEUE, "[]"));
            queue.put(transaction);
            if (queue.length() > MAX_QUEUE_SIZE) {
                JSONArray trimmed = new JSONArray();
                int dropCount = queue.length() - MAX_QUEUE_SIZE;
                for (int i = dropCount; i < queue.length(); i++) {
                    trimmed.put(queue.get(i));
                }
                queue = trimmed;
            }
            prefs.edit().putString(KEY_QUEUE, queue.toString()).apply();
        } catch (JSONException ignored) {
        }
    }

    static synchronized JSONArray getAll(Context context) {
        try {
            return new JSONArray(prefs(context).getString(KEY_QUEUE, "[]"));
        } catch (JSONException e) {
            return new JSONArray();
        }
    }

    static synchronized void remove(Context context, List<String> ids) {
        if (ids.isEmpty()) return;
        SharedPreferences prefs = prefs(context);
        try {
            JSONArray queue = new JSONArray(prefs.getString(KEY_QUEUE, "[]"));
            JSONArray kept = new JSONArray();
            for (int i = 0; i < queue.length(); i++) {
                JSONObject item = queue.getJSONObject(i);
                if (!ids.contains(item.optString("id"))) {
                    kept.put(item);
                }
            }
            prefs.edit().putString(KEY_QUEUE, kept.toString()).apply();
        } catch (JSONException ignored) {
        }
    }

    private static SharedPreferences prefs(Context context) {
        return context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
    }
}
