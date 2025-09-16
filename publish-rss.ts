import 'dotenv/config';
import * as fs from 'fs';
import { Octokit } from '@octokit/rest';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN!;
const GITHUB_OWNER = process.env.GITHUB_OWNER!;
const GITHUB_REPO = process.env.GITHUB_REPO!;
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'main';
const FILE_PATH = 'podcast.xml';

async function run() {
  if (!GITHUB_TOKEN) throw new Error('Missing GITHUB_TOKEN in .env');
  const octokit = new Octokit({ auth: GITHUB_TOKEN });

  const contentRaw = fs.readFileSync('./podcast.xml');
  const contentBase64 = contentRaw.toString('base64');

  let sha: string | undefined;
  try {
    const { data } = await octokit.repos.getContent({
      owner: GITHUB_OWNER, repo: GITHUB_REPO, path: FILE_PATH, ref: GITHUB_BRANCH
    });
    if (!Array.isArray(data) && 'sha' in data) sha = (data as any).sha;
  } catch (e: any) {
    if (e.status !== 404) throw e; // 404 = file doesn't exist yet
  }

  const message = sha ? 'Update RSS feed (Cursor)' : 'Create RSS feed (Cursor)';
  const res = await octokit.repos.createOrUpdateFileContents({
    owner: GITHUB_OWNER, repo: GITHUB_REPO, path: FILE_PATH,
    message, content: contentBase64, sha, branch: GITHUB_BRANCH
  });

  console.log(`✓ ${sha ? 'Updated' : 'Created'} podcast.xml`);
  console.log('Raw URL:   https://raw.githubusercontent.com/%s/%s/%s/%s', GITHUB_OWNER, GITHUB_REPO, GITHUB_BRANCH, FILE_PATH);
  console.log('Pages URL: https://%s.github.io/%s/%s', GITHUB_OWNER, GITHUB_REPO, FILE_PATH);
}

run().catch(err => { console.error('✗ Publish failed:', err?.message || err); process.exit(1); });
