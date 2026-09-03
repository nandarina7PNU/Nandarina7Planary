import { NextResponse } from 'next/server';

type GeminiResponse = {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  error?: { message?: string };
};

const responseSchema = {
  type: 'OBJECT',
  properties: {
    summary: { type: 'STRING', description: '입력 내용을 한 문장으로 요약한 한국어 설명' },
    items: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          kind: { type: 'STRING', enum: ['task', 'schedule'] },
          title: { type: 'STRING' },
          date: { type: 'STRING', description: 'YYYY-MM-DD. 날짜를 알 수 없으면 빈 문자열' },
          start: { type: 'STRING', description: 'HH:mm. 일정이 아니거나 시간을 알 수 없으면 빈 문자열' },
          end: { type: 'STRING', description: 'HH:mm. 일정이 아니거나 시간을 알 수 없으면 빈 문자열' },
          repeatWeekdays: { type: 'ARRAY', items: { type: 'INTEGER' }, description: '일요일 0, 월요일 1 ... 토요일 6' },
          repeatUntil: { type: 'STRING', description: 'YYYY-MM-DD. 반복 종료일을 알 수 없으면 빈 문자열' },
          category: { type: 'STRING' },
          priority: { type: 'INTEGER', description: '높음 1, 보통 2, 낮음 3' },
          note: { type: 'STRING' },
          checklist: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: { title: { type: 'STRING' }, note: { type: 'STRING' } },
              required: ['title', 'note'],
            },
          },
        },
        required: ['kind', 'title', 'date', 'start', 'end', 'repeatWeekdays', 'repeatUntil', 'category', 'priority', 'note', 'checklist'],
      },
    },
  },
  required: ['summary', 'items'],
};

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'Gemini API 키가 설정되지 않았습니다.' }, { status: 503 });

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: '요청 형식이 올바르지 않습니다.' }, { status: 400 }); }
  const input = typeof body === 'object' && body !== null && 'input' in body ? String(body.input).trim() : '';
  const today = typeof body === 'object' && body !== null && 'today' in body ? String(body.today) : '';
  const categories = typeof body === 'object' && body !== null && 'categories' in body && Array.isArray(body.categories)
    ? body.categories.filter((value): value is string => typeof value === 'string').slice(0, 30)
    : [];
  if (!input || input.length > 6000) return NextResponse.json({ error: '내용을 1~6000자로 입력해 주세요.' }, { status: 400 });

  const prompt = `당신은 한국어 개인 플래너 Planary의 일정 분류기입니다.\n오늘은 ${today}이고 시간대는 Asia/Seoul입니다.\n사용 가능한 분류: ${categories.join(', ') || '집중, 공부, 건강, 생활'}\n\n사용자 입력을 실제로 등록 가능한 항목으로 분해하세요.\n- 특정 날짜와 시간이 있으면 schedule, 시간이 없으면 task입니다.\n- 여러 날짜나 서로 다른 일정이 명시되면 여러 item으로 나눕니다.\n- 반복 일정은 repeatWeekdays에 요일 번호를 넣고, 종료일이 없으면 오늘로부터 약 4개월 뒤 날짜를 제안합니다.\n- "매주 월요일 수요일"처럼 나열된 요일을 정확히 모두 포함합니다.\n- 오후/밤/새벽 표현을 24시간 HH:mm으로 변환합니다. 자정을 넘으면 end가 start보다 작아도 됩니다.\n- 종료 시간이 없으면 시작 1시간 뒤로 제안합니다.\n- 제출 서류나 준비 단계가 나열된 큰 할 일은 하나의 task와 checklist로 묶습니다.\n- category는 반드시 사용 가능한 분류 중 가장 가까운 하나를 선택합니다.\n- 추측이 큰 정보는 note에 '확인 필요'라고 표시하고 원문 의미를 보존합니다.\n- 입력에 없는 개인 정보나 일정을 만들지 마세요.\n\n사용자 입력:\n${input}`;

  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json', responseSchema, temperature: 0.1 },
      }),
    });
    const result = await response.json() as GeminiResponse;
    if (!response.ok) return NextResponse.json({ error: result.error?.message || 'Gemini가 요청을 처리하지 못했습니다.' }, { status: response.status });
    const text = result.candidates?.[0]?.content?.parts?.map(part => part.text || '').join('');
    if (!text) throw new Error('empty');
    return NextResponse.json(JSON.parse(text));
  } catch {
    return NextResponse.json({ error: 'AI 응답을 해석하지 못했습니다. 잠시 후 다시 시도해 주세요.' }, { status: 502 });
  }
}
