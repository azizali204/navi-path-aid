#!/usr/bin/env bash
set -euo pipefail
OUT="${1:-lumi-v10-src}"
mkdir -p "$OUT"
mkdir -p "$OUT/app/src/main/java/com/az/lumivoice"
cat > "$OUT/app/src/main/java/com/az/lumivoice/MainActivity.kt" <<'__LUMI_EOF__'
package com.az.lumivoice

import android.Manifest
import android.app.Activity
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Typeface
import android.os.Build
import android.os.Bundle
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import android.text.InputType
import android.view.Gravity
import android.view.ViewGroup
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import android.widget.Toast

class MainActivity : Activity() {
    companion object {
        private const val REQUEST_RECORD_AUDIO = 6001
        private const val REQUEST_NOTIFICATIONS = 6002
    }

    private lateinit var store: SecureStore
    private lateinit var sessionStore: SessionStore
    private lateinit var keyInput: EditText
    private lateinit var status: TextView
    private lateinit var testButton: Button
    private lateinit var voiceButton: Button
    private lateinit var voiceStatus: TextView
    private lateinit var messageInput: EditText
    private lateinit var sendButton: Button
    private lateinit var responseText: TextView
    private lateinit var backgroundButton: Button

    private var speechRecognizer: SpeechRecognizer? = null
    private var pendingVoiceStart = false
    private var pendingBackgroundStart = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        store = SecureStore(applicationContext)
        sessionStore = SessionStore(applicationContext)
        setContentView(buildUi())

        if (backgroundPrefs().getBoolean("enabled", false)) {
            runCatching { startBackgroundServiceInternal() }
        }
        updateBackgroundButton()
    }

    private fun dp(value: Int): Int = (value * resources.displayMetrics.density).toInt()

    private fun label(textValue: String, size: Float = 16f): TextView = TextView(this).apply {
        text = textValue
        textSize = size
        setPadding(0, dp(6), 0, dp(6))
    }

    private fun buildUi(): ScrollView {
        val scroll = ScrollView(this)
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER_HORIZONTAL
            layoutDirection = LinearLayout.LAYOUT_DIRECTION_RTL
            setPadding(dp(20), dp(28), dp(20), dp(28))
        }
        scroll.addView(root, ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT))

        root.addView(label("لومي — v1.0", 26f).apply { setTypeface(typeface, Typeface.BOLD) })
        root.addView(label("صوت → نص → إرسال إلى Hermes → عرض الرد النهائي", 14f))

        root.addView(label("السيرفر"))
        root.addView(label(HermesClient.BASE_URL, 13f).apply {
            layoutDirection = LinearLayout.LAYOUT_DIRECTION_LTR
            setTextIsSelectable(true)
        }, ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT))

        root.addView(label("API_SERVER_KEY"))
        keyInput = EditText(this).apply {
            hint = "ألصق المفتاح هنا"
            inputType = InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_PASSWORD
            layoutDirection = LinearLayout.LAYOUT_DIRECTION_LTR
            setSingleLine(true)
            setText(runCatching { store.loadApiKey() }.getOrDefault(""))
        }
        root.addView(keyInput, ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT))

        root.addView(Button(this).apply {
            text = "حفظ المفتاح"
            setOnClickListener { saveKey(showToast = true) }
        }, ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT))

        testButton = Button(this).apply {
            text = "اختبار الاتصال بـ Hermes"
            setOnClickListener { testConnection() }
        }
        root.addView(testButton, ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT))

        backgroundButton = Button(this).apply {
            setOnClickListener { toggleBackgroundMode() }
        }
        root.addView(backgroundButton, ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT))

        root.addView(Button(this).apply {
            text = "مسح المفتاح من الجهاز"
            setOnClickListener {
                runCatching { store.clear() }
                keyInput.setText("")
                status.text = "الحالة: تم مسح المفتاح"
            }
        }, ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT))

        status = label("الحالة: جاهز", 16f).apply { setPadding(0, dp(18), 0, dp(8)) }
        root.addView(status, ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT))

        root.addView(label("الرسالة إلى لومي", 20f).apply { setTypeface(typeface, Typeface.BOLD) })
        root.addView(label("يمكنك التحدث أو تعديل النص يدويًا قبل الإرسال. مهلة السكوت مطولة لتسمح بالتوقف القصير أثناء الكلام.", 14f))

        voiceButton = Button(this).apply {
            text = "🎤 بدء الاستماع"
            setOnClickListener { requestOrStartVoice() }
        }
        root.addView(voiceButton, ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT))

        voiceStatus = label("الميكروفون: جاهز", 15f)
        root.addView(voiceStatus, ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT))

        messageInput = EditText(this).apply {
            hint = "اكتب رسالتك أو استخدم الميكروفون"
            textSize = 19f
            minLines = 3
            gravity = Gravity.TOP or Gravity.START
            inputType = InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_FLAG_MULTI_LINE or InputType.TYPE_TEXT_FLAG_CAP_SENTENCES
            setPadding(dp(12), dp(14), dp(12), dp(14))
        }
        root.addView(messageInput, ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT))

        sendButton = Button(this).apply {
            text = "إرسال إلى لومي ➤"
            setOnClickListener { sendToHermes() }
        }
        root.addView(sendButton, ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT))

        root.addView(label("رد لومي", 20f).apply {
            setTypeface(typeface, Typeface.BOLD)
            setPadding(0, dp(20), 0, dp(6))
        })

        responseText = label("سيظهر الرد النهائي هنا", 18f).apply {
            setTextIsSelectable(true)
            setPadding(dp(12), dp(14), dp(12), dp(24))
        }
        root.addView(responseText, ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT))

        root.addView(label("ملاحظة: وضع الخلفية يبقي Lumi Voice Bridge فعالًا عبر Foreground Service وإشعار دائم. تشغيل الميكروفون نفسه يبقى يدويًا من زر الاستماع في هذه النسخة.", 12f))

        return scroll
    }

    private fun saveKey(showToast: Boolean): Boolean {
        val key = keyInput.text.toString().trim()
        if (key.isBlank()) {
            toast("أدخل API_SERVER_KEY أولاً")
            return false
        }
        return runCatching {
            store.saveApiKey(key)
            if (showToast) toast("تم حفظ المفتاح على الجهاز")
            true
        }.getOrElse {
            status.text = "الحالة: تعذر حفظ المفتاح"
            toast("تعذر حفظ المفتاح: ${it.message ?: "خطأ غير معروف"}")
            false
        }
    }

    private fun testConnection() {
        if (!saveKey(showToast = false)) return
        val key = keyInput.text.toString().trim()
        testButton.isEnabled = false
        status.text = "الحالة: جاري اختبار الاتصال…"

        Thread {
            val result = runCatching { HermesClient.testConnection(key) }
            runOnUiThread {
                testButton.isEnabled = true
                result.onSuccess {
                    status.text = if (it.ok) "الحالة: ${it.message} ✓" else "الحالة: ${it.message} (${it.code})"
                }.onFailure {
                    status.text = "الحالة: فشل الاتصال"
                    toast(it.message ?: "تعذر الاتصال")
                }
            }
        }.start()
    }

    private fun sendToHermes() {
        if (!saveKey(showToast = false)) return
        val text = messageInput.text.toString().trim()
        if (text.isBlank()) {
            toast("اكتب أو قل رسالة أولاً")
            return
        }

        val key = keyInput.text.toString().trim()
        sendButton.isEnabled = false
        voiceButton.isEnabled = false
        status.text = "الحالة: جاري إرسال الرسالة إلى Hermes…"
        responseText.text = "لومي يفكر وينفذ الطلب…"

        Thread {
            val result = runCatching {
                HermesClient.sendMessage(
                    apiKey = key,
                    userText = text,
                    sessionId = sessionStore.sessionId,
                    sessionKey = sessionStore.sessionKey
                )
            }
            runOnUiThread {
                sendButton.isEnabled = true
                voiceButton.isEnabled = true
                result.onSuccess {
                    responseText.text = it.answer
                    status.text = "الحالة: وصل الرد النهائي من Hermes ✓"
                }.onFailure {
                    responseText.text = "تعذر الحصول على رد"
                    status.text = "الحالة: فشل إرسال الطلب"
                    toast(it.message ?: "تعذر الاتصال بـ Hermes")
                }
            }
        }.start()
    }

    private fun requestOrStartVoice() {
        if (!SpeechRecognizer.isRecognitionAvailable(this)) {
            voiceStatus.text = "الميكروفون: خدمة التعرف على الكلام غير متاحة على الجهاز"
            toast("خدمة التعرف على الكلام غير متاحة")
            return
        }

        if (checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            pendingVoiceStart = true
            requestPermissions(arrayOf(Manifest.permission.RECORD_AUDIO), REQUEST_RECORD_AUDIO)
            return
        }

        startVoiceRecognition()
    }

    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        val granted = grantResults.isNotEmpty() && grantResults[0] == PackageManager.PERMISSION_GRANTED

        when (requestCode) {
            REQUEST_RECORD_AUDIO -> {
                if (granted && pendingVoiceStart) {
                    pendingVoiceStart = false
                    startVoiceRecognition()
                } else {
                    pendingVoiceStart = false
                    voiceStatus.text = "الميكروفون: لم يتم منح الإذن"
                    toast("يلزم السماح باستخدام الميكروفون")
                }
            }
            REQUEST_NOTIFICATIONS -> {
                if (pendingBackgroundStart) {
                    pendingBackgroundStart = false
                    startBackgroundMode()
                }
            }
        }
    }

    private fun startVoiceRecognition() {
        destroySpeechRecognizer()

        val recognizer = runCatching { SpeechRecognizer.createSpeechRecognizer(this) }.getOrElse {
            voiceStatus.text = "الميكروفون: تعذر تشغيل خدمة التعرف"
            toast(it.message ?: "تعذر تشغيل التعرف على الكلام")
            return
        }
        speechRecognizer = recognizer

        recognizer.setRecognitionListener(object : RecognitionListener {
            override fun onReadyForSpeech(params: Bundle?) {
                voiceButton.isEnabled = false
                voiceStatus.text = "الميكروفون: استمع الآن…"
            }

            override fun onBeginningOfSpeech() {
                voiceStatus.text = "الميكروفون: يتم الاستماع…"
            }

            override fun onRmsChanged(rmsdB: Float) = Unit
            override fun onBufferReceived(buffer: ByteArray?) = Unit

            override fun onEndOfSpeech() {
                voiceStatus.text = "الميكروفون: جاري تحويل الكلام إلى نص…"
            }

            override fun onError(error: Int) {
                voiceButton.isEnabled = true
                voiceStatus.text = "الميكروفون: ${speechErrorMessage(error)}"
                destroySpeechRecognizer()
            }

            override fun onResults(results: Bundle?) {
                voiceButton.isEnabled = true
                val matches = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION).orEmpty()
                val best = matches.firstOrNull()?.trim().orEmpty()
                if (best.isBlank()) {
                    voiceStatus.text = "الميكروفون: لم يتم التعرف على الكلام"
                } else {
                    messageInput.setText(best)
                    messageInput.setSelection(best.length)
                    voiceStatus.text = "الميكروفون: تم تحويل الكلام إلى نص ✓"
                }
                destroySpeechRecognizer()
            }

            override fun onPartialResults(partialResults: Bundle?) = Unit
            override fun onEvent(eventType: Int, params: Bundle?) = Unit
        })

        val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
            putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
            putExtra(RecognizerIntent.EXTRA_LANGUAGE, "ar-SA")
            putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS, 3500L)
            putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS, 5000L)
            putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_MINIMUM_LENGTH_MILLIS, 1000L)
            putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, "ar-SA")
            putExtra(RecognizerIntent.EXTRA_ONLY_RETURN_LANGUAGE_PREFERENCE, false)
            putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, false)
            putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 3)
        }

        voiceButton.isEnabled = false
        voiceStatus.text = "الميكروفون: جارٍ بدء الاستماع…"
        runCatching { recognizer.startListening(intent) }.onFailure {
            voiceButton.isEnabled = true
            voiceStatus.text = "الميكروفون: فشل بدء الاستماع"
            toast(it.message ?: "تعذر بدء الاستماع")
            destroySpeechRecognizer()
        }
    }

    private fun toggleBackgroundMode() {
        if (backgroundPrefs().getBoolean("enabled", false)) {
            stopService(Intent(this, LumiBackgroundService::class.java))
            backgroundPrefs().edit().putBoolean("enabled", false).apply()
            updateBackgroundButton()
            status.text = "الحالة: تم إيقاف العمل في الخلفية"
            return
        }

        if (Build.VERSION.SDK_INT >= 33 && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            pendingBackgroundStart = true
            requestPermissions(arrayOf(Manifest.permission.POST_NOTIFICATIONS), REQUEST_NOTIFICATIONS)
            return
        }
        startBackgroundMode()
    }

    private fun startBackgroundMode() {
        val started = runCatching {
            startBackgroundServiceInternal()
            backgroundPrefs().edit().putBoolean("enabled", true).apply()
            true
        }.getOrElse {
            toast("تعذر تشغيل وضع الخلفية: ${it.message ?: "خطأ غير معروف"}")
            false
        }
        if (started) status.text = "الحالة: لومي يعمل في الخلفية ✓"
        updateBackgroundButton()
    }

    private fun startBackgroundServiceInternal() {
        val intent = Intent(this, LumiBackgroundService::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) startForegroundService(intent) else startService(intent)
    }

    private fun updateBackgroundButton() {
        if (!::backgroundButton.isInitialized) return
        val enabled = backgroundPrefs().getBoolean("enabled", false)
        backgroundButton.text = if (enabled) "إيقاف العمل في الخلفية" else "تشغيل لومي في الخلفية"
    }

    private fun backgroundPrefs() = getSharedPreferences("lumi_background", Context.MODE_PRIVATE)

    private fun speechErrorMessage(error: Int): String = when (error) {
        SpeechRecognizer.ERROR_AUDIO -> "خطأ في الميكروفون"
        SpeechRecognizer.ERROR_CLIENT -> "تم إلغاء الاستماع"
        SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS -> "إذن الميكروفون غير متاح"
        SpeechRecognizer.ERROR_NETWORK -> "خطأ في الشبكة"
        SpeechRecognizer.ERROR_NETWORK_TIMEOUT -> "انتهت مهلة الشبكة"
        SpeechRecognizer.ERROR_NO_MATCH -> "لم يتم التعرف على الكلام"
        SpeechRecognizer.ERROR_RECOGNIZER_BUSY -> "خدمة التعرف مشغولة"
        SpeechRecognizer.ERROR_SERVER -> "خطأ في خدمة التعرف"
        SpeechRecognizer.ERROR_SPEECH_TIMEOUT -> "لم يتم سماع كلام"
        else -> "خطأ في التعرف على الكلام ($error)"
    }

    private fun destroySpeechRecognizer() {
        runCatching { speechRecognizer?.destroy() }
        speechRecognizer = null
    }

    override fun onResume() {
        super.onResume()
        updateBackgroundButton()
    }

    override fun onDestroy() {
        destroySpeechRecognizer()
        super.onDestroy()
    }

    private fun toast(message: String) {
        Toast.makeText(this, message, Toast.LENGTH_LONG).show()
    }
}
__LUMI_EOF__
