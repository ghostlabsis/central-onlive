import type { NextApiRequest, NextApiResponse } from 'next';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

const ANALYZER_SYSTEM = `Você é um analista sênior de produtos para live commerce no TikTok Shop Brasil.

Analise o produto pelo URL e conteúdo fornecido. Use SEU CONHECIMENTO sobre a categoria para enriquecer a análise — se a página tiver pouco conteúdo, baseie-se no tipo de produto, ingredientes ativos conhecidos, regulação ANVISA da categoria, e perfil típico da audiência brasileira do TikTok Shop.

Retorne EXCLUSIVAMENTE JSON válido, sem texto antes ou depois:

{
  "hero": {
    "name": "nome comercial exato do produto",
    "category": "categoria curta em português (ex: cosmeticos, suplementos, eletronicos, moda, casa)",
    "price_full": 0,
    "price_live": 0,
    "stock": 50,
    "differentials": [
      { "label": "Label curto", "description": "Descrição específica com dado concreto (%, ingrediente, número, certificação)" },
      { "label": "Label curto", "description": "..." },
      { "label": "Label curto", "description": "..." }
    ],
    "main_objection": "A objeção mais comum — em palavras literais da audiência (ex: 'Tá caro pra um sérum')",
    "key_phrase": "Frase-chave de até 20 palavras que a Selliver vai decorar e repetir na live"
  },
  "compliance": {
    "regulated_category": "categoria técnica para ANVISA (cosmeticos/suplementos/alimentos/dispositivos_medicos/eletronicos/moda/casa)",
    "forbidden_claims": [
      "claim proibido 1 — baseado na regulação da categoria",
      "claim proibido 2",
      "claim proibido 3"
    ],
    "allowed_claims": [
      "claim permitido 1 — o que pode ser dito dentro da lei",
      "claim permitido 2",
      "claim permitido 3"
    ],
    "anvisa_registration": ""
  },
  "product_analysis": {
    "target_audience": "Descrição em 2 linhas: quem é, qual dor central, por que compra ao vivo",
    "main_pains": [
      "Dor física ou emocional 1 — em palavras da persona",
      "Dor 2",
      "Dor 3",
      "Dor 4"
    ],
    "main_desires": [
      "Desejo 1 — resultado que a pessoa quer",
      "Desejo 2",
      "Desejo 3"
    ],
    "product_strengths": [
      "Força competitiva 1 para o canal live commerce",
      "Força 2",
      "Força 3"
    ],
    "live_selling_angle": "O ângulo mais poderoso para vender esse produto ao vivo — 1 frase de impacto que a Selliver pode usar como abertura de bloco"
  }
}

Regras absolutas:
- Preços zerados se não aparecerem na página (usuário vai preencher)
- Differentials: dados concretos, nunca genérico ("boa qualidade" não serve — "15% vitamina C estabilizada" serve)
- Forbidden claims: específicos da regulação brasileira da categoria
- Allowed claims: o que é comprovável e não fere a regulação
- Tudo em português do Brasil real`;

async function fetchProductContent(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cache-Control': 'no-cache',
      },
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) return `[HTTP ${res.status} — página não acessível]`;
    const html = await res.text();

    const metaTitle = html.match(/<title[^>]*>([^<]{1,200})<\/title>/i)?.[1]?.trim() ?? '';
    const metaDesc = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']{1,500})["']/i)?.[1] ?? '';
    const ogTitle = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']{1,200})["']/i)?.[1] ?? '';
    const ogDesc = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']{1,500})["']/i)?.[1] ?? '';
    const ogPrice = html.match(/<meta[^>]*property=["']product:price:amount["'][^>]*content=["']([^"']+)["']/i)?.[1] ?? '';

    const bodyText = html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<nav[\s\S]*?<\/nav>/gi, ' ')
      .replace(/<footer[\s\S]*?<\/footer>/gi, ' ')
      .replace(/<header[\s\S]*?<\/header>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&#\d+;/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim()
      .slice(0, 3000);

    return [
      ogTitle || metaTitle ? `TÍTULO: ${ogTitle || metaTitle}` : '',
      metaDesc || ogDesc ? `DESCRIÇÃO META: ${metaDesc || ogDesc}` : '',
      ogPrice ? `PREÇO: R$ ${ogPrice}` : '',
      bodyText ? `CONTEÚDO DA PÁGINA:\n${bodyText}` : '',
    ].filter(Boolean).join('\n\n');

  } catch (e: any) {
    return `[Erro ao buscar página: ${e.message}]`;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.ADMIN_PASSWORD}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { url, extra_context } = req.body as { url: string; extra_context?: string };
  if (!url) return res.status(400).json({ error: 'url obrigatório' });

  try {
    const pageContent = await fetchProductContent(url);

    const userPrompt = [
      `URL do produto: ${url}`,
      '',
      pageContent
        ? `Conteúdo extraído da página:\n${pageContent}`
        : '(Página não acessível — analise pelo URL e use seu conhecimento sobre o tipo de produto)',
      extra_context ? `\nInformações adicionais:\n${extra_context}` : '',
      '\nRetorne o JSON completo de análise.',
    ].join('\n');

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: ANALYZER_SYSTEM,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = response.content
      .filter((c) => c.type === 'text')
      .map((c) => (c as any).text)
      .join('');

    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/(\{[\s\S]*\})/);
    if (!jsonMatch) throw new Error('Claude não retornou JSON válido');

    const analysis = JSON.parse(jsonMatch[1] ?? jsonMatch[0]);

    return res.status(200).json({
      status: 'ok',
      analysis,
      page_content_length: pageContent.length,
      meta: {
        tokens_in: response.usage?.input_tokens ?? 0,
        tokens_out: response.usage?.output_tokens ?? 0,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
}
