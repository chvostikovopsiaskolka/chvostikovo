package sk.chvostikovo.app;

import android.content.Intent;
import android.net.Uri;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.play.core.appupdate.AppUpdateManagerFactory;
import com.google.android.play.core.install.model.UpdateAvailability;

@CapacitorPlugin(name = "ChvoUpdates")
public class ChvoUpdatesPlugin extends Plugin {
    @PluginMethod
    public void check(PluginCall call) {
        AppUpdateManagerFactory.create(getContext()).getAppUpdateInfo()
            .addOnSuccessListener(info -> {
                JSObject result = new JSObject();
                result.put("available", info.updateAvailability() == UpdateAvailability.UPDATE_AVAILABLE);
                result.put("versionCode", info.availableVersionCode());
                call.resolve(result);
            })
            .addOnFailureListener(error -> call.reject("Update status unavailable"));
    }

    @PluginMethod
    public void start(PluginCall call) {
        String appId = getContext().getPackageName();
        try {
            Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse("market://details?id=" + appId));
            intent.setPackage("com.android.vending");
            getActivity().startActivity(intent);
            call.resolve();
        } catch (Exception error) {
            try {
                getActivity().startActivity(new Intent(Intent.ACTION_VIEW,
                    Uri.parse("https://play.google.com/store/apps/details?id=" + appId)));
                call.resolve();
            } catch (Exception unavailable) { call.reject("Google Play unavailable"); }
        }
    }
}
