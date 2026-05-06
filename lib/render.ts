import { execSync } from 'child_process';
import { writeFileSync, existsSync, readdirSync, unlinkSync } from 'fs';
import { join, resolve } from 'path';
import { tmpdir } from 'os';
import { randomUUID } from 'crypto';

const ROOT = resolve(process.cwd());
const BUILD_SCRIPT = join(ROOT, 'scripts', 'build-course.js');

export interface RenderResult {
  outputDir: string;
  files: string[];
}

export async function buildCourseFromData(courseData: Record<string, unknown>): Promise<RenderResult> {
  const tmpFile = join(tmpdir(), `onlive-course-${randomUUID()}.json`);
  writeFileSync(tmpFile, JSON.stringify(courseData, null, 2), 'utf-8');

  try {
    execSync(`node "${BUILD_SCRIPT}" "${tmpFile}"`, {
      cwd: ROOT,
      stdio: 'pipe',
      timeout: 60_000,
    });
  } finally {
    if (existsSync(tmpFile)) unlinkSync(tmpFile);
  }

  const slug = (courseData as any).selliver?.slug;
  const date = (courseData as any).live?.date;
  if (!slug || !date) throw new Error('courseData missing selliver.slug or live.date');

  const outDir = join(ROOT, 'public', slug, date);
  const files = readdirSync(outDir).map((f) => `/${slug}/${date}/${f}`);

  return { outputDir: outDir, files };
}
