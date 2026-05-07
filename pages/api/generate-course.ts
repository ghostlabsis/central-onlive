import type { NextApiRequest, NextApiResponse } from 'next';
import { generateCourseData } from '../../lib/claude';
import { FormInputSchema } from '../../lib/validation';
import { commitCourseData, triggerVercelBuild } from '../../lib/github';
import { buildCourseFromData } from '../../lib/render';
import { registerProduct } from '../../lib/registry';
import { getSelliverById } from '../../data/sellivers';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.ADMIN_PASSWORD}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const sellivers_ids: string[] = req.body.selected_sellivers ?? [];
    if (sellivers_ids.length === 0) {
      return res.status(400).json({ error: 'Selecione pelo menos 1 Selliver.' });
    }

    // Slug baseado no produto — 1 curso por produto, não por Selliver
    const productSlug = (req.body.hero?.name as string | undefined)
      ?.toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .slice(0, 40) ?? 'produto';

    const form = FormInputSchema.parse({
      ...req.body,
      selliver: {
        slug: productSlug,
        name: 'OnLive',
        level: 'iniciante' as const,
        previous_lives: 0,
        whatsapp: '',
      },
    });

    // 1 chamada Claude — independente de quantas Sellivers foram selecionadas
    console.log('[generate-course] Calling Claude Master Prompt...');
    const courseData = await generateCourseData(form);
    console.log('[generate-course] Claude responded.', {
      tokens_in: courseData._meta.tokens_in,
      tokens_out: courseData._meta.tokens_out,
      cost_usd: courseData._meta.cost_usd_estimate.toFixed(4),
    });

    const filename = `${productSlug}-${form.live.date}.json`;
    console.log(`[generate-course] Committing data/${filename}...`);
    await commitCourseData(filename, courseData);

    console.log('[generate-course] Rendering HTMLs...');
    const builtFiles = await buildCourseFromData(courseData);

    // Registra com permissão por Selliver
    await registerProduct({
      id: `${productSlug}-${form.live.date}`,
      name: form.hero.name,
      slug: productSlug,
      date: form.live.date,
      status: 'selective',
      sellivers: sellivers_ids,
      course_path: `/${productSlug}/${form.live.date}/`,
      product_url: '',
      key_phrase: (courseData as any).hero?.key_phrase ?? '',
      category: form.hero.category,
    });

    triggerVercelBuild().catch((e) => console.error('[generate-course] Vercel trigger failed:', e));

    const indice_url = `${process.env.NEXT_PUBLIC_APP_URL}/${productSlug}/${form.live.date}/00-INDICE.html`;

    // Monta lista de distribuição — mesmo link, WhatsApp diferente por Selliver
    const distribution = sellivers_ids
      .map((id) => getSelliverById(id))
      .filter(Boolean)
      .map((s) => ({
        selliver_id: s!.id,
        selliver_nome: s!.nome,
        whatsapp: s!.whatsapp,
        indice_url,
      }));

    return res.status(200).json({
      status: 'ok',
      url: `${process.env.NEXT_PUBLIC_APP_URL}/${productSlug}/${form.live.date}/`,
      indice_url,
      distribution,
      files: builtFiles.files,
      meta: courseData._meta,
      message: `Curso gerado. ${distribution.length} Selliver(s) com acesso.`,
    });
  } catch (err: any) {
    console.error('[generate-course] ERROR:', err);
    return res.status(500).json({
      status: 'error',
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
  }
}
