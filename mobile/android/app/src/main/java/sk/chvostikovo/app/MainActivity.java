package sk.chvostikovo.app;

import com.getcapacitor.BridgeActivity;
import android.os.Bundle;
import android.os.Build;
import android.graphics.Color;
import android.view.View;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(ChvoUpdatesPlugin.class);
        super.onCreate(savedInstanceState);
        // Keep native insets (including IME) owned by Capacitor SystemBars.
        // Android WebView stretch is separate from CSS scroll chaining.
        getBridge().getWebView().setOverScrollMode(View.OVER_SCROLL_NEVER);
        getBridge().getWebView().setBackgroundColor(Color.WHITE);
        getWindow().getDecorView().setBackgroundColor(Color.WHITE);
        // Android 7 has no dark navigation icons; keep its three-button controls legible.
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            getWindow().setNavigationBarColor(Color.rgb(47, 35, 40));
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            getWindow().setStatusBarContrastEnforced(false);
            getWindow().setNavigationBarContrastEnforced(false);
        }
    }
}
