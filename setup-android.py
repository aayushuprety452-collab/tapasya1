import os, wave, struct, math

raw_dir = "android/app/src/main/res/raw"
os.makedirs(raw_dir, exist_ok=True)
SR = 22050
MELODIES = {
    "morning_glory": [(523.25,0.22),(659.25,0.22),(783.99,0.22),(1046.5,0.38),(880.0,0.22),(1046.5,0.22),(783.99,0.45)],
    "morning_flower": [(659.25,0.20),(739.99,0.20),(830.61,0.20),(987.77,0.36),(830.61,0.20),(739.99,0.20),(659.25,0.42)],
    "homecoming": [(440.0,0.26),(554.37,0.26),(659.25,0.26),(880.0,0.44),(739.99,0.26),(659.25,0.26),(554.37,0.46)],
    "fireflies": [(523.25,0.18),(659.25,0.18),(783.99,0.18),(1046.5,0.32),(987.77,0.18),(783.99,0.18),(659.25,0.36)],
    "horizon": [(392.0,0.25),(440.0,0.25),(493.88,0.25),(587.33,0.35),(783.99,0.45),(659.25,0.45)],
    "betteroff": [(493.88,0.16),(493.88,0.16),(415.3,0.16),(493.88,0.22),(554.37,0.22),(493.88,0.18),(415.3,0.22),(369.99,0.32)],
    "insomnia": [(329.63,0.15),(329.63,0.15),(493.88,0.22),(493.88,0.15),(523.25,0.22),(493.88,0.18),(440.0,0.18),(392.0,0.28)]
}

for name, seq in MELODIES.items():
    with wave.open(os.path.join(raw_dir, f"{name}.wav"), "w") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(SR)
        for freq, dur in seq:
            n = int(SR * dur)
            for i in range(n):
                env = min(1.0, i / 400.0) * min(1.0, (n - i) / 600.0)
                val = int(28000 * env * math.sin(2 * math.pi * freq * i / SR))
                wf.writeframes(struct.pack("<h", val))
        for _ in range(int(SR * 0.45)):
            wf.writeframes(struct.pack("<h", 0))

pkg_dir = "android/app/src/main/java/com/tapasya/workspace"
os.makedirs(pkg_dir, exist_ok=True)

alarm_activity = """package com.tapasya.workspace;
import android.app.*;
import android.content.*;
import android.graphics.*;
import android.graphics.drawable.GradientDrawable;
import android.media.*;
import android.net.Uri;
import android.os.*;
import android.view.*;
import android.widget.*;
import java.io.File;
import java.text.SimpleDateFormat;
import java.util.*;

public class AlarmActivity extends Activity {
  private MediaPlayer mp;
  private Vibrator vib;
  private String title = "Work", tone = "morning_glory";
  private boolean doVib = true;

  @Override
  protected void onCreate(Bundle b) {
    super.onCreate(b);
    if (Build.VERSION.SDK_INT >= 27) {
      setShowWhenLocked(true);
      setTurnScreenOn(true);
      KeyguardManager km = (KeyguardManager) getSystemService(KEYGUARD_SERVICE);
      if (km != null) km.requestDismissKeyguard(this, null);
    }
    getWindow().addFlags(
      WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON |
      WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD |
      WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
      WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
    );

    Intent i = getIntent();
    if (i != null) {
      if (i.getStringExtra("title") != null) title = i.getStringExtra("title");
      if (i.getStringExtra("tone") != null) tone = i.getStringExtra("tone");
      doVib = i.getBooleanExtra("vibrate", true);
    }

    LinearLayout root = new LinearLayout(this);
    root.setOrientation(LinearLayout.VERTICAL);
    root.setBackgroundColor(Color.BLACK);
    root.setGravity(Gravity.CENTER_HORIZONTAL);
    root.setPadding(48, 120, 48, 110);

    TextView clk = new TextView(this);
    clk.setText(new SimpleDateFormat("HH:mm", Locale.getDefault()).format(new Date()));
    clk.setTextColor(Color.parseColor("#D1D1D6"));
    clk.setTextSize(76);
    clk.setTypeface(Typeface.create("sans-serif-light", Typeface.NORMAL));
    clk.setGravity(Gravity.CENTER);
    root.addView(clk);

    View sp1 = new View(this);
    sp1.setLayoutParams(new LinearLayout.LayoutParams(1, 0, 1f));
    root.addView(sp1);

    TextView tv = new TextView(this);
    tv.setText(title);
    tv.setTextColor(Color.WHITE);
    tv.setTextSize(30);
    tv.setTypeface(Typeface.DEFAULT_BOLD);
    tv.setGravity(Gravity.CENTER);
    LinearLayout.LayoutParams tlp = new LinearLayout.LayoutParams(-2, -2);
    tlp.bottomMargin = 54;
    root.addView(tv, tlp);

    Button snz = new Button(this);
    snz.setText("Snooze");
    snz.setAllCaps(false);
    snz.setTextColor(Color.WHITE);
    snz.setTextSize(19);
    snz.setTypeface(Typeface.DEFAULT_BOLD);
    GradientDrawable sb = new GradientDrawable();
    sb.setColor(Color.parseColor("#FFB340"));
    sb.setCornerRadius(999f);
    snz.setBackground(sb);
    root.addView(snz, new LinearLayout.LayoutParams(540, 148));

    View sp2 = new View(this);
    sp2.setLayoutParams(new LinearLayout.LayoutParams(1, 0, 1.2f));
    root.addView(sp2);

    Button stp = new Button(this);
    stp.setText("Stop");
    stp.setAllCaps(false);
    stp.setTextColor(Color.WHITE);
    stp.setTextSize(16);
    stp.setTypeface(Typeface.DEFAULT_BOLD);
    GradientDrawable stb = new GradientDrawable();
    stb.setColor(Color.parseColor("#2C2C2E"));
    stb.setCornerRadius(999f);
    stp.setBackground(stb);
    root.addView(stp, new LinearLayout.LayoutParams(320, 122));

    snz.setOnClickListener(v -> { stopAll(); snooze(); finish(); });
    stp.setOnClickListener(v -> { stopAll(); finish(); });
    setContentView(root);
    startAlarm();
  }

  private void startAlarm() {
    try {
      mp = new MediaPlayer();
      mp.setAudioAttributes(new AudioAttributes.Builder()
        .setUsage(AudioAttributes.USAGE_ALARM)
        .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
        .build());
      File cf = new File(getFilesDir(), "tapasya_custom_alarm.audio");
      if ("custom".equals(tone) && cf.exists()) {
        mp.setDataSource(cf.getAbsolutePath());
      } else {
        int res = getResources().getIdentifier(tone, "raw", getPackageName());
        if (res == 0) res = getResources().getIdentifier("morning_glory", "raw", getPackageName());
        if (res != 0) mp.setDataSource(this, Uri.parse("android.resource://" + getPackageName() + "/" + res));
        else mp.setDataSource(this, RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM));
      }
      mp.setLooping(true);
      mp.prepare();
      mp.start();
    } catch (Exception ignored) {}

    if (doVib) {
      vib = (Vibrator) getSystemService(VIBRATOR_SERVICE);
      if (vib != null) {
        long[] p = new long[]{0, 800, 400, 800, 600};
        if (Build.VERSION.SDK_INT >= 26) vib.vibrate(VibrationEffect.createWaveform(p, 0));
        else vib.vibrate(p, 0);
      }
    }
  }

  private void snooze() {
    try {
      AlarmManager am = (AlarmManager) getSystemService(ALARM_SERVICE);
      Intent i = new Intent(this, AlarmReceiver.class);
      i.putExtra("title", title);
      i.putExtra("tone", tone);
      i.putExtra("vibrate", doVib);
      PendingIntent pi = PendingIntent.getBroadcast(this, 99991, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
      if (am != null) am.setAlarmClock(new AlarmManager.AlarmClockInfo(System.currentTimeMillis() + 300000L, pi), pi);
    } catch (Exception ignored) {}
  }

  private void stopAll() {
    if (mp != null) { try { mp.stop(); mp.release(); } catch (Exception ignored) {} mp = null; }
    if (vib != null) { try { vib.cancel(); } catch (Exception ignored) {} }
  }

  @Override
  protected void onDestroy() { stopAll(); super.onDestroy(); }
}
"""

alarm_receiver = """package com.tapasya.workspace;
import android.app.*;
import android.content.*;
import android.os.Build;
import androidx.core.app.NotificationCompat;

public class AlarmReceiver extends BroadcastReceiver {
  @Override
  public void onReceive(Context ctx, Intent intent) {
    String title = intent.getStringExtra("title") != null ? intent.getStringExtra("title") : "Work";
    String tone = intent.getStringExtra("tone") != null ? intent.getStringExtra("tone") : "morning_glory";
    boolean vib = intent.getBooleanExtra("vibrate", true);

    Intent fsi = new Intent(ctx, AlarmActivity.class);
    fsi.putExtra("title", title);
    fsi.putExtra("tone", tone);
    fsi.putExtra("vibrate", vib);
    fsi.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
    PendingIntent fspi = PendingIntent.getActivity(ctx, (int) System.currentTimeMillis(), fsi, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

    String chId = "tapasya_fullscreen_alarms";
    NotificationManager nm = (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
    if (nm != null && Build.VERSION.SDK_INT >= 26) {
      NotificationChannel ch = new NotificationChannel(chId, "TAPASYA Lock-Screen Alarms", NotificationManager.IMPORTANCE_HIGH);
      ch.setLockscreenVisibility(NotificationCompat.VISIBILITY_PUBLIC);
      ch.setBypassDnd(true);
      nm.createNotificationChannel(ch);
    }
    NotificationCompat.Builder nb = new NotificationCompat.Builder(ctx, chId)
      .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
      .setContentTitle("TAPASYA Alarm")
      .setContentText(title)
      .setPriority(NotificationCompat.PRIORITY_MAX)
      .setCategory(NotificationCompat.CATEGORY_ALARM)
      .setAutoCancel(true)
      .setFullScreenIntent(fspi, true);
    if (nm != null) nm.notify((int) (System.currentTimeMillis() % 100000), nb.build());
    try { ctx.startActivity(fsi); } catch (Exception ignored) {}
  }
}
"""

plugin_java = """package com.tapasya.workspace;
import android.app.*;
import android.content.*;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import com.getcapacitor.*;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "TapasyaAlarm")
public class TapasyaAlarmPlugin extends Plugin {
  @PluginMethod
  public void scheduleAlarm(PluginCall call) {
    int id = call.getInt("id", 1001);
    String title = call.getString("title", "Work");
    long at = call.getLong("triggerAtMillis", System.currentTimeMillis() + 60000L);
    String tone = call.getString("tone", "morning_glory");
    boolean vib = call.getBoolean("vibrate", true);

    Context ctx = getContext();
AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
Intent i = new Intent(ctx, AlarmReceiver.class);
i.putExtra("title", title);
i.putExtra("tone", tone);
i.putExtra("vibrate", vib);
PendingIntent pi = PendingIntent.getBroadcast(ctx, id, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
if (am != null) am.setAlarmClock(new AlarmManager.AlarmClockInfo(at, pi), pi);
call.resolve();
}
@PluginMethod
public void testNow(PluginCall call) {
Intent i = new Intent(getContext(), AlarmActivity.class);
i.putExtra("title", call.getString("title", "Work"));
i.putExtra("tone", call.getString("tone", "morning_glory"));
i.putExtra("vibrate", call.getBoolean("vibrate", true));
i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
getContext().startActivity(i);
call.resolve();
}
@PluginMethod
public void openAlarmSettings(PluginCall call) {
Context ctx = getContext();
try {
Intent i = new Intent(Build.VERSION.SDK_INT >= 31 ? Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM : Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
i.setData(Uri.parse("package:" + ctx.getPackageName()));
i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
ctx.startActivity(i);
} catch (Exception e) {
Intent i = new Intent(Settings.ACTION_SETTINGS);
i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
ctx.startActivity(i);
}
call.resolve();
}
}
"""
main_activity = """package com.tapasya.workspace;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
public class MainActivity extends BridgeActivity {
@Override
public void onCreate(Bundle savedInstanceState) {
registerPlugin(TapasyaAlarmPlugin.class);
super.onCreate(savedInstanceState);
}
}
"""
for fname, content in [
("AlarmActivity.java", alarm_activity),
("AlarmReceiver.java", alarm_receiver),
("TapasyaAlarmPlugin.java", plugin_java),
("MainActivity.java", main_activity),
]:
with open(os.path.join(pkg_dir, fname), "w") as f:
f.write(content)
manifest_path = "android/app/src/main/AndroidManifest.xml"
with open(manifest_path, "r") as f:
xml = f.read()
perms = """








"""
components = """    

"""
xml = xml.replace('', perms)
xml = xml.replace('', components)
with open(manifest_path, "w") as f:
f.write(xml)
