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

    const systemPrompt = `أنت مساعد ذكي لخريطة عسكرية. يمكنك مساعدة المستخدمين في إضافة علامات جديدة أو تحريك العلامات الموجودة على الخريطة.

العلامات الحالية على الخريطة:
${JSON.stringify(markers, null, 2)}

عندما يطلب المستخدم إضافة علامة جديدة، يجب أن ترد بتنسيق JSON:
{
  "action": "add",
  "marker": {
    "name": "اسم العلامة",
    "type": "نوع العلامة (military, ship, aircraft, port, hazard)",
    "coordinates": [longitude, latitude],
    "severity": "high/medium/low"
  },
  "message": "رسالة توضيحية للمستخدم"
}

عندما يطلب المستخدم تحريك علامة موجودة، يجب أن ترد بتنسيق JSON:
{
  "action": "move",
  "markerId": "معرف العلامة",
  "newCoordinates": [longitude, latitude],
  "message": "رسالة توضيحية للمستخدم"
}

إذا كان الطلب غير واضح أو تحتاج معلومات إضافية، رد برسالة عادية لطلب التوضيح.

ملاحظات مهمة:
- البحر الأحمر: خط طول تقريباً من 32 إلى 43، خط عرض من 12 إلى 30
- البحر المتوسط: خط طول تقريباً من -6 إلى 36، خط عرض من 30 إلى 46
- الخليج العربي: خط طول تقريباً من 47 إلى 57، خط عرض من 23 إلى 30`;

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
