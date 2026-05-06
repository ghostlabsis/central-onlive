import type { NextApiRequest, NextApiResponse } from 'next';
import { generateCourseData } from '../../lib/claude';
import { FormInputSchema } from '../../lib/validation';
import { commitCourseData, triggerVercelBuild } from '../../lib/github';
import { buildCourseFromData } from '../../lib/render';
import { registerProduct } from '../../lib/registry';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.ADMIN_PASSWORD}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const form = FormInputSchema.parse(req.body);

    console.log('[generate-course] Calling Claude Master Prompt...');
    const courseData = await generateCourseData(form);
    console.log('[generate-course] Claude responded.', {
      tokens_in: courseData._meta.tokens_in,
      tokens_out: courseData._meta.tokens_out,
      cost_usd: courseData._meta.cost_usd_estimate.toFixed(4),
    });

    const filename = `${form.selliver.slug}-${form.live.date}.json`;
    console.log(`[generate-course] Committing data/${filename}...`);
    await commitCourseData(filename, courseData);

    console.log('[generate-course] Rendering 10 HTMLs...');
    const builtFiles = await buildCourseFromData(courseData);

    triggerVercelBuild().catch((e) => console.error('[generate-course] Vercel trigger failed:', e));

    const coursePath = `/${form.selliver.slug}/${form.live.date}/`;
    registerProduct({
      id: `${form.selliver.slug}-${form.live.date}`,
      name: form.hero.name,
      slug: form.selliver.slug,
      date: form.live.date,
      status: 'active',
      sellivers: [],
      course_path: coursePath,
      product_url: '',
      key_phrase: (courseData as any).hero?.key_phrase ?? '',
      category: form.hero.category,
    });

    const url = `${process.env.NEXT_PUBLIC_APP_URL}/${form.selliver.slug}/${form.live.date}/`;
    return res.status(200).json({
      status: 'ok',
      url,
      indice_url: `${url}00-INDICE.html`,
      files: builtFiles,
      meta: courseData._meta,
      message: 'Curso gerado. Vercel deploya em ~2 min.',
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
