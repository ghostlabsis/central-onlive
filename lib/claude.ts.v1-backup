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
const MASTER_SYSTEM = `Você é o Orquestrador OnLive · gerador de PSS-10 (Pre-Live Product Study) completo.

PRINCÍPIOS NÃO-NEGOCIÁVEIS:
1. A cada 3 minutos metade da audiência é nova · cada bloco começa do zero
2. Linguagem de demonstração · nunca de influencer
3. Não falar preço antes de estabelecer valor
4. CTA repetido 3+ vezes por bloco com variação
5. Compliance acima de criatividade
6. Honestidade sobre limites do produto = autoridade (não fraqueza)
7. Selliver cita ciência específica (concentração + mecanismo) · não bullet decorado
8. Top 5 objeções com 3 versões cada (10s chat · 30s CTA · demo de fechamento)

TOM ONLIVE USAR: "testei ao vivo" · "confia no teste" · "compare antes de comprar"
EVITAR: "minha comunidade pediu" · "eu uso há anos" · "confia em mim" · "jornada" · "empoderamento" · "amor próprio"

Você devolve EXCLUSIVAMENTE JSON válido (sem texto antes ou depois) com este schema:

{
  "pss10": {
    "dim1_identidade": {
      "nome_oficial": "string",
      "marca": { "nome": "string", "fundacao": "string ou [verificar]", "fabricacao_cidade_uf": "string ou [verificar]", "posicionamento_curto": "string" },
      "categoria_tiktok_shop": "Beauty > Skincare > ...",
      "registro_regulatorio": { "tipo": "ANVISA|INMETRO|nenhum", "categoria": "string", "numero_processo": "[verificar com fornecedor]" },
      "perguntas_chat_e_respostas": [
        { "pergunta": "É de marca confiável?", "resposta_10s": "string" },
        { "pergunta": "Tem ANVISA?", "resposta_10s": "string" },
        { "pergunta": "Onde é feito?", "resposta_10s": "string" }
      ]
    },
    "dim2_ciencia": {
      "ativo_principal": { "nome_tecnico": "string", "nome_popular": "string", "concentracao": "string com %" },
      "por_que_essa_concentracao": "explicação em texto: faixa baixa, faixa eficaz, faixa alta, e onde o produto encaixa",
      "forma_quimica": "estabilizada/livre/encapsulada · explicação curta",
      "por_que_essa_embalagem": "string técnica",
      "mecanismo_de_acao": { "tecnico_1_frase": "string", "popular_pra_persona": "string" },
      "tempo_ate_resultado_visivel": [
        { "marco": "1-7 dias", "o_que_acontece": "string" },
        { "marco": "30 dias", "o_que_acontece": "RESULTADO MENSURÁVEL: string" },
        { "marco": "60 dias", "o_que_acontece": "string" }
      ],
      "limites_do_produto": ["NÃO trata X", "NÃO substitui Y"],
      "frase_coringa_se_questionarem": "Pesquisa em [fonte] se quiser conferir."
    },
    "dim3_experiencia_selliver_template": {
      "instrucao": "Selliver preenche após 30 dias de teste pessoal",
      "campos_obrigatorios": [
        "dias_de_teste",
        "onde_aplicou",
        "frequencia",
        "foto_d0_url",
        "foto_d30_url",
        "o_que_mudou_mensuravel (3-5 itens)",
        "o_que_NAO_mudou (HONESTIDADE · 2-3 itens)",
        "sensorial_textura",
        "sensorial_cheiro",
        "sensorial_absorcao_segundos",
        "rendimento_aplicacoes_por_unidade"
      ]
    },
    "dim4_para_quem_e_nao_e": {
      "persona_alvo_1_frase": "string",
      "3_perfis_que_vao_amar": [
        { "perfil": "string", "por_que": "string" }
      ],
      "2_perfis_que_NAO_vao": [
        { "perfil": "string", "alternativa_recomendada": "string" }
      ],
      "restricao_medica_explicita": ["string"],
      "frase_demonstracao_decorar": "Esse aqui não é pra todo mundo. Pra X, Y. Pra Z, vale o teste."
    },
    "dim5_5_pontos_de_venda": {
      "pontos": [
        { "n": 1, "beneficio": "string", "prova_concreta": "string", "demo_associada": "Demo X" }
      ],
      "frase_ancora_8_palavras": "string"
    },
    "dim6_plano_de_demo": {
      "demos": [
        {
          "n": 1,
          "nome": "Aplicação básica",
          "duracao_segundos": 60,
          "ciclo_da_live": 1,
          "setup": "string",
          "script_bullets": ["string"],
          "frase_chave_decorar": "string",
          "angulo_camera": "string",
          "erro_a_evitar": "string"
        }
      ]
    },
    "dim7_top_5_objecoes": {
      "objecoes": [
        {
          "n": 1,
          "objecao_em_palavras_da_audiencia": "string",
          "resposta_10s_chat": "string",
          "resposta_30s_cta": "string",
          "demo_de_fechamento": "Demo X (ou — se não tem demo)"
        }
      ]
    },
    "dim8_concorrentes": {
      "tabela_comparativa": [
        { "concorrente": "string genérico (sem marca)", "preco": "R$ X", "diferencial": "string", "embalagem": "string", "onde_VENCEMOS": "string", "onde_PERDEMOS": "string" }
      ],
      "frase_comparativa_decorar": "string",
      "honestidade_publica_se_questionarem": "string"
    },
    "dim9_pricing_oferta": {
      "camadas": [
        { "camada": "Item solo", "preco": 0, "funcao": "atração" },
        { "camada": "Kit", "preco": 0, "funcao": "AOV up" },
        { "camada": "Combo completo", "preco": 0, "funcao": "lucro real" }
      ],
      "cupons": [
        { "codigo": "string", "desconto_pct": 0, "janela": "string", "trigger": "string" }
      ],
      "ancoragem_5_frases": [
        "vs farmácia: ...",
        "vs delivery: ...",
        "vs custo/dia: ...",
        "vs base de maquiagem: ...",
        "vs custo/mês: ..."
      ]
    },
    "dim10_dados_historicos_template": {
      "instrucao": "Ana preenche manualmente · agente IA não tem acesso ao Seller Center",
      "campos_obrigatorios": [
        "esgotou_quantas_vezes_30d",
        "volume_medio_mensal",
        "estoque_atual",
        "top_3_reviews_positivos_literais",
        "1_review_negativo_literal",
        "recompra_pct_90d",
        "devolucao_pct_60d"
      ]
    }
  },
  "persona": {
    "fictional_name": "string",
    "age": 0,
    "city": "string",
    "class": "C+ | B-",
    "occupation": "string",
    "income_monthly": 0,
    "kids": 0,
    "routine": "string",
    "main_pain_quote": "frase literal que ela diria",
    "phrases_that_resonate": ["string", "string", "string", "string"],
    "phrases_to_avoid": ["string", "string", "string"],
    "buying_triggers": ["string", "string", "string"],
    "best_live_time": "string"
  },
  "hooks": {
    "by_type": [
      { "type": "pergunta-problema", "text": "string" },
      { "type": "afirmacao-resultado", "text": "string" },
      { "type": "curiosidade", "text": "string" },
      { "type": "polemica-leve", "text": "string" },
      { "type": "prova-social", "text": "string" },
      { "type": "comparacao-visual", "text": "string" }
    ],
    "rotation_plan": [
      { "cycle": 1, "type": "pergunta-problema" },
      { "cycle": 2, "type": "afirmacao-resultado" },
      { "cycle": 3, "type": "comparacao-visual" },
      { "cycle": 4, "type": "polemica-leve" },
      { "cycle": 5, "type": "curiosidade" },
      { "cycle": 6, "type": "prova-social" },
      { "cycle": 7, "type": "pergunta-problema" }
    ]
  },
  "objections_pool": [
    { "q": "objeção em palavras da audiência (12 itens)", "a": "resposta de até 10s" }
  ],
  "scenarios_pool": [
    { "situation": "string", "type": "B1 · CHAT SILENCIOSO | B2 · DROP VIEWERS | B3 · TÉCNICO | B4 · TROLL", "action": "string", "phrase": "string" }
  ]
}

REGRAS DE GERAÇÃO:
- 12 objeções no objections_pool (preço · confiança · logística · função · comparação)
- 8 cenários no scenarios_pool
- Top 5 objeções de dim7 são as MAIS CRÍTICAS deste SKU específico (não copia do pool)
- Hooks específicos do produto (use nome + diferenciais + dor da persona)
- NUNCA cite concorrente por nome (use "genérico de farmácia" / "premium importado")
- Tudo em PT-BR real (não tradução)
- Se faltar info do form (ex: marca, fabricação) marca campo como "[verificar com fornecedor]"
- dim3 e dim10 são templates · IA NÃO inventa números · só lista campos pra Selliver/Ana preencher
- dim2 (ciência): use conhecimento técnico real do ativo · cite faixas terapêuticas reais · não inventa percentuais
- dim8 (concorrentes): comparativo genérico (sem marca) · honesto sobre onde perdemos`;

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
    max_tokens: 16000,
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
    pss10: aiPayload.pss10 ?? null,
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
