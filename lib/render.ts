import { execSync } from 'child_process';
import { writeFileSync, readFileSync, readdirSync, mkdirSync, rmSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import { tmpdir } from 'os';
import { randomUUID } from 'crypto';
import { put } from '@vercel/blob';

const ROOT = resolve(process.cwd());
const BUILD_SCRIPT = join(ROOT, 'scripts', 'build-course.js');

export interface RenderResult {
  files: string[];
  slug: string;
  date: string;
}

export async function buildCourseFromData(courseData: Record<string, unknown>): Promise<RenderResult> {
  const slug = (courseData as any).selliver?.slug;
  const date = (courseData as any).live?.date;
  if (!slug || !date) throw new Error('courseData missing selliver.slug or live.date');

  const tmpFile = join(tmpdir(), `onlive-course-${randomUUID()}.json`);
  const tmpOutBase = join(tmpdir(), `onlive-out-${randomUUID()}`);
  const tmpOutDir = join(tmpOutBase, slug, date);

  mkdirSync(tmpOutDir, { recursive: true });
  writeFileSync(tmpFile, JSON.stringify(courseData, null, 2), 'utf-8');

  try {
    execSync(`node "${BUILD_SCRIPT}" "${tmpFile}"`, {
      cwd: ROOT,
      stdio: 'pipe',
      timeout: 90_000,
      env: { ...process.env, COURSE_OUTPUT_DIR: tmpOutBase },
    });
  } finally {
    if (existsSync(tmpFile)) rmSync(tmpFile);
  }

  const fileNames = readdirSync(tmpOutDir);
  const uploadedPaths: string[] = [];

  for (const fileName of fileNames) {
    const content = readFileSync(join(tmpOutDir, fileName));
    const blobPath = `courses/${slug}/${date}/${fileName}`;
    const contentType = fileName.endsWith('.json')
      ? 'application/json'
      : 'text/html; charset=utf-8';

    await put(blobPath, content, {
      access: 'public',
      contentType,
      addRandomSuffix: false,
    });

    uploadedPaths.push(`/${slug}/${date}/${fileName}`);
  }

  rmSync(tmpOutBase, { recursive: true, force: true });

  return { files: uploadedPaths, slug, date };
}
