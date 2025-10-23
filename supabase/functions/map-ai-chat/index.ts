import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, markers } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `أنت مساعد ذكي متقدم لخريطة عسكرية بحرية. لديك القدرات التالية:

1. البحث والتحليل: يمكنك البحث عن أحداث عسكرية وبحرية وتحليلها
2. التلخيص الذكي: يمكنك تلخيص المعلومات المعقدة بشكل واضح ومفيد
3. الإضافة الذكية: يمكنك إضافة العلامات على الخريطة بناءً على نتائج البحث والتحليل
4. إدارة العلامات: يمكنك تحريك وتحديث العلامات الموجودة

العلامات الحالية على الخريطة:
${JSON.stringify(markers, null, 2)}

## أنواع الاستجابات:

### 1. البحث والتلخيص (بدون إضافة علامات)
عندما يطلب المستخدم معلومات أو بحث بدون طلب صريح للإضافة:
{
  "action": "message",
  "message": "ملخص شامل للمعلومات المطلوبة مع التفاصيل المهمة"
}

### 2. البحث والإضافة التلقائية
عندما يطلب المستخدم البحث وإضافة النتائج على الخريطة:
{
  "action": "search_and_add",
  "summary": "ملخص للمعلومات التي تم العثور عليها",
  "markers": [
    {
      "name": "اسم العلامة",
      "type": "military/ship/aircraft/port/hazard",
      "coordinates": [longitude, latitude],
      "severity": "high/medium/low",
      "description": "وصف الحدث أو الموقع"
    }
  ],
  "message": "رسالة توضيحية للمستخدم عن ما تم إضافته"
}

### 3. إضافة علامة واحدة
{
  "action": "add",
  "marker": {
    "name": "اسم العلامة",
    "type": "military/ship/aircraft/port/hazard",
    "coordinates": [longitude, latitude],
    "severity": "high/medium/low",
    "description": "وصف مفصل"
  },
  "message": "رسالة توضيحية"
}

### 4. تحريك علامة
{
  "action": "move",
  "markerId": "معرف العلامة",
  "newCoordinates": [longitude, latitude],
  "message": "رسالة توضيحية"
}

## إرشادات الاستخدام:

- استخدم معرفتك للبحث عن أحداث عسكرية وبحرية حقيقية
- قدم معلومات دقيقة ومحدثة قدر الإمكان
- عند البحث عن أحداث، حدد المواقع الجغرافية بدقة
- استخدم الإحداثيات المناسبة للمناطق:
  * البحر الأحمر: 32-43°E, 12-30°N
  * البحر المتوسط: -6-36°E, 30-46°N
  * الخليج العربي: 47-57°E, 23-30°N
  * مضيق باب المندب: 43.3°E, 12.6°N
  * قناة السويس: 32.3°E, 30.5°N
  * مضيق هرمز: 56.3°E, 26.6°N

- عند تلخيص المعلومات، ركز على:
  * التواريخ والمواقع الدقيقة
  * الأطراف المتورطة
  * التأثير والأهمية الاستراتيجية
  * مستوى الخطورة

- حدد مستوى الخطورة بناءً على:
  * high: صراعات مسلحة، قصف، هجمات
  * medium: توترات، تحركات عسكرية، تحذيرات
  * low: تدريبات، دوريات روتينية`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'تم تجاوز حد الاستخدام، يرجى المحاولة لاحقاً' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'يتطلب إضافة رصيد، يرجى إضافة رصيد إلى حساب Lovable AI' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    // Try to parse JSON response
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsedResponse = JSON.parse(jsonMatch[0]);
        return new Response(
          JSON.stringify(parsedResponse),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } catch (e) {
      console.log('Response is not JSON, returning as text message');
    }

    // Return as text message if not JSON
    return new Response(
      JSON.stringify({ action: 'message', message: aiResponse }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in map-ai-chat function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
