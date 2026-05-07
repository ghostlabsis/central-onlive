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

    const baseForm = FormInputSchema.parse({
      ...req.body,
      selliver: req.body.selliver ?? {
        slug: 'default',
        name: 'default',
        level: 'iniciante',
        previous_lives: 0,
      },
    });

    const results = [];

    for (const id of sellivers_ids) {
      const selliver = getSelliverById(id);
      if (!selliver) continue;

      const formForSelliver = {
        ...baseForm,
        selliver: {
          slug: selliver.slug,
          name: selliver.nome,
          level: selliver.nivel,
          previous_lives: 0,
          whatsapp: selliver.whatsapp,
        },
      };

      console.log(`[generate-course] Calling Claude for ${selliver.nome}...`);
      const courseData = await generateCourseData(formForSelliver);
      console.log(`[generate-course] Claude responded for ${selliver.nome}.`, {
        tokens_in: courseData._meta.tokens_in,
        tokens_out: courseData._meta.tokens_out,
        cost_usd: courseData._meta.cost_usd_estimate.toFixed(4),
      });

      const filename = `${selliver.slug}-${baseForm.live.date}.json`;
      console.log(`[generate-course] Committing data/${filename}...`);
      await commitCourseData(filename, courseData);

      console.log(`[generate-course] Rendering HTMLs for ${selliver.nome}...`);
      const builtFiles = await buildCourseFromData(courseData);

      await registerProduct({
        id: `${selliver.slug}-${baseForm.live.date}`,
        name: baseForm.hero.name,
        slug: selliver.slug,
        date: baseForm.live.date,
        status: 'active',
        sellivers: [selliver.id],
        course_path: `/${selliver.slug}/${baseForm.live.date}/`,
        product_url: '',
        key_phrase: (courseData as any).hero?.key_phrase ?? '',
        category: baseForm.hero.category,
      });

      results.push({
        selliver_id: id,
        selliver_nome: selliver.nome,
        whatsapp: selliver.whatsapp,
        url: `${process.env.NEXT_PUBLIC_APP_URL}/${selliver.slug}/${baseForm.live.date}/`,
        indice_url: `${process.env.NEXT_PUBLIC_APP_URL}/${selliver.slug}/${baseForm.live.date}/00-INDICE.html`,
        files: builtFiles.files,
      });
    }

    triggerVercelBuild().catch((e) => console.error('[generate-course] Vercel trigger failed:', e));

    return res.status(200).json({
      status: 'ok',
      results,
      total_sellivers: results.length,
      message: `${results.length} curso(s) gerado(s).`,
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
