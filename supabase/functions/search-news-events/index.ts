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
    const { query, startDate, endDate } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Searching for news events:', { query, startDate, endDate });

    // استخدام Lovable AI للبحث عن الأحداث
    const searchPrompt = `ابحث عن أحداث بحرية وعسكرية مهمة حدثت في البحر الأحمر والمنطقة المحيطة بين ${startDate} و ${endDate} متعلقة بـ: ${query}. 
    
    أرجع النتائج بتنسيق JSON صارم على الشكل التالي فقط:
    {
      "events": [
        {
          "title": "عنوان الحدث",
          "description": "وصف مختصر للحدث",
          "date": "تاريخ الحدث بصيغة ISO",
          "lat": خط العرض (رقم بين 12.3 و 19.5),
          "lon": خط الطول (رقم بين 42.0 و 46.0),
          "severity": "high أو medium أو low",
          "type": "نوع الحدث"
        }
      ]
    }
    
    احرص على أن تكون الإحداثيات ضمن نطاق البحر الأحمر الجنوبي (12.3N-19.5N, 42.0E-46.0E). إذا لم تكن متأكداً من الموقع الدقيق، استخدم إحداثيات تقريبية في وسط البحر الأحمر.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { 
            role: 'system', 
            content: 'أنت مساعد متخصص في البحث عن الأحداث البحرية والعسكرية. أرجع النتائج دائماً بصيغة JSON صحيحة فقط بدون أي نص إضافي.' 
          },
          { role: 'user', content: searchPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'تم تجاوز حد الطلبات، الرجاء المحاولة لاحقاً' }), 
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'يرجى إضافة رصيد إلى حساب Lovable AI الخاص بك' }), 
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI API error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('No response from AI');
    }

    console.log('AI Response:', content);

    // استخراج JSON من النص
    let eventsData;
    try {
      // محاولة استخراج JSON من النص إذا كان محاطاً بنص إضافي
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        eventsData = JSON.parse(jsonMatch[0]);
      } else {
        eventsData = JSON.parse(content);
      }
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      console.error('AI response content:', content);
      throw new Error('Failed to parse AI response');
    }

    return new Response(
      JSON.stringify(eventsData), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in search-news-events:', error);
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ أثناء البحث';
    return new Response(
      JSON.stringify({ error: errorMessage }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
