#!/usr/bin/env bash
set -euo pipefail
OUT="${1:-lumi-v10-src}"
mkdir -p "$OUT"
cat > "$OUT/README.md" <<'__LUMI_EOF__'
# Lumi Voice Bridge v1.0

Stable Android bridge for Hermes Agent.

Features:
- Arabic push-to-talk speech recognition with longer silence tolerance.
- Editable message before sending.
- Send button to Hermes `/v1/chat/completions` with `stream=false`.
- Displays only the final assistant content from `choices[0].message.content`.
- API key protected with Android Keystore AES/GCM.
- User-enabled foreground background mode with persistent notification.
- Custom launcher icon from the user-provided Lumi artwork.

Background mode keeps the bridge process active, but microphone capture is still started manually from the app in this release.
__LUMI_EOF__
mkdir -p "$OUT/app"
cat > "$OUT/app/build.gradle.kts" <<'__LUMI_EOF__'
plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.az.lumivoice"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.az.lumivoice"
        minSdk = 26
        targetSdk = 35
        versionCode = 10
        versionName = "1.0.0"
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions { jvmTarget = "17" }
}

dependencies {
}
__LUMI_EOF__
mkdir -p "$OUT/app/src/main"
cat > "$OUT/app/src/main/AndroidManifest.xml" <<'__LUMI_EOF__'
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_SPECIAL_USE" />

    <application
        android:allowBackup="false"
        android:icon="@drawable/ic_launcher"
        android:roundIcon="@drawable/ic_launcher"
        android:label="لومي"
        android:supportsRtl="true"
        android:usesCleartextTraffic="false"
        android:theme="@style/Theme.LumiSafe">

        <activity
            android:name=".MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <service
            android:name=".LumiBackgroundService"
            android:exported="false"
            android:foregroundServiceType="specialUse">
            <property
                android:name="android.app.PROPERTY_SPECIAL_USE_FGS_SUBTYPE"
                android:value="Keeps the user-enabled Lumi voice bridge session active while the app is in the background." />
        </service>
    </application>
</manifest>
__LUMI_EOF__
mkdir -p "$OUT/app/src/main/java/com/az/lumivoice"
cat > "$OUT/app/src/main/java/com/az/lumivoice/HermesClient.kt" <<'__LUMI_EOF__'
package com.az.lumivoice

import org.json.JSONArray
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

object HermesClient {
    const val BASE_URL = "https://hermes-agent-xqfd.srv1974597.hstgr.cloud/lumi-api"

    data class TestResult(val ok: Boolean, val code: Int, val message: String)
    data class ChatResult(val answer: String, val code: Int)

    fun testConnection(apiKey: String): TestResult {
        require(apiKey.isNotBlank()) { "أدخل API_SERVER_KEY" }
        val connection = (URL("$BASE_URL/v1/models").openConnection() as HttpURLConnection).apply {
            requestMethod = "GET"
            connectTimeout = 12_000
            readTimeout = 15_000
            setRequestProperty("Authorization", "Bearer ${apiKey.trim()}")
            setRequestProperty("Accept", "application/json")
        }

        return try {
            val code = connection.responseCode
            val raw = (if (code in 200..299) connection.inputStream else connection.errorStream)
                ?.bufferedReader()?.use { it.readText() }.orEmpty()

            when {
                code == 200 -> {
                    val model = runCatching {
                        val data = JSONObject(raw).optJSONArray("data")
                        data?.optJSONObject(0)?.optString("id").orEmpty()
                    }.getOrDefault("")
                    val suffix = if (model.isNotBlank()) " — النموذج: $model" else ""
                    TestResult(true, code, "تم الاتصال بـ Hermes بنجاح$suffix")
                }
                code == 401 || code == 403 -> TestResult(false, code, "المفتاح غير صحيح أو غير مصرح به")
                else -> TestResult(false, code, "رد Hermes برمز HTTP $code")
            }
        } finally {
            connection.disconnect()
        }
    }

    fun sendMessage(apiKey: String, userText: String, sessionId: String, sessionKey: String): ChatResult {
        require(apiKey.isNotBlank()) { "أدخل API_SERVER_KEY" }
        require(userText.isNotBlank()) { "اكتب أو قل رسالة أولاً" }

        val messages = JSONArray().put(
            JSONObject()
                .put("role", "user")
                .put("content", userText.trim())
        )
        val body = JSONObject()
            .put("model", "hermes-agent")
            .put("messages", messages)
            .put("stream", false)

        val connection = (URL("$BASE_URL/v1/chat/completions").openConnection() as HttpURLConnection).apply {
            requestMethod = "POST"
            connectTimeout = 15_000
            readTimeout = 180_000
            doOutput = true
            setRequestProperty("Authorization", "Bearer ${apiKey.trim()}")
            setRequestProperty("Content-Type", "application/json; charset=utf-8")
            setRequestProperty("Accept", "application/json")
            setRequestProperty("X-Hermes-Session-Id", sessionId)
            setRequestProperty("X-Hermes-Session-Key", sessionKey)
        }

        return try {
            connection.outputStream.use { out ->
                out.write(body.toString().toByteArray(Charsets.UTF_8))
            }

            val code = connection.responseCode
            val raw = (if (code in 200..299) connection.inputStream else connection.errorStream)
                ?.bufferedReader(Charsets.UTF_8)?.use { it.readText() }.orEmpty()

            if (code !in 200..299) {
                val detail = runCatching {
                    val obj = JSONObject(raw)
                    obj.optJSONObject("error")?.optString("message")
                        ?.takeIf { it.isNotBlank() }
                        ?: obj.optString("error").takeIf { it.isNotBlank() }
                        ?: raw
                }.getOrDefault(raw)
                throw IllegalStateException("Hermes HTTP $code: ${detail.take(500)}")
            }

            val answer = JSONObject(raw)
                .optJSONArray("choices")
                ?.optJSONObject(0)
                ?.optJSONObject("message")
                ?.optString("content")
                ?.trim()
                .orEmpty()

            if (answer.isBlank()) throw IllegalStateException("لم يصل رد نهائي من Hermes")
            ChatResult(answer, code)
        } finally {
            connection.disconnect()
        }
    }
}
__LUMI_EOF__
mkdir -p "$OUT/app/src/main/java/com/az/lumivoice"
cat > "$OUT/app/src/main/java/com/az/lumivoice/LumiBackgroundService.kt" <<'__LUMI_EOF__'
package com.az.lumivoice

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder

class LumiBackgroundService : Service() {
    companion object {
        const val ACTION_STOP = "com.az.lumivoice.action.STOP_BACKGROUND"
        private const val CHANNEL_ID = "lumi_background"
        private const val NOTIFICATION_ID = 1001
    }

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == ACTION_STOP) {
            getSharedPreferences("lumi_background", Context.MODE_PRIVATE)
                .edit().putBoolean("enabled", false).apply()
            stopForeground(STOP_FOREGROUND_REMOVE)
            stopSelf()
            return START_NOT_STICKY
        }

        startForeground(NOTIFICATION_ID, buildNotification())
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "لومي في الخلفية",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "يبقي Lumi Voice Bridge جاهزًا أثناء استخدام تطبيقات أخرى"
                setShowBadge(false)
            }
            getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
        }
    }

    private fun buildNotification(): Notification {
        val openIntent = Intent(this, MainActivity::class.java)
        val openPending = PendingIntent.getActivity(
            this,
            0,
            openIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val stopIntent = Intent(this, LumiBackgroundService::class.java).apply { action = ACTION_STOP }
        val stopPending = PendingIntent.getService(
            this,
            1,
            stopIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        return Notification.Builder(this, CHANNEL_ID)
            .setSmallIcon(com.az.lumivoice.R.drawable.ic_lumi_notification)
            .setContentTitle("لومي يعمل في الخلفية")
            .setContentText("Lumi Voice Bridge جاهز لاستكمال الاتصالات والطلبات")
            .setContentIntent(openPending)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setCategory(Notification.CATEGORY_SERVICE)
            .addAction(Notification.Action.Builder(null, "إيقاف", stopPending).build())
            .build()
    }
}
__LUMI_EOF__
mkdir -p "$OUT/app/src/main/java/com/az/lumivoice"
cat > "$OUT/app/src/main/java/com/az/lumivoice/SecureStore.kt" <<'__LUMI_EOF__'
package com.az.lumivoice

import android.content.Context
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.Base64
import java.security.KeyStore
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec

class SecureStore(context: Context) {
    private val prefs = context.getSharedPreferences("lumi_v05_secure", Context.MODE_PRIVATE)
    private val alias = "lumi_voice_bridge_key_v5"

    private fun getOrCreateKey(): SecretKey {
        val keyStore = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }
        (keyStore.getKey(alias, null) as? SecretKey)?.let { return it }

        val generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore")
        val spec = KeyGenParameterSpec.Builder(
            alias,
            KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT
        )
            .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
            .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
            .setKeySize(256)
            .build()
        generator.init(spec)
        return generator.generateKey()
    }

    fun saveApiKey(value: String) {
        val clean = value.trim()
        if (clean.isBlank()) {
            prefs.edit().remove("api_key").apply()
            return
        }
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        cipher.init(Cipher.ENCRYPT_MODE, getOrCreateKey())
        val encrypted = Base64.encodeToString(cipher.doFinal(clean.toByteArray(Charsets.UTF_8)), Base64.NO_WRAP)
        val iv = Base64.encodeToString(cipher.iv, Base64.NO_WRAP)
        prefs.edit().putString("api_key", "$iv:$encrypted").apply()
    }

    fun loadApiKey(): String {
        val packed = prefs.getString("api_key", null) ?: return ""
        return runCatching {
            val parts = packed.split(":", limit = 2)
            require(parts.size == 2)
            val cipher = Cipher.getInstance("AES/GCM/NoPadding")
            cipher.init(
                Cipher.DECRYPT_MODE,
                getOrCreateKey(),
                GCMParameterSpec(128, Base64.decode(parts[0], Base64.NO_WRAP))
            )
            String(cipher.doFinal(Base64.decode(parts[1], Base64.NO_WRAP)), Charsets.UTF_8)
        }.getOrElse {
            prefs.edit().remove("api_key").apply()
            ""
        }
    }

    fun clear() {
        prefs.edit().remove("api_key").apply()
    }
}
__LUMI_EOF__
mkdir -p "$OUT/app/src/main/java/com/az/lumivoice"
cat > "$OUT/app/src/main/java/com/az/lumivoice/SessionStore.kt" <<'__LUMI_EOF__'
package com.az.lumivoice

import android.content.Context
import java.util.UUID

class SessionStore(context: Context) {
    private val prefs = context.getSharedPreferences("lumi_session", Context.MODE_PRIVATE)

    val sessionId: String
        get() = getOrCreate("session_id", "lumi-android-${UUID.randomUUID()}")

    val sessionKey: String
        get() = getOrCreate("session_key", "agent:main:lumi-android:${UUID.randomUUID()}")

    private fun getOrCreate(key: String, fresh: String): String {
        val existing = prefs.getString(key, null)
        if (!existing.isNullOrBlank()) return existing
        prefs.edit().putString(key, fresh).apply()
        return fresh
    }
}
__LUMI_EOF__
mkdir -p "$OUT/app/src/main/res/drawable"
cat > "$OUT/app/src/main/res/drawable/ic_lumi_notification.xml" <<'__LUMI_EOF__'
<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="24dp"
    android:height="24dp"
    android:viewportWidth="24"
    android:viewportHeight="24">
    <path
        android:fillColor="#FFFFFFFF"
        android:pathData="M12,14c1.66,0 2.99,-1.34 2.99,-3L15,5c0,-1.66 -1.34,-3 -3,-3S9,3.34 9,5v6c0,1.66 1.34,3 3,3zM17.3,11c0,3 -2.54,5.1 -5.3,5.1S6.7,14 6.7,11H5c0,3.41 2.72,6.23 6,6.72V21H8v2h8v-2h-3v-3.28c3.28,-0.48 6,-3.3 6,-6.72h-1.7z" />
</vector>
__LUMI_EOF__
mkdir -p "$OUT/app/src/main/res/values"
cat > "$OUT/app/src/main/res/values/styles.xml" <<'__LUMI_EOF__'
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="Theme.LumiSafe" parent="android:style/Theme.Material.Light.NoActionBar">
        <item name="android:fontFamily">sans</item>
        <item name="android:colorAccent">#6750A4</item>
        <item name="android:navigationBarColor">#FFFFFF</item>
        <item name="android:statusBarColor">#FFFFFF</item>
        <item name="android:windowLightStatusBar">true</item>
    </style>
</resources>
__LUMI_EOF__
cat > "$OUT/build.gradle.kts" <<'__LUMI_EOF__'
plugins {
    id("com.android.application") version "8.7.3" apply false
    id("org.jetbrains.kotlin.android") version "2.0.21" apply false
}
__LUMI_EOF__
cat > "$OUT/gradle.properties" <<'__LUMI_EOF__'
org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=false
kotlin.code.style=official
__LUMI_EOF__
cat > "$OUT/settings.gradle.kts" <<'__LUMI_EOF__'
pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}
rootProject.name = "LumiVoiceBridge"
include(":app")
__LUMI_EOF__
mkdir -p "$OUT/app/src/main/res/drawable-nodpi"
base64 -d "$(dirname "$0")/icon192.b64.txt" > "$OUT/app/src/main/res/drawable-nodpi/ic_launcher.png"
