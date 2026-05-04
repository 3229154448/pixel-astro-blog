export async function GET() {
  const robotsTxt = `User-agent: *\nAllow: /\nSitemap: https://pixel-astro-blog.github.io/sitemap-index.xml\n`;
  return new Response(robotsTxt, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
