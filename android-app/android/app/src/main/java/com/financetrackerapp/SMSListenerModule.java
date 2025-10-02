package com.financetrackerapp;

import android.content.ContentResolver;
import android.content.Context;
import android.database.ContentObserver;
import android.database.Cursor;
import android.net.Uri;
import android.os.Handler;
import android.os.Looper;
import android.provider.Telephony;
import android.util.Log;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

public class SMSListenerModule extends ReactContextBaseJavaModule {
    private static final String TAG = "SMSListener";
    private static ReactApplicationContext reactContext;
    private static SMSContentObserver smsObserver;
    private static boolean isListening = false;

    public SMSListenerModule(ReactApplicationContext context) {
        super(context);
        reactContext = context;
    }

    @Override
    public String getName() {
        return "SMSListener";
    }

    @ReactMethod
    public void startListening() {
        if (isListening) {
            Log.d(TAG, "SMS listener already started");
            return;
        }

        try {
            Context context = getReactApplicationContext();
            ContentResolver contentResolver = context.getContentResolver();
            
            smsObserver = new SMSContentObserver(new Handler(Looper.getMainLooper()));
            contentResolver.registerContentObserver(
                Telephony.Sms.CONTENT_URI,
                true,
                smsObserver
            );
            
            isListening = true;
            Log.d(TAG, "SMS listener started");
        } catch (Exception e) {
            Log.e(TAG, "Error starting SMS listener", e);
        }
    }

    @ReactMethod
    public void stopListening() {
        if (!isListening) {
            Log.d(TAG, "SMS listener not started");
            return;
        }

        try {
            Context context = getReactApplicationContext();
            ContentResolver contentResolver = context.getContentResolver();
            
            if (smsObserver != null) {
                contentResolver.unregisterContentObserver(smsObserver);
                smsObserver = null;
            }
            
            isListening = false;
            Log.d(TAG, "SMS listener stopped");
        } catch (Exception e) {
            Log.e(TAG, "Error stopping SMS listener", e);
        }
    }

    private static class SMSContentObserver extends ContentObserver {
        public SMSContentObserver(Handler handler) {
            super(handler);
        }

        @Override
        public void onChange(boolean selfChange, Uri uri) {
            super.onChange(selfChange, uri);
            checkForNewSMS();
        }

        private void checkForNewSMS() {
            if (reactContext == null) return;

            try {
                Context context = reactContext.getCurrentActivity();
                if (context == null) return;

                ContentResolver contentResolver = context.getContentResolver();
                Cursor cursor = contentResolver.query(
                    Telephony.Sms.CONTENT_URI,
                    new String[]{
                        Telephony.Sms._ID,
                        Telephony.Sms.ADDRESS,
                        Telephony.Sms.BODY,
                        Telephony.Sms.DATE
                    },
                    Telephony.Sms.READ + " = ?",
                    new String[]{"0"},
                    Telephony.Sms.DATE + " DESC LIMIT 1"
                );

                if (cursor != null && cursor.moveToFirst()) {
                    String sender = cursor.getString(cursor.getColumnIndexOrThrow(Telephony.Sms.ADDRESS));
                    String body = cursor.getString(cursor.getColumnIndexOrThrow(Telephony.Sms.BODY));
                    long date = cursor.getLong(cursor.getColumnIndexOrThrow(Telephony.Sms.DATE));

                    // Filter for banking/finance SMS
                    if (isBankingSender(sender) || containsExpenseKeywords(body)) {
                        WritableMap params = Arguments.createMap();
                        params.putString("sender", sender);
                        params.putString("body", body);
                        params.putDouble("timestamp", date);

                        reactContext
                            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                            .emit("SMSReceived", params);
                        
                        Log.d(TAG, "Expense SMS detected from " + sender + ": " + body);
                    }
                }

                if (cursor != null) {
                    cursor.close();
                }
            } catch (Exception e) {
                Log.e(TAG, "Error checking for new SMS", e);
            }
        }

        private boolean isBankingSender(String sender) {
            // Common South African banking SMS senders
            String[] bankingSenders = {
                "ABSA", "FNB", "Standard Bank", "Nedbank", "Capitec",
                "Bidvest Bank", "Investec", "African Bank", "Tyme",
                "Discovery Bank", "Bank", "Banking"
            };

            String upperSender = sender.toUpperCase();
            for (String bank : bankingSenders) {
                if (upperSender.contains(bank.toUpperCase())) {
                    return true;
                }
            }
            return false;
        }

        private boolean containsExpenseKeywords(String text) {
            String lowerText = text.toLowerCase();
            String[] keywords = {
                "debit", "credit", "payment", "purchase", "transaction",
                "spent", "charged", "withdrawal", "deposit", "balance",
                "r ", "rand", "zar", "amount", "cost", "price",
                "card", "account", "balance", "available"
            };

            for (String keyword : keywords) {
                if (lowerText.contains(keyword)) {
                    return true;
                }
            }
            return false;
        }
    }
}
