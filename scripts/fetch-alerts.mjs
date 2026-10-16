import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';

const gh = (...args) =>
  execFileSync('gh', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
const owner = process.argv[2];

const repos = JSON.parse(
  gh(
    'repo',
    'list',
    ...(owner ? [owner] : []),
    '--limit',
    '200',
    '--no-archived',
    '--json',
    'nameWithOwner,url',
  ),
);

const rows = repos.map(({ nameWithOwner: name, url }) => {
  let alerts = null;
  try {
    alerts = JSON.parse(
      gh('api', '--paginate', '--slurp', `repos/${name}/dependabot/alerts?state=open&per_page=100`),
    )
      .flat()
      .map((a) => ({
        url: a.html_url,
        severity: a.security_advisory.severity,
        package: a.dependency.package.name,
        summary: a.security_advisory.summary,
      }));
  } catch {}
  console.log(`${name}: ${alerts ? alerts.length : 'n/a'}`);
  return { name, url, alerts };
});

mkdirSync('public', { recursive: true });
writeFileSync(
  'public/alerts.json',
  JSON.stringify({ generatedAt: new Date().toISOString(), rows }, null, 2),
);
