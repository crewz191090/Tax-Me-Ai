package com.taxmeai.app;

import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.provider.Settings;

import androidx.core.app.NotificationManagerCompat;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONArray;
import org.json.JSONObject;

import java.lang.ref.WeakReference;
import java.util.ArrayList;
import java.util.List;

/**
 * Web-facing bridge for {@link BankNotificationListenerService}: lets the JS
 * app check/request the notification-access permission, and drain the queue
 * of bank transactions the service has parsed while the app wasn't looking.
 */
@CapacitorPlugin(name = "BankNotificationCapture")
public class BankNotificationCapturePlugin extends Plugin {

    // Lets the (possibly short-lived) listener service push a transaction to
    // the JS layer immediately when the app is open, instead of the user
    // having to wait for the next poll. Weak so it never keeps the plugin —
    // and the Activity it holds — alive after the app is closed.
    private static WeakReference<BankNotificationCapturePlugin> activeInstance;

    @Override
    public void load() {
        activeInstance = new WeakReference<>(this);
    }

    static void notifyActiveListener(JSONObject transaction) {
        BankNotificationCapturePlugin instance = activeInstance == null ? null : activeInstance.get();
        if (instance == null || instance.getActivity() == null) return;
        JSObject data = toJsObject(transaction);
        instance.getActivity().runOnUiThread(() -> instance.notifyListeners("transactionDetected", data));
    }

    @PluginMethod
    public void isEnabled(PluginCall call) {
        boolean enabled = NotificationManagerCompat
            .getEnabledListenerPackages(getContext())
            .contains(getContext().getPackageName());
        JSObject result = new JSObject();
        result.put("enabled", enabled);
        call.resolve(result);
    }

    @PluginMethod
    public void openSettings(PluginCall call) {
        Context context = getContext();
        boolean opened = false;

        // Android 11+ can deep-link straight to this app's toggle instead of
        // the full list of every app with notification access.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            try {
                ComponentName componentName = new ComponentName(context, BankNotificationListenerService.class);
                Intent intent = new Intent(Settings.ACTION_NOTIFICATION_LISTENER_DETAIL_SETTINGS);
                intent.putExtra(Settings.EXTRA_NOTIFICATION_LISTENER_COMPONENT_NAME, componentName.flattenToString());
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(intent);
                opened = true;
            } catch (Exception ignored) {
                // Fall through to the generic settings list below.
            }
        }

        if (!opened) {
            Intent intent = new Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(intent);
        }
        call.resolve();
    }

    @PluginMethod
    public void getPending(PluginCall call) {
        JSONArray queue = TransactionNotificationStore.getAll(getContext());
        JSArray result = new JSArray();
        for (int i = 0; i < queue.length(); i++) {
            try {
                result.put(toJsObject(queue.getJSONObject(i)));
            } catch (Exception ignored) {
            }
        }
        JSObject response = new JSObject();
        response.put("transactions", result);
        call.resolve(response);
    }

    @PluginMethod
    public void clearPending(PluginCall call) {
        JSArray idsArray = call.getArray("ids");
        List<String> ids = new ArrayList<>();
        if (idsArray != null) {
            try {
                for (int i = 0; i < idsArray.length(); i++) {
                    ids.add(idsArray.getString(i));
                }
            } catch (Exception ignored) {
            }
        }
        TransactionNotificationStore.remove(getContext(), ids);
        call.resolve();
    }

    private static JSObject toJsObject(JSONObject json) {
        JSObject obj = new JSObject();
        obj.put("id", json.optString("id"));
        obj.put("bank", json.optString("bank"));
        obj.put("amount", json.optDouble("amount", 0));
        obj.put("merchant", json.optString("merchant"));
        obj.put("rawText", json.optString("rawText"));
        obj.put("postedAt", json.optLong("postedAt"));
        return obj;
    }
}
