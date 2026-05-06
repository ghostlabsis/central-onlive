import { Octokit } from 'octokit';

function getOctokit() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error('GITHUB_TOKEN env var not set');
  return new Octokit({ auth: token });
}

function getRepo() {
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  if (!owner || !repo) throw new Error('GITHUB_OWNER or GITHUB_REPO env var not set');
  return { owner, repo };
}

export async function commitCourseData(
  filename: string,
  data: Record<string, unknown>
): Promise<void> {
  if (!process.env.GITHUB_TOKEN) {
    console.warn('[github] GITHUB_TOKEN not set — skipping GitHub commit (OK para teste local)');
    return;
  }

  const octokit = getOctokit();
  const { owner, repo } = getRepo();
  const path = `data/${filename}`;
  const content = Buffer.from(JSON.stringify(data, null, 2)).toString('base64');
  const message = `data: add course ${filename}`;

  let sha: string | undefined;
  try {
    const { data: existing } = await octokit.rest.repos.getContent({ owner, repo, path });
    if (!Array.isArray(existing) && 'sha' in existing) sha = existing.sha;
  } catch {
    // 404 = arquivo novo
  }

  await octokit.rest.repos.createOrUpdateFileContents({
    owner, repo, path, message, content, sha,
  });
}

export async function triggerVercelBuild(): Promise<void> {
  const hook = process.env.VERCEL_DEPLOY_HOOK;
  if (!hook) {
    console.warn('[github] VERCEL_DEPLOY_HOOK not set — skipping redeploy trigger (OK para teste local)');
    return;
  }
  const res = await fetch(hook, { method: 'POST' });
  if (!res.ok) throw new Error(`Vercel hook respondeu ${res.status}`);
}
