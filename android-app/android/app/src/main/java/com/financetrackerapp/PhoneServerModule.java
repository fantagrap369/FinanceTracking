package com.financetrackerapp;

import android.content.Context;
import android.util.Log;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.WritableMap;

import java.io.IOException;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.util.Collections;
import java.util.List;

import fi.iki.elonen.NanoHTTPD;

public class PhoneServerModule extends ReactContextBaseJavaModule {
    private static final String TAG = "PhoneServer";
    private static PhoneServer server;
    private static ReactApplicationContext reactContext;

    public PhoneServerModule(ReactApplicationContext context) {
        super(context);
        reactContext = context;
    }

    @Override
    public String getName() {
        return "PhoneServer";
    }

    @ReactMethod
    public void startServer(int port, Promise promise) {
        try {
            if (server != null && server.isAlive()) {
                promise.resolve("Server already running");
                return;
            }

            server = new PhoneServer(port);
            server.start();
            
            String ipAddress = getLocalIpAddress();
            WritableMap result = Arguments.createMap();
            result.putString("status", "started");
            result.putString("ipAddress", ipAddress);
            result.putInt("port", port);
            result.putString("url", "http://" + ipAddress + ":" + port);
            
            promise.resolve(result);
            Log.d(TAG, "Phone server started on " + ipAddress + ":" + port);
        } catch (Exception e) {
            Log.e(TAG, "Error starting phone server", e);
            promise.reject("SERVER_ERROR", "Failed to start server: " + e.getMessage());
        }
    }

    @ReactMethod
    public void stopServer(Promise promise) {
        try {
            if (server != null && server.isAlive()) {
                server.stop();
                server = null;
                promise.resolve("Server stopped");
                Log.d(TAG, "Phone server stopped");
            } else {
                promise.resolve("Server not running");
            }
        } catch (Exception e) {
            Log.e(TAG, "Error stopping phone server", e);
            promise.reject("SERVER_ERROR", "Failed to stop server: " + e.getMessage());
        }
    }

    @ReactMethod
    public void getServerStatus(Promise promise) {
        try {
            WritableMap result = Arguments.createMap();
            boolean isRunning = server != null && server.isAlive();
            result.putBoolean("isRunning", isRunning);
            
            if (isRunning) {
                result.putString("ipAddress", getLocalIpAddress());
                result.putInt("port", server.getListeningPort());
            }
            
            promise.resolve(result);
        } catch (Exception e) {
            Log.e(TAG, "Error getting server status", e);
            promise.reject("SERVER_ERROR", "Failed to get server status: " + e.getMessage());
        }
    }

    private String getLocalIpAddress() {
        try {
            List<NetworkInterface> interfaces = Collections.list(NetworkInterface.getNetworkInterfaces());
            for (NetworkInterface intf : interfaces) {
                List<InetAddress> addrs = Collections.list(intf.getInetAddresses());
                for (InetAddress addr : addrs) {
                    if (!addr.isLoopbackAddress() && addr.getHostAddress().indexOf(':') < 0) {
                        return addr.getHostAddress();
                    }
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Error getting IP address", e);
        }
        return "127.0.0.1";
    }

    private static class PhoneServer extends NanoHTTPD {
        public PhoneServer(int port) {
            super(port);
        }

        @Override
        public Response serve(IHTTPSession session) {
            String uri = session.getUri();
            String method = session.getMethod().name();

            // Enable CORS
            Response response = newFixedLengthResponse(Response.Status.OK, "application/json", "{}");
            response.addHeader("Access-Control-Allow-Origin", "*");
            response.addHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
            response.addHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

            if (method.equals("OPTIONS")) {
                return response;
            }

            try {
                switch (uri) {
                    case "/api/health":
                        return handleHealthCheck();
                    case "/api/expenses":
                        if (method.equals("GET")) {
                            return handleGetExpenses();
                        } else if (method.equals("POST")) {
                            return handleAddExpense(session);
                        }
                        break;
                    case "/api/expenses/":
                        if (method.equals("PUT")) {
                            return handleUpdateExpense(session);
                        } else if (method.equals("DELETE")) {
                            return handleDeleteExpense(session);
                        }
                        break;
                    default:
                        return newFixedLengthResponse(Response.Status.NOT_FOUND, "application/json", 
                            "{\"error\": \"Not found\"}");
                }
            } catch (Exception e) {
                Log.e(TAG, "Error handling request", e);
                return newFixedLengthResponse(Response.Status.INTERNAL_ERROR, "application/json", 
                    "{\"error\": \"Internal server error\"}");
            }

            return newFixedLengthResponse(Response.Status.METHOD_NOT_ALLOWED, "application/json", 
                "{\"error\": \"Method not allowed\"}");
        }

        private Response handleHealthCheck() {
            String response = "{\"status\": \"ok\", \"timestamp\": \"" + 
                System.currentTimeMillis() + "\"}";
            return newFixedLengthResponse(Response.Status.OK, "application/json", response);
        }

        private Response handleGetExpenses() {
            // This would read from local storage or database
            // For now, return empty array
            String response = "[]";
            return newFixedLengthResponse(Response.Status.OK, "application/json", response);
        }

        private Response handleAddExpense(IHTTPSession session) {
            // This would parse the request body and save to local storage
            // For now, return success
            String response = "{\"id\": \"" + System.currentTimeMillis() + "\", \"status\": \"created\"}";
            return newFixedLengthResponse(Response.Status.CREATED, "application/json", response);
        }

        private Response handleUpdateExpense(IHTTPSession session) {
            // This would update the expense in local storage
            String response = "{\"status\": \"updated\"}";
            return newFixedLengthResponse(Response.Status.OK, "application/json", response);
        }

        private Response handleDeleteExpense(IHTTPSession session) {
            // This would delete the expense from local storage
            String response = "{\"status\": \"deleted\"}";
            return newFixedLengthResponse(Response.Status.OK, "application/json", response);
        }
    }
}
