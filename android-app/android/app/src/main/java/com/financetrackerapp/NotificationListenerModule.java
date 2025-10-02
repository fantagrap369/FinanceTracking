package com.financetrackerapp;

import android.app.Notification;
import android.content.Context;
import android.os.Bundle;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;
import android.util.Log;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

public class NotificationListenerModule extends ReactContextBaseJavaModule {
    private static final String TAG = "NotificationListener";
    private static ReactApplicationContext reactContext;
    private static NotificationListenerService notificationService;

    public NotificationListenerModule(ReactApplicationContext context) {
        super(context);
        reactContext = context;
    }

    @Override
    public String getName() {
        return "NotificationListener";
    }

    @ReactMethod
    public void startListening() {
        Log.d(TAG, "Starting notification listener");
        // The actual listening is handled by NotificationListenerService
        // This method just confirms the module is ready
    }

    @ReactMethod
    public void stopListening() {
        Log.d(TAG, "Stopping notification listener");
        // The actual stopping is handled by NotificationListenerService
    }

    // This method is called by NotificationListenerService when a notification is received
    public static void onNotificationPosted(StatusBarNotification sbn) {
        if (reactContext == null) return;

        try {
            Notification notification = sbn.getNotification();
            Bundle extras = notification.extras;
            
            String title = extras.getString(Notification.EXTRA_TITLE, "");
            String text = extras.getString(Notification.EXTRA_TEXT, "");
            String packageName = sbn.getPackageName();

            // Filter for banking/finance apps
            if (isBankingApp(packageName) || containsExpenseKeywords(title + " " + text)) {
                WritableMap params = Arguments.createMap();
                params.putString("title", title);
                params.putString("text", text);
                params.putString("packageName", packageName);
                params.putDouble("timestamp", System.currentTimeMillis());

                reactContext
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                    .emit("NotificationReceived", params);
                
                Log.d(TAG, "Expense notification detected: " + title + " - " + text);
            }
        } catch (Exception e) {
            Log.e(TAG, "Error processing notification", e);
        }
    }

    private static boolean isBankingApp(String packageName) {
        // Common South African banking apps
        String[] bankingApps = {
            "com.absa.mobile",
            "com.fnb.android",
            "com.standardbank.mobile",
            "com.nedbank.mobile",
            "com.capitec.mobile",
            "com.bidvestbank.mobile",
            "com.investec.mobile",
            "com.africanbank.mobile",
            "com.tyme.mobile",
            "com.discovery.mobile"
        };

        for (String app : bankingApps) {
            if (packageName.contains(app)) {
                return true;
            }
        }
        return false;
    }

    private static boolean containsExpenseKeywords(String text) {
        String lowerText = text.toLowerCase();
        String[] keywords = {
            "debit", "credit", "payment", "purchase", "transaction",
            "spent", "charged", "withdrawal", "deposit", "balance",
            "r ", "rand", "zar", "amount", "cost", "price"
        };

        for (String keyword : keywords) {
            if (lowerText.contains(keyword)) {
                return true;
            }
        }
        return false;
    }
}
