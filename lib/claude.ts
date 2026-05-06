/**
 * lib/claude.ts — Cliente Anthropic + Master Prompt
 *
 * Função principal: gera o pacote completo (persona + hooks + objeções + script
 * + checklist) a partir dos dados do form admin. Resultado vira o JSON que
 * alimenta o build-course.js.
 */

import Anthropic from '@anthropic-ai/sdk';
import { FormInputSchema, type FormInput } from './validation';

// ===== Anthropic client =====
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
  // Opcional: Helicone observability
  // baseURL: process.env.HELICONE_API_KEY ? 'https://anthropic.helicone.ai' : undefined,
  // defaultHeaders: process.env.HELICONE_API_KEY ? { 'Helicone-Auth': `Bearer ${process.env.HELICONE_API_KEY}` } : {},
});

export type { FormInput };

// ===== System prompt do Master =====
const MASTER_SYSTEM = `Você é o Orquestrador OnLive — gera persona + hooks + objeções + plano de gift para alimentar um curso de Selliver no TikTok Shop.

Princípios não-negociáveis:
1. A cada 3 minutos, metade da audiência é nova. Cada ciclo começa do zero.
2. Linguagem de demonstração, nunca de influencer.
3. Não falar preço antes de estabelecer valor.
4. CTA repetido 3+ vezes por bloco com variação.
5. Compliance acima de criatividade.

Tom OnLive USAR: "testei ao vivo", "confia no teste", "compare antes de comprar".
EVITAR: "minha comunidade pediu", "eu uso há anos", "confia em mim", "jornada", "empoderamento".

Você devolve EXCLUSIVAMENTE um JSON válido, sem texto antes ou depois, com este schema:

{
  "persona": {
    "fictional_name": "...",
    "age": 0,
    "city": "...",
    "class": "C+ | B- | etc",
    "occupation": "...",
    "income_monthly": 0,
    "kids": 0,
    "routine": "...",
    "main_pain_quote": "frase literal que ela diria",
    "phrases_that_resonate": ["...", "...", "...", "..."],
    "phrases_to_avoid": ["...", "...", "..."],
    "buying_triggers": ["...", "...", "..."],
    "best_live_time": "..."
  },
  "hooks": {
    "by_type": [
      { "type": "pergunta-problema", "text": "..." },
      { "type": "afirmacao-resultado", "text": "..." },
      { "type": "curiosidade", "text": "..." },
      { "type": "polemica-leve", "text": "..." },
      { "type": "prova-social", "text": "..." },
      { "type": "comparacao-visual", "text": "..." }
    ],
    "rotation_plan": [
      { "cycle": 1, "type": "pergunta-problema" },
      { "cycle": 2, "type": "afirmacao-resultado" }
    ]
  },
  "objections_pool": [
    { "q": "objeção em palavras da audiência", "a": "resposta de até 10s" }
  ],
  "scenarios_pool": [
    { "situation": "...", "type": "B1 · CHAT SILENCIOSO | B2 ... | B3 ... | B4 ...", "action": "...", "phrase": "..." }
  ]
}

Regras:
- 12 objeções no pool (preço, confiança, logística, função, comparação)
- 8 cenários de plano B
- Hooks específicos do produto (use o nome, diferenciais, dor da persona)
- Objeções respondem a categoria do produto sem citar concorrente
- Tudo em português do Brasil real (não tradução)`;

// ===== Função principal =====
export async function generateCourseData(form: FormInput) {
  // Valida input
  const validated = FormInputSchema.parse(form);

  // Monta prompt do user
  const userPrompt = `Dados da live:
${JSON.stringify(validated, null, 2)}

Gere o JSON completo seguindo o schema. Sem texto antes ou depois.`;

  // Chama Claude (Sonnet 4.6 — qualidade alta)
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 8000,
    system: MASTER_SYSTEM,
    messages: [{ role: 'user', content: userPrompt }],
  });

  // Extrai texto da resposta
  const text = response.content
    .filter((c) => c.type === 'text')
    .map((c) => (c as any).text)
    .join('');

  // Parse JSON (com fallback se Claude embrulhar em ```json)
  const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/(\{[\s\S]*\})/);
  if (!jsonMatch) throw new Error('Claude não retornou JSON válido');
  const aiPayload = JSON.parse(jsonMatch[1] || jsonMatch[0]);

  // Combina form + IA = course data completo
  const courseData = {
    $schema: '../schemas/course-data.json',
    version: '1.0',
    template_version: 'v1.0',
    generated_at: new Date().toISOString(),
    selliver: validated.selliver,
    live: {
      ...validated.live,
      // Schedule fixo: T-5 a T-1
      schedule: [
        { d: -5, label: 'T-5d', modules: [1, 2], duration_min: 25 },
        { d: -4, label: 'T-4d', modules: [3], duration_min: 20 },
        { d: -3, label: 'T-3d', modules: [4, 5], duration_min: 35 },
        { d: -2, label: 'T-2d', modules: [6, 7], duration_min: 25 },
        { d: -1, label: 'T-1d', modules: [8, 9], duration_min: 40 },
      ],
    },
    hero: {
      ...validated.hero,
      key_phrase: `${validated.hero.name} ${validated.hero.differentials[0]?.description ?? ''} para quem ${aiPayload.persona?.main_pain_quote ?? 'precisa de solução'}.`.trim(),
    },
    secondary_products: validated.secondary_products ?? [],
    persona: aiPayload.persona,
    hooks: aiPayload.hooks,
    objections_pool: aiPayload.objections_pool,
    scenarios_pool: aiPayload.scenarios_pool,
    compliance: validated.compliance,
    audience_profile: {
      expected_size: '200-500 viewers',
      main_origin: 'organico',
      funnel_stage: 'descoberta_da_marca',
    },
    _meta: {
      tokens_in: response.usage?.input_tokens ?? 0,
      tokens_out: response.usage?.output_tokens ?? 0,
      cost_usd_estimate: ((response.usage?.input_tokens ?? 0) * 3 + (response.usage?.output_tokens ?? 0) * 15) / 1_000_000,
    },
  };

  return courseData;
}
