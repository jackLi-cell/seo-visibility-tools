#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');
const SITE = join(ROOT, 'site');
const DATA = join(ROOT, 'data');

const DOMAIN = normalizeSiteUrl(process.env.SITE_URL, 'https://seo.jtlcook.com');
const SITE_NAME = '搜索可见性与 GSC 收录诊断工具';
const EMAIL = '1055567003@qq.com';

function normalizeSiteUrl(value, fallback) {
  const raw = String(value || fallback || '').trim().replace(/\/+$/, '');
  return raw.replace(/^http:\/\//i, 'https://');
}

const guides = JSON.parse(readFileSync(join(DATA, 'guides.json'), 'utf-8'));
const tools = JSON.parse(readFileSync(join(DATA, 'tools.json'), 'utf-8'));

let pageCount = 0;
const allPages = []; // { path, priority, type }

const TODAY = new Date().toISOString().split('T')[0];

function cleanUrl(url) {
  // /xxx/index.html -> /xxx/
  url = url.replace(/\/index\.html$/, '/');
  // /xxx.html -> /xxx
  url = url.replace(/\.html$/, '');
  return url;
}

function ensureDir(dir) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function writePage(filePath, html) {
  ensureDir(dirname(filePath));
  writeFileSync(filePath, html, 'utf-8');
  pageCount++;
}

function getPrefix(canonicalPath) {
  const parts = canonicalPath.split('/').filter(Boolean);
  const depth = canonicalPath.endsWith('/') ? parts.length : Math.max(0, parts.length - 1);
  if (depth === 0) return './';
  return '../'.repeat(depth);
}

function relativize(html, prefix) {
  // Replace href="/" with href to index
  html = html.replace(/href="\/"/g, `href="${prefix}index.html"`);
  // Replace href="/#xxx" (root with hash) with href="${prefix}index.html#xxx"
  html = html.replace(/href="\/(#[^"]+)"/g, (match, hash) => `href="${prefix}index.html${hash}"`);
  // Replace href="/xxx/" (directory links) with href="${prefix}xxx/index.html"
  html = html.replace(/href="\/([^"]*\/)"/g, (match, path) => `href="${prefix}${path}index.html"`);
  // Replace href="/xxx" (file links) with href="${prefix}xxx"
  html = html.replace(/href="\/([^"]+)"/g, (match, path) => `href="${prefix}${path}"`);
  // Replace src="/xxx" with src="${prefix}xxx"
  html = html.replace(/src="\/([^"]+)"/g, (match, path) => `src="${prefix}${path}"`);
  return html;
}

// --- JSON-LD Generators ---
function jsonLdWebSite() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: DOMAIN + '/',
    description: '页面没被收录？通过诊断向导定位问题，使用本地工具检查配置，按指南逐步修复。',
    potentialAction: {
      '@type': 'SearchAction',
      target: DOMAIN + '/?q={search_term_string}',
      'query-input': 'required name=search_term_string'
    }
  };
}

function jsonLdArticle(title, description, slug) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description: description,
    datePublished: '2024-01-15',
    dateModified: TODAY,
    author: { '@type': 'Organization', name: SITE_NAME },
    publisher: { '@type': 'Organization', name: SITE_NAME },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${DOMAIN}/guides/${slug}` }
  };
}

function jsonLdFAQPage(faqItems) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map(item => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer }
    }))
  };
}

function jsonLdWebApplication(name, description, url) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: name,
    description: description,
    url: cleanUrl(url),
    applicationCategory: 'SEO Tool',
    operatingSystem: 'Web Browser',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }
  };
}

function jsonLdBreadcrumb(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: cleanUrl(item.url)
    }))
  };
}

function renderJsonLd(schemas) {
  if (!schemas || schemas.length === 0) return '';
  return schemas.map(s =>
    `<script type="application/ld+json">${JSON.stringify(s)}</script>`
  ).join('\n');
}

// --- Layout with SEO enhancements ---
function layout(title, description, canonicalPath, bodyContent, options = {}) {
  const canonical = DOMAIN + cleanUrl(canonicalPath);
  const prefix = getPrefix(canonicalPath);
  const processedBody = relativize(bodyContent, prefix);
  const priority = options.priority || 0.5;
  const pageType = options.pageType || 'other';
  allPages.push({ path: canonicalPath, priority, type: pageType });

  // Open Graph tags
  const ogType = options.ogType || 'website';
  const ogTags = `<meta property="og:title" content="${title} - ${SITE_NAME}">
<meta property="og:description" content="${description}">
<meta property="og:url" content="${canonical}">
<meta property="og:type" content="${ogType}">
<meta property="og:site_name" content="${SITE_NAME}">`;

  // JSON-LD structured data
  const jsonLdHtml = renderJsonLd(options.schemas || []);

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} - ${SITE_NAME}</title>
<meta name="description" content="${description}">
<link rel="canonical" href="${canonical}">
<link rel="icon" type="image/svg+xml" href="${prefix}favicon.svg">
${ogTags}
${jsonLdHtml}
<link rel="stylesheet" href="${prefix}assets/styles.css">
</head>
<body>
<header class="site-header">
<div class="container">
<a href="${prefix}index.html" class="logo">${SITE_NAME}</a>
<nav>
<a href="${prefix}index.html">首页</a>
<a href="${prefix}diagnose/wizard.html">诊断向导</a>
<a href="${prefix}index.html#tools">工具</a>
<a href="${prefix}index.html#guides">指南</a>
<a href="${prefix}pages/about.html">关于</a>
</nav>
</div>
</header>
<main class="container">
${processedBody}
</main>
<footer class="site-footer">
<div class="container">
<div>&copy; 2024 ${SITE_NAME}</div>
<div>
<a href="${prefix}pages/about.html">关于</a> &middot;
<a href="${prefix}pages/contact.html">联系</a> &middot;
<a href="${prefix}pages/privacy.html">隐私</a> &middot;
<a href="${prefix}pages/disclaimer.html">免责声明</a>
</div>
</div>
</footer>
<script src="${prefix}assets/app.js"></script>
</body>
</html>`;
}

// === Guide Content ===
const guideContent = {
'discovered-not-indexed': `
<h2>什么是"已发现但未编入索引"</h2>
<p>Google Search Console 中显示 "Discovered - currently not indexed" 表示 Google 知道这个 URL 存在，但还没有去抓取它。通常意味着 Google 认为这个页面的优先级不够高。</p>
<h2>常见原因</h2>
<ul>
<li>站点抓取预算不足，Google 优先抓取更重要的页面</li>
<li>页面缺少内链支撑，被认为不重要</li>
<li>新站点或新页面，Google 还没来得及抓取</li>
<li>服务器响应慢，Google 降低了抓取频率</li>
<li>页面内容薄弱，Google 预判价值不高</li>
<li>Sitemap 中 URL 过多，稀释了优先级</li>
</ul>
<h2>排查步骤</h2>
<ol class="step-list">
<li>在 GSC 中确认 URL 状态确实是 "Discovered - currently not indexed"</li>
<li>检查页面是否有足够的内链指向（至少 2-3 个内链）</li>
<li>确认页面在 sitemap 中，且 sitemap 已提交给 Google</li>
<li>检查服务器响应时间，确保 TTFB 小于 500ms</li>
<li>确认 robots.txt 没有屏蔽该 URL</li>
<li>检查页面内容是否有实质价值</li>
<li>使用 GSC 的 URL 检查工具请求编入索引</li>
<li>等待 1-2 周后再次检查状态变化</li>
</ol>
<h2>修复方法</h2>
<ul>
<li>增加从高权重页面到该页面的内链</li>
<li>精简 sitemap，只保留高质量页面</li>
<li>提升页面内容质量和独特性</li>
<li>优化服务器性能，减少响应时间</li>
<li>在 GSC 中手动请求索引</li>
</ul>
<h2>验证方法</h2>
<p>修复后在 GSC URL 检查工具中重新提交，观察 1-2 周内状态是否变化。也可以通过 site:yoururl 搜索确认是否已收录。</p>`,

'crawled-not-indexed': `
<h2>什么是"已抓取但未编入索引"</h2>
<p>"Crawled - currently not indexed" 表示 Google 已经抓取了页面内容，但决定不将其加入索引。这比"已发现未索引"更严重，因为 Google 看过内容后主动选择不收录。</p>
<h2>常见原因</h2>
<ul>
<li>内容质量不足或内容过薄</li>
<li>与站内其他页面内容重复或高度相似</li>
<li>页面是自动生成的低价值内容</li>
<li>缺少 E-E-A-T 信号（经验、专业性、权威性、可信度）</li>
<li>页面用户体验差</li>
<li>站点整体质量评分不高</li>
</ul>
<h2>排查步骤</h2>
<ol class="step-list">
<li>在 GSC URL 检查中确认状态和上次抓取时间</li>
<li>对比该页面与已收录页面的内容差异</li>
<li>检查是否存在站内重复内容</li>
<li>评估页面字数和信息密度（建议大于 800 字有实质内容）</li>
<li>检查页面是否有独特价值</li>
<li>确认页面有正确的 canonical 自指</li>
<li>检查页面加载后的实际渲染内容</li>
</ol>
<h2>修复方法</h2>
<ul>
<li>大幅提升内容质量：增加原创分析、数据、案例</li>
<li>合并相似页面，用 301 重定向指向最佳版本</li>
<li>添加结构化数据增强页面信号</li>
<li>增加作者信息和发布/更新日期</li>
<li>获取外部链接提升页面权威性</li>
</ul>
<h2>验证方法</h2>
<p>内容优化后重新请求索引。如果 2-4 周后仍未收录，考虑该页面是否应该合并到其他页面中。</p>`,

'server-error-5xx': `
<h2>什么是 5xx 服务器错误</h2>
<p>GSC 报告 5xx 错误表示 Googlebot 在抓取时收到了服务器错误响应。常见的有 500（内部错误）、502（网关错误）、503（服务不可用）、504（网关超时）。</p>
<h2>如何定位具体 URL</h2>
<ul>
<li>GSC - 索引 - 页面 - 筛选"服务器错误 (5xx)"</li>
<li>导出完整 URL 列表进行批量检查</li>
<li>检查服务器访问日志中 Googlebot 的请求记录</li>
<li>使用 curl 命令模拟抓取：<code>curl -I -A "Googlebot" URL</code></li>
</ul>
<h2>常见原因</h2>
<ul>
<li>服务器资源不足（CPU/内存/连接数耗尽）</li>
<li>应用代码错误（未处理的异常）</li>
<li>数据库连接超时或查询过慢</li>
<li>CDN 或反向代理配置错误</li>
<li>服务器对爬虫限流过于激进</li>
<li>SSL 证书问题导致 HTTPS 握手失败</li>
</ul>
<h2>修复方法</h2>
<ol class="step-list">
<li>检查服务器错误日志，定位具体错误信息</li>
<li>确认服务器资源是否充足</li>
<li>检查是否有针对爬虫的限流规则过于严格</li>
<li>优化慢查询和耗时操作</li>
<li>配置合理的超时时间和重试机制</li>
<li>确保 CDN 回源配置正确</li>
</ol>
<h2>验证方法</h2>
<p>修复后使用 GSC URL 检查工具测试实时抓取，确认返回 200。持续监控 GSC 抓取统计报告。</p>`,

'sitemap-best-practices': `
<h2>Sitemap 的作用</h2>
<p>Sitemap 告诉搜索引擎你的站点有哪些页面值得抓取和收录。它不是保证收录的手段，而是一个发现机制。</p>
<h2>应该放入 Sitemap 的页面</h2>
<ul>
<li>所有希望被收录的公开页面</li>
<li>返回 200 状态码的页面</li>
<li>有 canonical 自指的页面</li>
<li>没有 noindex 的页面</li>
<li>有实质内容的页面</li>
</ul>
<h2>不应该放入 Sitemap 的内容</h2>
<ul>
<li>非 HTML 文件（PDF、图片用媒体 sitemap）</li>
<li>带参数的重复 URL</li>
<li>已设置 noindex 的页面</li>
<li>301/302 重定向的源 URL</li>
<li>返回 4xx/5xx 的 URL</li>
<li>低质量标签页、空分类页</li>
<li>内部搜索结果页</li>
<li>需要登录的页面</li>
</ul>
<h2>首批提交规则</h2>
<ol class="step-list">
<li>新站首次提交不超过 1000 个 URL</li>
<li>优先提交最重要、内容最充实的页面</li>
<li>确保每个 URL 都能正常访问（200 状态码）</li>
<li>使用 lastmod 标注真实的最后修改时间</li>
<li>提交后在 GSC 中监控索引覆盖率变化</li>
<li>根据收录情况逐步增加 URL</li>
</ol>
<h2>Sitemap 格式示例</h2>
<pre><code>&lt;?xml version="1.0" encoding="UTF-8"?&gt;
&lt;urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"&gt;
  &lt;url&gt;
    &lt;loc&gt;https://example.com/page&lt;/loc&gt;
    &lt;lastmod&gt;2024-01-15&lt;/lastmod&gt;
  &lt;/url&gt;
&lt;/urlset&gt;</code></pre>
<h2>验证方法</h2>
<p>使用 <a href="/tools/sitemap-audit.html">Sitemap 审计工具</a> 检查你的 URL 列表。</p>`,

'self-referencing-canonical': `
<h2>什么是 Canonical 自指</h2>
<p>Canonical 自指是指页面的 <code>&lt;link rel="canonical"&gt;</code> 标签指向自己的 URL。这明确告诉搜索引擎："这个 URL 是此内容的正式版本"。</p>
<h2>为什么需要自指</h2>
<ul>
<li>防止带参数的 URL 被当作独立页面</li>
<li>明确声明内容归属，避免被判定为重复</li>
<li>统一链接权重到正式 URL</li>
<li>处理 HTTP/HTTPS、www/non-www 的变体</li>
</ul>
<h2>常见错误</h2>
<ul>
<li>所有页面 canonical 都指向首页（最常见的严重错误）</li>
<li>canonical 使用相对路径而非绝对 URL</li>
<li>canonical URL 与实际 URL 的协议不一致</li>
<li>canonical 指向 404 页面</li>
<li>canonical 指向重定向链中的 URL</li>
<li>动态页面 canonical 包含会话参数</li>
</ul>
<h2>正确配置示例</h2>
<pre><code>&lt;!-- 正确：自指 --&gt;
&lt;link rel="canonical" href="https://example.com/blog/my-post"&gt;

&lt;!-- 错误：指向首页 --&gt;
&lt;link rel="canonical" href="https://example.com/"&gt;

&lt;!-- 错误：相对路径 --&gt;
&lt;link rel="canonical" href="/blog/my-post"&gt;</code></pre>
<h2>验证方法</h2>
<p>使用 <a href="/tools/canonical-checker.html">Canonical 检查器</a> 验证你的 canonical 配置。</p>`,

'nextjs-canonical': `
<h2>Next.js App Router 中的 Canonical</h2>
<p>Next.js 13+ App Router 使用 metadata API 来设置页面的 canonical URL。配置不当是导致收录问题的常见原因。</p>
<h2>常见原因</h2>
<ul>
<li>忘记在 generateMetadata 中设置 canonical</li>
<li>使用 process.env.NEXT_PUBLIC_URL 但环境变量未设置</li>
<li>canonical 中包含查询参数或 hash</li>
<li>开发环境用 localhost，生产环境忘记改</li>
<li>动态路由中 canonical 没有包含实际的 slug</li>
</ul>
<h2>排查步骤</h2>
<ol class="step-list">
<li>查看部署后页面源码，搜索 rel="canonical" 确认输出</li>
<li>检查 canonical URL 是否为完整的绝对路径（含 https://）</li>
<li>确认动态路由页面的 canonical 包含正确的 slug 参数</li>
<li>检查 metadataBase 是否在 layout.tsx 中正确设置</li>
<li>验证环境变量 NEXT_PUBLIC_URL 在生产环境中有值</li>
<li>对比开发环境和生产环境的 canonical 输出</li>
<li>检查是否有中间件或插件覆盖了 canonical 设置</li>
</ol>
<h2>静态 Metadata 配置</h2>
<pre><code>// app/blog/[slug]/page.tsx
export const metadata = {
  alternates: {
    canonical: 'https://example.com/blog/my-post',
  },
};</code></pre>
<h2>动态 generateMetadata</h2>
<pre><code>// app/blog/[slug]/page.tsx
export async function generateMetadata({ params }) {
  const slug = params.slug;
  return {
    title: '文章标题',
    alternates: {
      canonical: 'https://example.com/blog/' + slug,
    },
  };
}</code></pre>
<h2>Layout 级别的默认配置</h2>
<pre><code>// app/layout.tsx
export const metadata = {
  metadataBase: new URL('https://example.com'),
};
// 设置 metadataBase 后，canonical 可以使用相对路径</code></pre>
<h2>修复方法</h2>
<ul>
<li>在 app/layout.tsx 中设置 metadataBase 为生产域名</li>
<li>为每个动态路由页面实现 generateMetadata</li>
<li>确保环境变量在所有部署环境中正确配置</li>
<li>使用 Next.js 的 metadata 验证工具检查输出</li>
<li>在 CI/CD 中添加 canonical 检查步骤</li>
</ul>
<h2>验证方法</h2>
<p>部署后查看页面源码，确认 canonical 输出了正确的完整 URL。使用 <a href="/tools/canonical-checker.html">Canonical 检查器</a> 验证。</p>`,

'robots-noindex': `
<h2>Robots.txt 基础</h2>
<p>robots.txt 是放在网站根目录的文本文件，告诉爬虫哪些路径可以抓取、哪些不可以。注意：robots.txt 只是建议，不是强制屏蔽。</p>
<h2>Robots.txt 语法</h2>
<pre><code># 允许所有爬虫访问所有内容
User-agent: *
Allow: /

# 屏蔽特定目录
User-agent: *
Disallow: /admin/
Disallow: /private/

# 指定 Sitemap 位置
Sitemap: https://example.com/sitemap.xml</code></pre>
<h2>Meta Robots 标签</h2>
<pre><code>&lt;!-- 不收录此页面 --&gt;
&lt;meta name="robots" content="noindex"&gt;

&lt;!-- 不收录且不跟踪链接 --&gt;
&lt;meta name="robots" content="noindex, nofollow"&gt;</code></pre>
<h2>X-Robots-Tag HTTP 头</h2>
<pre><code>X-Robots-Tag: noindex
X-Robots-Tag: noindex, nofollow</code></pre>
<h2>常见误屏蔽场景</h2>
<ul>
<li>robots.txt 中 Disallow: / 屏蔽了整站</li>
<li>测试环境的 noindex 标签被带到了生产环境</li>
<li>CMS 的"阻止搜索引擎索引"选项被勾选</li>
<li>CDN 或服务器配置添加了全局 X-Robots-Tag</li>
<li>框架默认给某些路由加了 noindex</li>
</ul>
<h2>排查步骤</h2>
<ol class="step-list">
<li>访问 /robots.txt 检查是否有过度屏蔽</li>
<li>查看页面源码搜索 "noindex"</li>
<li>用开发者工具检查响应头中的 X-Robots-Tag</li>
<li>检查 CMS 后台的 SEO 设置</li>
<li>确认 CDN 配置没有添加额外的 robots 头</li>
</ol>
<h2>验证方法</h2>
<p>使用 <a href="/tools/robots-checker.html">Robots 检查器</a> 粘贴你的 robots.txt 或 meta 标签进行检查。</p>`,

'html-readability': `
<h2>为什么初始 HTML 很重要</h2>
<p>搜索引擎首次抓取页面时，主要读取服务器返回的初始 HTML。虽然 Google 可以执行 JavaScript，但这需要额外的抓取资源和时间，且不保证完整渲染。</p>
<h2>初始 HTML 必须包含什么</h2>
<ul class="checklist">
<li>完整的 title 标签（不是 JS 动态设置的）</li>
<li>meta description 标签</li>
<li>至少一个 H1 标签包含页面主题</li>
<li>页面核心正文内容（不依赖 JS 加载）</li>
<li>canonical 标签</li>
<li>结构化数据（JSON-LD）</li>
<li>内部导航链接</li>
</ul>
<h2>JS 渲染问题</h2>
<ul>
<li>SPA 没有 SSR/SSG，初始 HTML 只有空 div</li>
<li>内容通过 AJAX 异步加载</li>
<li>关键内容在 JS 执行后才插入 DOM</li>
<li>使用 client-side routing，服务器对所有路由返回相同 HTML</li>
</ul>
<h2>解决方案</h2>
<ul>
<li>使用 SSR（服务端渲染）或 SSG（静态生成）</li>
<li>确保关键内容在初始 HTML 中可见</li>
<li>使用 Next.js、Nuxt.js 等支持 SSR 的框架</li>
<li>对纯客户端应用考虑预渲染方案</li>
</ul>
<h2>检查方法</h2>
<pre><code># 查看初始 HTML（不执行 JS）
curl -s https://example.com/page | grep -i "h1\|title\|description"</code></pre>
<h2>验证方法</h2>
<p>使用 <a href="/tools/html-checker.html">HTML 可读性检查工具</a> 粘贴你的页面源码进行检查。</p>`,

'ai-search-readability': `
<h2>AI 搜索引擎如何理解页面</h2>
<p>AI 搜索引擎（如 ChatGPT 搜索、Perplexity、Google AI Overview）与传统搜索引擎不同。它们需要从页面中提取可直接引用的答案，而不只是匹配关键词。</p>
<h2>AI 搜索引擎看重什么</h2>
<ul>
<li>清晰的内容结构（标题层级、段落分明）</li>
<li>可直接提取的答案（定义、步骤、列表）</li>
<li>权威性信号（作者、来源、更新日期）</li>
<li>结构化数据（JSON-LD，特别是 FAQ）</li>
<li>内容的时效性（dateModified）</li>
<li>足够的内容深度</li>
</ul>
<h2>优化方法</h2>
<ol class="step-list">
<li>每个页面有且只有一个 H1，清晰表达主题</li>
<li>使用 H2/H3 组织内容层级</li>
<li>在正文开头提供简洁的摘要或定义</li>
<li>使用有序列表呈现步骤，无序列表呈现要点</li>
<li>添加 FAQ 结构化数据</li>
<li>标注作者信息和最后更新日期</li>
<li>确保正文超过 300 字</li>
<li>添加内链到相关内容</li>
</ol>
<h2>评分标准</h2>
<div class="table-wrap"><table>
<tr><th>检查项</th><th>分值</th><th>说明</th></tr>
<tr><td>有 H1</td><td>15</td><td>页面主题明确</td></tr>
<tr><td>有 meta description</td><td>10</td><td>摘要可被引用</td></tr>
<tr><td>有 FAQ 结构化数据</td><td>15</td><td>问答可直接提取</td></tr>
<tr><td>有 author</td><td>5</td><td>内容有归属</td></tr>
<tr><td>有 dateModified</td><td>10</td><td>内容有时效性</td></tr>
<tr><td>正文 &gt; 300 字</td><td>15</td><td>内容有深度</td></tr>
<tr><td>有 JSON-LD</td><td>10</td><td>机器可读</td></tr>
<tr><td>有内链</td><td>10</td><td>主题关联</td></tr>
<tr><td>无 noindex</td><td>10</td><td>允许索引</td></tr>
</table></div>
<h2>验证方法</h2>
<p>使用 <a href="/tools/ai-readability-scorer.html">AI 搜索可读性评分器</a> 检查你的页面得分。</p>`,

'structured-data': `
<h2>什么是结构化数据</h2>
<p>结构化数据是用标准格式（通常是 JSON-LD）向搜索引擎描述页面内容的方式。它帮助搜索引擎理解页面的类型、内容和关系。</p>
<h2>常见原因（结构化数据问题）</h2>
<ul>
<li>JSON 格式错误（缺少逗号、引号不匹配）</li>
<li>使用了不存在的 schema 类型或属性</li>
<li>结构化数据内容与页面可见内容不一致</li>
<li>缺少必需属性</li>
<li>日期格式不正确（应使用 ISO 8601）</li>
</ul>
<h2>排查步骤</h2>
<ol class="step-list">
<li>查看页面源码，找到所有 script type="application/ld+json" 标签</li>
<li>将 JSON-LD 内容粘贴到 JSON 验证器中检查格式</li>
<li>使用 Google 富媒体搜索结果测试工具验证 schema 有效性</li>
<li>对比结构化数据中的内容与页面可见内容是否一致</li>
<li>检查是否缺少必需属性（如 Article 需要 headline、author）</li>
<li>确认日期格式为 ISO 8601（如 2024-01-15）</li>
<li>验证 URL 字段使用绝对路径而非相对路径</li>
</ol>
<h2>JSON-LD 基础</h2>
<pre><code>&lt;script type="application/ld+json"&gt;
{
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "页面标题",
  "description": "页面描述",
  "dateModified": "2024-01-15",
  "author": {
    "@type": "Person",
    "name": "作者名"
  }
}
&lt;/script&gt;</code></pre>
<h2>FAQPage 结构化数据</h2>
<pre><code>&lt;script type="application/ld+json"&gt;
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "问题1？",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "答案1"
      }
    }
  ]
}
&lt;/script&gt;</code></pre>
<h2>WebApplication 结构化数据</h2>
<pre><code>&lt;script type="application/ld+json"&gt;
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "工具名称",
  "description": "工具描述",
  "applicationCategory": "SEO Tool",
  "operatingSystem": "Web Browser",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  }
}
&lt;/script&gt;</code></pre>
<h2>修复方法</h2>
<ul>
<li>使用在线 JSON 验证器修复格式错误</li>
<li>参考 schema.org 官方文档确认属性名称</li>
<li>确保结构化数据与页面可见内容完全一致</li>
<li>添加所有必需属性，补充推荐属性</li>
<li>统一使用 ISO 8601 日期格式</li>
</ul>
<h2>验证方法</h2>
<p>使用 <a href="/tools/html-checker.html">HTML 可读性检查工具</a> 检查 JSON-LD 格式是否有效。也可以使用 Google 的富媒体搜索结果测试工具在线验证。</p>`,

'bing-vs-gsc': `
<h2>Bing Webmaster Tools 与 GSC 概述</h2>
<p>Bing Webmaster Tools（BWT）和 Google Search Console（GSC）是两大搜索引擎提供的站长工具。虽然功能类似，但在数据展示、收录机制和优化建议上有显著差异。</p>
<h2>常见原因（只关注 GSC 忽略 BWT）</h2>
<ul>
<li>认为 Bing 流量占比小不值得优化</li>
<li>不了解 BWT 独有的功能（如 IndexNow、URL 提交配额更高）</li>
<li>两个平台的收录状态报告格式不同，难以对比</li>
<li>BWT 的 SEO 报告提供了 GSC 没有的具体建议</li>
</ul>
<h2>排查步骤</h2>
<ol class="step-list">
<li>注册并验证 Bing Webmaster Tools 账号（支持直接导入 GSC 数据）</li>
<li>对比两个平台的索引覆盖率数据，找出差异页面</li>
<li>检查 BWT 的 SEO 报告中列出的具体问题</li>
<li>查看 BWT 的抓取信息，确认 Bingbot 的抓取频率</li>
<li>使用 BWT 的 URL 检查工具测试具体页面</li>
<li>检查 robots.txt 是否对 Bingbot 有特殊限制</li>
<li>确认 sitemap 已在 BWT 中提交</li>
</ol>
<h2>功能对比</h2>
<div class="table-wrap"><table>
<tr><th>功能</th><th>Google Search Console</th><th>Bing Webmaster Tools</th></tr>
<tr><td>URL 提交</td><td>每天约 10 条（URL 检查）</td><td>每天最多 10,000 条</td></tr>
<tr><td>IndexNow 支持</td><td>不支持</td><td>原生支持</td></tr>
<tr><td>SEO 建议</td><td>无具体建议</td><td>提供页面级 SEO 建议</td></tr>
<tr><td>反向链接</td><td>有（采样数据）</td><td>有（更详细）</td></tr>
<tr><td>关键词研究</td><td>无</td><td>内置关键词研究工具</td></tr>
<tr><td>站点扫描</td><td>无</td><td>内置站点扫描和 SEO 审计</td></tr>
</table></div>
<h2>修复方法</h2>
<ul>
<li>同时在两个平台提交 sitemap</li>
<li>利用 BWT 的高配额 URL 提交加速新页面收录</li>
<li>根据 BWT SEO 报告修复列出的问题</li>
<li>配置 IndexNow 实现内容更新即时通知</li>
<li>定期对比两个平台的数据差异</li>
</ul>
<h2>验证方法</h2>
<p>在 BWT 中使用 URL 检查工具确认页面状态。对比 GSC 和 BWT 的索引覆盖率报告，确保两个平台的收录数据趋于一致。</p>`,

'indexnow-protocol': `
<h2>什么是 IndexNow</h2>
<p>IndexNow 是一个开放协议，允许网站主动通知搜索引擎内容已更新。支持 IndexNow 的搜索引擎包括 Bing、Yandex、Seznam 和 Naver。Google 目前不支持但在评估中。</p>
<h2>常见原因（收录延迟）</h2>
<ul>
<li>依赖搜索引擎自然发现，没有主动通知机制</li>
<li>Sitemap 更新频率低，搜索引擎不知道内容已变化</li>
<li>新页面发布后没有任何推送动作</li>
<li>不了解 IndexNow 可以显著加速 Bing 收录</li>
</ul>
<h2>排查步骤</h2>
<ol class="step-list">
<li>确认网站是否已配置 IndexNow（检查根目录是否有 key 文件）</li>
<li>生成 IndexNow API key（32 位十六进制字符串）</li>
<li>将 key 文件放置在网站根目录（如 /abc123.txt）</li>
<li>测试 API 调用是否返回 200 状态码</li>
<li>检查 CMS 或部署流程是否集成了 IndexNow 推送</li>
<li>验证推送的 URL 列表是否正确</li>
</ol>
<h2>配置方法</h2>
<pre><code># 1. 生成 key 文件
echo "your-api-key-here" > public/your-api-key-here.txt

# 2. 单个 URL 推送
curl "https://api.indexnow.org/indexnow?url=https://example.com/new-page&key=your-api-key-here"

# 3. 批量推送（POST 请求）
curl -X POST "https://api.indexnow.org/indexnow" \\
  -H "Content-Type: application/json" \\
  -d '{
    "host": "example.com",
    "key": "your-api-key-here",
    "urlList": [
      "https://example.com/page1",
      "https://example.com/page2"
    ]
  }'</code></pre>
<h2>CMS 集成</h2>
<ul>
<li>WordPress：安装 IndexNow 官方插件</li>
<li>Next.js：在 build 后脚本中调用 API</li>
<li>Hugo/Jekyll：在 CI/CD 部署后触发推送</li>
<li>自定义 CMS：在内容发布 hook 中集成</li>
</ul>
<h2>修复方法</h2>
<ul>
<li>生成 API key 并放置验证文件</li>
<li>在内容发布流程中集成 IndexNow 推送</li>
<li>批量推送已有但未收录的页面</li>
<li>设置自动化：每次部署后自动推送变更 URL</li>
</ul>
<h2>验证方法</h2>
<p>推送后在 Bing Webmaster Tools 中查看 URL 提交记录。通常 Bing 会在几小时内抓取推送的 URL。使用 <a href="/tools/sitemap-audit.html">Sitemap 审计工具</a> 检查 URL 列表格式。</p>`,

'core-web-vitals': `
<h2>什么是 Core Web Vitals</h2>
<p>Core Web Vitals（核心网页指标）是 Google 用来衡量用户体验的三个关键指标：LCP（最大内容绘制）、INP（交互到下一次绘制）和 CLS（累积布局偏移）。这些指标直接影响搜索排名。</p>
<h2>常见原因（指标不达标）</h2>
<ul>
<li>LCP 过慢：大图片未优化、服务器响应慢、渲染阻塞资源多</li>
<li>INP 过高：JavaScript 执行时间长、主线程阻塞、事件处理器复杂</li>
<li>CLS 过大：图片/广告没有预留尺寸、动态内容插入、字体加载闪烁</li>
<li>第三方脚本拖慢页面性能</li>
<li>未使用 CDN 或缓存策略不当</li>
</ul>
<h2>排查步骤</h2>
<ol class="step-list">
<li>在 GSC 的 Core Web Vitals 报告中查看整站状态</li>
<li>使用 PageSpeed Insights 测试具体页面得分</li>
<li>在 Chrome DevTools Performance 面板录制页面加载</li>
<li>检查 LCP 元素是什么（通常是首屏大图或标题）</li>
<li>分析 INP 最差的交互是哪个（点击、输入等）</li>
<li>使用 Layout Shift Debugger 定位 CLS 来源</li>
<li>检查第三方脚本对性能的影响</li>
</ol>
<h2>达标阈值</h2>
<div class="table-wrap"><table>
<tr><th>指标</th><th>良好</th><th>需改进</th><th>差</th></tr>
<tr><td>LCP</td><td>&le; 2.5s</td><td>2.5s - 4.0s</td><td>&gt; 4.0s</td></tr>
<tr><td>INP</td><td>&le; 200ms</td><td>200ms - 500ms</td><td>&gt; 500ms</td></tr>
<tr><td>CLS</td><td>&le; 0.1</td><td>0.1 - 0.25</td><td>&gt; 0.25</td></tr>
</table></div>
<h2>修复方法</h2>
<ul>
<li>LCP：压缩图片、使用 WebP/AVIF、预加载关键资源、优化 TTFB</li>
<li>INP：拆分长任务、使用 Web Worker、延迟非关键 JS</li>
<li>CLS：为图片/视频设置 width/height、避免动态插入内容、使用 font-display: swap</li>
<li>启用 CDN 和浏览器缓存</li>
<li>延迟加载非首屏资源</li>
</ul>
<h2>验证方法</h2>
<p>修复后使用 PageSpeed Insights 重新测试。注意 CrUX 数据（真实用户数据）需要 28 天才能更新。GSC 报告也会在数据积累后反映改善。</p>`,

'hreflang-check': `
<h2>什么是 hreflang</h2>
<p>hreflang 是一个 HTML 属性，告诉搜索引擎页面有哪些语言/地区版本。正确配置可以避免多语言页面互相竞争排名，确保用户看到正确语言的页面。</p>
<h2>常见原因（hreflang 配置错误）</h2>
<ul>
<li>hreflang 标签缺少自引用（每个页面必须包含指向自己的 hreflang）</li>
<li>语言代码格式错误（应使用 ISO 639-1，如 zh 而非 chinese）</li>
<li>缺少 x-default 标签</li>
<li>hreflang 不是双向的（A 指向 B，但 B 没有指向 A）</li>
<li>URL 使用相对路径而非绝对路径</li>
</ul>
<h2>排查步骤</h2>
<ol class="step-list">
<li>查看页面源码中所有 link rel="alternate" hreflang 标签</li>
<li>确认每个页面都有自引用的 hreflang 标签</li>
<li>验证语言代码格式正确（zh-CN、en-US、ja 等）</li>
<li>检查所有 hreflang 是否双向对应</li>
<li>确认存在 x-default 标签指向默认版本</li>
<li>验证 hreflang 中的 URL 都返回 200 且没有重定向</li>
<li>检查 sitemap 中是否也包含了 hreflang 信息</li>
</ol>
<h2>正确配置示例</h2>
<pre><code>&lt;!-- 中文页面 (zh-CN) --&gt;
&lt;link rel="alternate" hreflang="zh-CN" href="https://example.com/zh/page" /&gt;
&lt;link rel="alternate" hreflang="en" href="https://example.com/en/page" /&gt;
&lt;link rel="alternate" hreflang="ja" href="https://example.com/ja/page" /&gt;
&lt;link rel="alternate" hreflang="x-default" href="https://example.com/en/page" /&gt;

&lt;!-- Sitemap 中的 hreflang --&gt;
&lt;url&gt;
  &lt;loc&gt;https://example.com/zh/page&lt;/loc&gt;
  &lt;xhtml:link rel="alternate" hreflang="zh-CN" href="https://example.com/zh/page"/&gt;
  &lt;xhtml:link rel="alternate" hreflang="en" href="https://example.com/en/page"/&gt;
&lt;/url&gt;</code></pre>
<h2>修复方法</h2>
<ul>
<li>为每个语言版本页面添加完整的 hreflang 标签集</li>
<li>确保所有 hreflang 关系是双向的</li>
<li>添加 x-default 指向默认语言版本</li>
<li>使用绝对 URL，确保协议和域名一致</li>
<li>在 sitemap 中也声明 hreflang 关系</li>
</ul>
<h2>验证方法</h2>
<p>使用 <a href="/tools/html-checker.html">HTML 可读性检查工具</a> 检查 hreflang 标签格式。在 GSC 中查看国际定位报告，确认没有 hreflang 错误。</p>`,

'js-rendering-seo': `
<h2>搜索引擎如何处理 JavaScript</h2>
<p>Google 使用两阶段索引：先抓取初始 HTML，再将页面放入渲染队列执行 JavaScript。渲染队列可能有数天延迟，且不保证完整执行所有 JS。Bing 对 JS 渲染的支持更有限。</p>
<h2>常见原因（JS 渲染导致收录问题）</h2>
<ul>
<li>SPA（单页应用）初始 HTML 只有空 div，内容完全依赖 JS</li>
<li>关键内容通过 AJAX/fetch 异步加载</li>
<li>使用 client-side routing，服务器对所有路由返回相同 HTML shell</li>
<li>JS 执行依赖用户交互（如滚动加载）</li>
<li>第三方 JS 错误导致页面渲染失败</li>
</ul>
<h2>排查步骤</h2>
<ol class="step-list">
<li>使用 curl 获取页面初始 HTML，检查是否包含核心内容</li>
<li>在 GSC URL 检查工具中对比"已抓取的页面"和"实时测试"</li>
<li>禁用浏览器 JavaScript 后访问页面，观察可见内容</li>
<li>检查 Google 缓存版本是否包含完整内容</li>
<li>查看 GSC 抓取统计中的渲染错误</li>
<li>使用 Chrome DevTools 的 Coverage 面板分析 JS 依赖</li>
<li>检查是否有 JS 错误阻止页面正常渲染</li>
</ol>
<h2>渲染方案对比</h2>
<div class="table-wrap"><table>
<tr><th>方案</th><th>SEO 友好度</th><th>首屏速度</th><th>适用场景</th></tr>
<tr><td>SSG（静态生成）</td><td>最佳</td><td>最快</td><td>内容不频繁变化的页面</td></tr>
<tr><td>SSR（服务端渲染）</td><td>优秀</td><td>快</td><td>动态内容、个性化页面</td></tr>
<tr><td>ISR（增量静态再生）</td><td>优秀</td><td>快</td><td>内容定期更新的页面</td></tr>
<tr><td>CSR（客户端渲染）</td><td>差</td><td>慢</td><td>仅限登录后的应用界面</td></tr>
</table></div>
<h2>修复方法</h2>
<ul>
<li>将关键页面从 CSR 迁移到 SSR 或 SSG</li>
<li>使用 Next.js、Nuxt.js、Astro 等支持 SSR/SSG 的框架</li>
<li>确保 title、meta description、H1 和正文在初始 HTML 中</li>
<li>对无法迁移的 CSR 页面使用预渲染服务</li>
<li>避免将 SEO 关键内容放在需要用户交互才能加载的区域</li>
</ul>
<h2>验证方法</h2>
<p>使用 <a href="/tools/html-checker.html">HTML 可读性检查工具</a> 粘贴 curl 获取的初始 HTML 进行检查。在 GSC URL 检查中确认渲染后的页面包含完整内容。</p>`,

'new-site-first-month': `
<h2>新站首月 SEO 概述</h2>
<p>新网站上线后的第一个月是建立搜索引擎信任的关键期。正确的操作顺序和时间节点安排可以显著加速首批页面的收录。</p>
<h2>常见原因（新站收录慢）</h2>
<ul>
<li>上线前没有做好技术 SEO 基础配置</li>
<li>一次性提交过多 URL 到 sitemap</li>
<li>没有建立任何外部链接信号</li>
<li>内容质量不足以让搜索引擎信任</li>
<li>缺少站长工具验证和 sitemap 提交</li>
</ul>
<h2>排查步骤（按时间线）</h2>
<ol class="step-list">
<li>第 1 天：验证 GSC 和 BWT，提交 sitemap（仅含 5-10 个核心页面）</li>
<li>第 1-3 天：确认 robots.txt 正确、canonical 自指、无 noindex 误用</li>
<li>第 3-7 天：检查 GSC 是否开始显示抓取数据</li>
<li>第 7 天：使用 URL 检查工具逐个请求索引核心页面</li>
<li>第 7-14 天：发布 3-5 篇高质量内容，建立内链结构</li>
<li>第 14-21 天：获取 2-3 个高质量外链（目录提交、社交媒体）</li>
<li>第 21-30 天：检查首批页面收录情况，扩展 sitemap</li>
</ol>
<h2>第一周检查清单</h2>
<ul class="checklist">
<li>GSC 和 BWT 已验证</li>
<li>Sitemap 已提交（不超过 10 个 URL）</li>
<li>robots.txt 允许抓取所有公开页面</li>
<li>所有页面有 canonical 自指</li>
<li>所有页面有唯一的 title 和 meta description</li>
<li>SSL 证书正确配置（HTTPS）</li>
<li>页面加载速度 < 3 秒</li>
<li>移动端适配正常</li>
</ul>
<h2>修复方法</h2>
<ul>
<li>按优先级分批提交 URL，不要一次性提交所有页面</li>
<li>先确保技术基础无误，再追求内容数量</li>
<li>每周发布 2-3 篇高质量内容，保持更新频率</li>
<li>通过社交媒体和行业目录获取初始外链</li>
<li>配置 IndexNow 加速 Bing 收录</li>
</ul>
<h2>验证方法</h2>
<p>每周检查 GSC 索引覆盖率报告。使用 site:yourdomain.com 搜索确认收录页面数量。30 天后核心页面应该开始出现在索引中。使用 <a href="/tools/sitemap-audit.html">Sitemap 审计工具</a> 确保提交的 URL 都是有效的。</p>`
};

// === Build Homepage ===
function buildHomepage() {
  const toolCards = tools.map(t => `
    <div class="card">
      <h3>${t.name}</h3>
      <p>${t.description}</p>
      <a href="/tools/${t.slug}.html" class="card-link">使用工具 &rarr;</a>
    </div>`).join('');

  const guideCards = guides.map(g => `
    <div class="card">
      <h3>${g.title}</h3>
      <p>${g.description}</p>
      <a href="/guides/${g.slug}.html" class="card-link">查看指南 &rarr;</a>
    </div>`).join('');

  const body = `
<section style="text-align:center;padding:40px 0;">
  <h1>${SITE_NAME}</h1>
  <p style="font-size:16px;color:var(--color-text-secondary);max-width:600px;margin:0 auto 24px;">
    通过诊断向导快速定位问题，使用本地工具检查配置，按指南逐步修复。
  </p>
  <a href="/diagnose/wizard.html" class="btn btn-primary">开始诊断</a>
</section>

<section class="quick-check-section" id="quick-check-section">
  <h2>快速检查</h2>
  <p style="color:var(--color-text-secondary);margin-bottom:16px;">粘贴一个 URL，选择检查工具，快速开始诊断。</p>
  <div class="quick-check-form">
    <input type="url" id="quick-check-url" class="quick-check-input" placeholder="https://example.com/your-page">
    <select id="quick-check-tool" class="quick-check-select">
      <option value="canonical-checker">Canonical 检查</option>
      <option value="sitemap-audit">Sitemap 审计</option>
      <option value="html-checker">HTML 可读性</option>
      <option value="ai-readability-scorer">AI 可读性评分</option>
      <option value="robots-checker">Robots 检查</option>
    </select>
    <button id="quick-check-btn" class="btn btn-primary">快速检查</button>
  </div>
</section>

<section>
  <h2>选择你遇到的问题</h2>
  <div class="card-grid">
    <div class="card"><h3>已发现未编入索引</h3><p>Google 发现了 URL 但没有抓取</p><a href="/guides/discovered-not-indexed.html" class="card-link">排查方法 &rarr;</a></div>
    <div class="card"><h3>已抓取未编入索引</h3><p>Google 抓取了但不收录</p><a href="/guides/crawled-not-indexed.html" class="card-link">排查方法 &rarr;</a></div>
    <div class="card"><h3>服务器错误 5xx</h3><p>服务器返回错误</p><a href="/guides/server-error-5xx.html" class="card-link">排查方法 &rarr;</a></div>
    <div class="card"><h3>Sitemap 问题</h3><p>Sitemap 配置不当</p><a href="/guides/sitemap-best-practices.html" class="card-link">最佳实践 &rarr;</a></div>
    <div class="card"><h3>Canonical 错误</h3><p>Canonical 没有自指</p><a href="/guides/self-referencing-canonical.html" class="card-link">了解详情 &rarr;</a></div>
    <div class="card"><h3>Robots 屏蔽</h3><p>误用 noindex 或 disallow</p><a href="/guides/robots-noindex.html" class="card-link">检查方法 &rarr;</a></div>
  </div>
</section>

<section id="tools" style="margin-top:40px;">
  <h2>诊断工具</h2>
  <p>所有工具在浏览器本地运行，不上传任何数据。</p>
  <div class="card-grid">${toolCards}</div>
</section>

<section id="guides" style="margin-top:40px;">
  <h2>排查指南</h2>
  <div class="card-grid">${guideCards}</div>
</section>

<section style="margin-top:40px;">
  <h2>常见问题</h2>
  <div class="faq-list">
    <details class="faq-item">
      <summary>这些工具会上传我的数据吗？</summary>
      <div class="faq-answer">不会。所有工具完全在浏览器本地运行，你的 HTML、URL 列表等数据不会发送到任何服务器。</div>
    </details>
    <details class="faq-item">
      <summary>页面显示"已发现未编入索引"多久会被收录？</summary>
      <div class="faq-answer">没有固定时间。Google 会根据页面质量、站点权重和抓取预算决定是否收录。修复技术问题可以提高收录概率。</div>
    </details>
    <details class="faq-item">
      <summary>AI 搜索引擎和传统搜索引擎有什么区别？</summary>
      <div class="faq-answer">AI 搜索引擎更依赖结构化内容、清晰的语义标记和可直接提取的答案。传统 SEO 的关键词密度策略对 AI 搜索效果有限。</div>
    </details>
    <details class="faq-item">
      <summary>Canonical 自指是什么意思？</summary>
      <div class="faq-answer">Canonical 自指是指页面的 canonical 标签指向自己的 URL。这告诉搜索引擎"这是此内容的正式版本"，是推荐的做法。</div>
    </details>
  </div>
</section>`;

  // Homepage FAQ items for FAQPage schema
  const homeFaqItems = [
    { question: '这些工具会上传我的数据吗？', answer: '不会。所有工具完全在浏览器本地运行，你的 HTML、URL 列表等数据不会发送到任何服务器。' },
    { question: '页面显示"已发现未编入索引"多久会被收录？', answer: '没有固定时间。Google 会根据页面质量、站点权重和抓取预算决定是否收录。修复技术问题可以提高收录概率。' },
    { question: 'AI 搜索引擎和传统搜索引擎有什么区别？', answer: 'AI 搜索引擎更依赖结构化内容、清晰的语义标记和可直接提取的答案。传统 SEO 的关键词密度策略对 AI 搜索效果有限。' },
    { question: 'Canonical 自指是什么意思？', answer: 'Canonical 自指是指页面的 canonical 标签指向自己的 URL。这告诉搜索引擎"这是此内容的正式版本"，是推荐的做法。' }
  ];

  writePage(join(SITE, 'index.html'), layout('首页', '页面没被收录？通过诊断向导定位问题，使用本地工具检查配置，按指南逐步修复。', '/', body, {
    priority: 1.0,
    pageType: 'home',
    schemas: [
      jsonLdWebSite(),
      jsonLdFAQPage(homeFaqItems),
      jsonLdBreadcrumb([{ name: '首页', url: DOMAIN + '/' }])
    ]
  }));
}

// === Build Wizard ===
function buildWizard() {
  const body = `
<h1>GSC 收录问题诊断向导</h1>
<p style="margin-bottom:24px;color:var(--color-text-secondary);">回答几个问题，快速定位页面未被收录的原因。所有判断在浏览器本地完成。</p>
<div class="wizard-container" id="wizard-app">
  <noscript><p>诊断向导需要 JavaScript 支持。</p></noscript>
</div>`;
  writePage(join(SITE, 'diagnose', 'wizard.html'), layout('收录诊断向导', '交互式诊断向导，根据页面状态快速定位收录问题并获取修复建议', '/diagnose/wizard.html', body, {
    priority: 0.8,
    pageType: 'wizard',
    schemas: [
      jsonLdWebApplication('GSC 收录问题诊断向导', '交互式诊断向导，根据页面状态快速定位收录问题并获取修复建议', DOMAIN + '/diagnose/wizard.html'),
      jsonLdBreadcrumb([
        { name: '首页', url: DOMAIN + '/' },
        { name: '诊断向导', url: DOMAIN + '/diagnose/wizard.html' }
      ])
    ]
  }));
}

// === Build Tool Pages ===
function buildToolPages() {
  const toolInputHtml = {
    'sitemap-audit': `
      <div class="tool-input-area">
        <label for="sitemap-urls">粘贴 sitemap URL 列表（每行一个）</label>
        <textarea class="tool-textarea" id="sitemap-urls" placeholder="https://example.com/page1&#10;https://example.com/page2&#10;https://example.com/image.png"></textarea>
        <button class="btn btn-primary tool-run-btn" style="margin-top:12px;">开始审计</button>
      </div>
      <div class="tool-result-area"></div>`,
    'canonical-checker': `
      <div class="tool-input-area">
        <div class="form-group">
          <label for="canonical-page-url">页面 URL</label>
          <input type="url" id="canonical-page-url" placeholder="https://example.com/my-page">
        </div>
        <div class="form-group">
          <label for="canonical-value">Canonical 值</label>
          <input type="url" id="canonical-value" placeholder="https://example.com/my-page">
        </div>
        <button class="btn btn-primary tool-run-btn" style="margin-top:12px;">检查</button>
      </div>
      <div class="tool-result-area"></div>`,
    'robots-checker': `
      <div class="tool-input-area">
        <label for="robots-input">粘贴 robots.txt 内容或 meta robots 标签</label>
        <textarea class="tool-textarea" id="robots-input" placeholder="User-agent: *&#10;Disallow: /admin/"></textarea>
        <button class="btn btn-primary tool-run-btn" style="margin-top:12px;">检查</button>
      </div>
      <div class="tool-result-area"></div>`,
    'html-checker': `
      <div class="tool-input-area">
        <label for="html-input">粘贴页面 HTML 源码</label>
        <textarea class="tool-textarea" id="html-input" placeholder="<!DOCTYPE html>&#10;<html>...</html>"></textarea>
        <button class="btn btn-primary tool-run-btn" style="margin-top:12px;">检查</button>
      </div>
      <div class="tool-result-area"></div>`,
    'ai-readability-scorer': `
      <div class="tool-input-area">
        <label for="ai-html-input">粘贴页面 HTML 源码</label>
        <textarea class="tool-textarea" id="ai-html-input" placeholder="<!DOCTYPE html>&#10;<html>...</html>"></textarea>
        <button class="btn btn-primary tool-run-btn" style="margin-top:12px;">评分</button>
      </div>
      <div class="tool-result-area"></div>`
  };

  tools.forEach(t => {
    const body = `
<h1>${t.name}</h1>
<p>${t.description}</p>
<p style="font-size:12px;color:var(--color-text-secondary);margin-bottom:24px;">所有数据仅在浏览器本地处理，不会上传到服务器。</p>
<div class="tool-section" id="tool-${t.slug}">
  ${toolInputHtml[t.slug] || ''}
</div>`;
    writePage(join(SITE, 'tools', `${t.slug}.html`), layout(t.name, t.description, `/tools/${t.slug}.html`, body, {
      priority: 0.8,
      pageType: 'tool',
      schemas: [
        jsonLdWebApplication(t.name, t.description, `${DOMAIN}/tools/${t.slug}.html`),
        jsonLdBreadcrumb([
          { name: '首页', url: DOMAIN + '/' },
          { name: '工具', url: DOMAIN + '/#tools' },
          { name: t.name, url: `${DOMAIN}/tools/${t.slug}.html` }
        ])
      ]
    }));
  });
}

// === Build Guide Pages ===
// FAQ data for guide pages that contain FAQ-like content
const guideFaqData = {
  'discovered-not-indexed': [
    { question: '什么是"已发现但未编入索引"？', answer: 'Google Search Console 中显示 "Discovered - currently not indexed" 表示 Google 知道这个 URL 存在，但还没有去抓取它。通常意味着 Google 认为这个页面的优先级不够高。' },
    { question: '"已发现未编入索引"的常见原因有哪些？', answer: '常见原因包括：站点抓取预算不足、页面缺少内链支撑、新站点或新页面、服务器响应慢、页面内容薄弱、Sitemap 中 URL 过多稀释了优先级。' },
    { question: '如何修复"已发现未编入索引"问题？', answer: '增加从高权重页面到该页面的内链，精简 sitemap 只保留高质量页面，提升页面内容质量和独特性，优化服务器性能，在 GSC 中手动请求索引。' }
  ],
  'crawled-not-indexed': [
    { question: '什么是"已抓取但未编入索引"？', answer: '"Crawled - currently not indexed" 表示 Google 已经抓取了页面内容，但决定不将其加入索引。这比"已发现未索引"更严重，因为 Google 看过内容后主动选择不收录。' },
    { question: '"已抓取未编入索引"和"已发现未编入索引"有什么区别？', answer: '"已发现未编入索引"是 Google 还没来抓取；"已抓取未编入索引"是 Google 抓取后主动不收录，通常是内容质量问题。' },
    { question: '如何修复"已抓取未编入索引"？', answer: '大幅提升内容质量，增加原创分析和数据；合并相似页面用 301 重定向；添加结构化数据；增加作者信息和更新日期；获取外部链接提升权威性。' }
  ],
  'sitemap-best-practices': [
    { question: 'Sitemap 应该包含哪些页面？', answer: '应包含所有希望被收录的公开页面，返回 200 状态码、有 canonical 自指、没有 noindex、有实质内容的页面。' },
    { question: 'Sitemap 不应该包含什么？', answer: '不应包含非 HTML 文件、带参数的重复 URL、已设置 noindex 的页面、重定向的源 URL、返回 4xx/5xx 的 URL、低质量标签页和内部搜索结果页。' },
    { question: '新站首次提交 Sitemap 有什么建议？', answer: '新站首次提交不超过 1000 个 URL，优先提交最重要的页面，确保每个 URL 返回 200，使用 lastmod 标注真实修改时间，提交后监控索引覆盖率。' }
  ],
  'self-referencing-canonical': [
    { question: 'Canonical 自指是什么意思？', answer: 'Canonical 自指是指页面的 link rel="canonical" 标签指向自己的 URL，明确告诉搜索引擎这个 URL 是此内容的正式版本。' },
    { question: '为什么需要 Canonical 自指？', answer: '防止带参数的 URL 被当作独立页面，明确声明内容归属避免被判定为重复，统一链接权重到正式 URL，处理 HTTP/HTTPS 和 www/non-www 变体。' }
  ],
  'nextjs-canonical': [
    { question: 'Next.js App Router 如何设置 canonical？', answer: '在 page.tsx 中通过 export const metadata 或 generateMetadata 函数设置 alternates.canonical 属性。设置 metadataBase 后可以使用相对路径。' },
    { question: 'Next.js canonical 最常见的错误是什么？', answer: '最常见的错误包括：忘记在 generateMetadata 中设置 canonical、环境变量未设置导致 URL 为空、canonical 中包含查询参数、动态路由没有包含实际 slug。' },
    { question: 'metadataBase 有什么作用？', answer: 'metadataBase 设置后，所有 metadata 中的相对 URL 都会基于它解析为绝对 URL，避免在每个页面重复写完整域名。' }
  ],
  'server-error-5xx': [
    { question: 'GSC 报告 5xx 错误是什么意思？', answer: '表示 Googlebot 在抓取页面时收到了服务器错误响应（500/502/503/504），说明服务器在处理请求时出现了问题。' },
    { question: '如何定位 5xx 错误的具体原因？', answer: '检查服务器错误日志、确认服务器资源是否充足、检查是否有针对爬虫的限流规则、优化慢查询、确保 CDN 回源配置正确。' },
    { question: '5xx 错误会影响收录吗？', answer: '会。如果 Googlebot 多次遇到 5xx 错误，会降低对该站点的抓取频率，已收录的页面也可能被移除索引。' }
  ],
  'robots-noindex': [
    { question: 'robots.txt 和 meta noindex 有什么区别？', answer: 'robots.txt 控制爬虫是否可以抓取页面（只是建议），meta noindex 告诉搜索引擎不要收录该页面（更强制）。两者作用不同，robots.txt 屏蔽抓取，noindex 屏蔽收录。' },
    { question: '常见的误屏蔽场景有哪些？', answer: '常见误屏蔽包括：robots.txt 中 Disallow: / 屏蔽整站、测试环境 noindex 带到生产环境、CMS 的阻止索引选项被勾选、CDN 添加全局 X-Robots-Tag。' }
  ],
  'html-readability': [
    { question: '为什么初始 HTML 对 SEO 很重要？', answer: '搜索引擎首次抓取页面时主要读取服务器返回的初始 HTML。虽然 Google 可以执行 JavaScript，但需要额外资源和时间，且不保证完整渲染。' },
    { question: '初始 HTML 必须包含什么？', answer: '必须包含完整的 title 标签、meta description、至少一个 H1、页面核心正文内容、canonical 标签、结构化数据（JSON-LD）和内部导航链接。' }
  ],
  'ai-search-readability': [
    { question: 'AI 搜索引擎如何理解页面？', answer: 'AI 搜索引擎需要从页面中提取可直接引用的答案，看重清晰的内容结构、可直接提取的答案、权威性信号、结构化数据、内容时效性和深度。' },
    { question: '如何优化页面的 AI 搜索可读性？', answer: '每页有且只有一个 H1，使用 H2/H3 组织层级，正文开头提供摘要，使用列表呈现步骤和要点，添加 FAQ 结构化数据，标注作者和更新日期，正文超过 300 字。' }
  ],
  'structured-data': [
    { question: '什么是结构化数据？', answer: '结构化数据是用标准格式（通常是 JSON-LD）向搜索引擎描述页面内容的方式，帮助搜索引擎理解页面的类型、内容和关系。' },
    { question: 'JSON-LD 常见错误有哪些？', answer: '常见错误包括：JSON 格式错误、使用不存在的 schema 类型或属性、结构化数据与页面可见内容不一致、缺少必需属性、日期格式不正确。' }
  ],
  'bing-vs-gsc': [
    { question: 'Bing Webmaster Tools 和 GSC 有什么区别？', answer: 'BWT 提供更高的 URL 提交配额（每天 10000 条）、原生 IndexNow 支持、内置 SEO 建议和关键词研究工具，而 GSC 在搜索分析数据方面更详细。' },
    { question: '为什么要同时使用 BWT 和 GSC？', answer: 'Bing 占全球搜索市场约 10%，且 BWT 提供了 GSC 没有的功能如站点扫描、SEO 建议和更高的 URL 提交配额，两者互补可以获得更全面的 SEO 数据。' },
    { question: 'BWT 的 URL 提交配额是多少？', answer: 'Bing Webmaster Tools 每天最多可提交 10,000 条 URL，远高于 GSC 的 URL 检查工具（每天约 10 条）。' }
  ],
  'indexnow-protocol': [
    { question: '什么是 IndexNow 协议？', answer: 'IndexNow 是一个开放协议，允许网站在内容更新时主动通知搜索引擎，支持 Bing、Yandex、Seznam 和 Naver，可以显著加速收录速度。' },
    { question: 'Google 支持 IndexNow 吗？', answer: '截至目前 Google 不支持 IndexNow，但正在评估中。IndexNow 主要加速 Bing 和 Yandex 的收录。' },
    { question: '如何配置 IndexNow？', answer: '生成一个 API key，将 key 文件放在网站根目录，然后在内容更新时通过 HTTP GET 或 POST 请求通知 IndexNow API。' }
  ],
  'core-web-vitals': [
    { question: 'Core Web Vitals 包含哪些指标？', answer: '包含三个指标：LCP（最大内容绘制，衡量加载速度）、INP（交互到下一次绘制，衡量交互响应）、CLS（累积布局偏移，衡量视觉稳定性）。' },
    { question: 'Core Web Vitals 的达标阈值是什么？', answer: 'LCP 应小于 2.5 秒，INP 应小于 200 毫秒，CLS 应小于 0.1。超过这些阈值会被标记为需要改进或差。' },
    { question: 'Core Web Vitals 会影响收录吗？', answer: '不会直接影响收录，但会影响排名。Google 将 Core Web Vitals 作为排名信号之一，性能差的页面在竞争中处于劣势。' }
  ],
  'hreflang-check': [
    { question: '什么是 hreflang 标签？', answer: 'hreflang 是 HTML 属性，告诉搜索引擎页面有哪些语言/地区版本，帮助搜索引擎向用户展示正确语言的页面。' },
    { question: 'hreflang 最常见的错误是什么？', answer: '最常见的错误是缺少自引用（每个页面必须包含指向自己的 hreflang）和非双向关系（A 指向 B 但 B 没有指向 A）。' },
    { question: 'x-default 是什么意思？', answer: 'x-default 指定当用户的语言/地区不匹配任何 hreflang 版本时应该展示的默认页面，通常指向英文版或语言选择页。' }
  ],
  'js-rendering-seo': [
    { question: 'Google 能执行 JavaScript 吗？', answer: '能，但有延迟。Google 使用两阶段索引：先读取初始 HTML，再将页面放入渲染队列执行 JS。渲染队列可能有数天延迟，且不保证完整执行。' },
    { question: 'SPA 对 SEO 有什么影响？', answer: '纯客户端渲染的 SPA 初始 HTML 通常只有空 div，搜索引擎在第一阶段无法获取内容，需要等待 JS 渲染，这会导致收录延迟或失败。' },
    { question: 'SSR 和 SSG 哪个对 SEO 更好？', answer: '两者对 SEO 都很好。SSG 生成静态 HTML 速度最快，适合内容不频繁变化的页面；SSR 适合动态内容，每次请求都生成完整 HTML。' }
  ],
  'new-site-first-month': [
    { question: '新站多久能被 Google 收录？', answer: '通常首页在 1-2 周内被收录，内页可能需要 2-4 周。通过正确配置 GSC、提交 sitemap 和请求索引可以加速这个过程。' },
    { question: '新站首次提交 sitemap 应该包含多少 URL？', answer: '建议首次提交不超过 10 个核心页面，确保每个页面都有高质量内容。随着收录增加再逐步扩展 sitemap。' },
    { question: '新站第一个月最重要的 SEO 操作是什么？', answer: '验证 GSC/BWT、提交 sitemap、确保技术基础无误（robots.txt、canonical、HTTPS）、发布高质量内容、获取初始外链。' }
  ]
};

function buildGuidePages() {
  guides.forEach(g => {
    const content = guideContent[g.slug] || '<p>内容正在编写中。</p>';
    const body = `
<article class="guide-content">
  <h1>${g.title}</h1>
  <p style="color:var(--color-text-secondary);margin-bottom:24px;">${g.description}</p>
  ${content}
</article>
<div style="margin-top:24px;">
  <a href="/#guides" class="btn btn-secondary">&larr; 返回指南列表</a>
</div>`;

    const schemas = [
      jsonLdArticle(g.title, g.description, g.slug),
      jsonLdBreadcrumb([
        { name: '首页', url: DOMAIN + '/' },
        { name: '指南', url: DOMAIN + '/#guides' },
        { name: g.title, url: `${DOMAIN}/guides/${g.slug}.html` }
      ])
    ];

    // Add FAQPage schema if guide has FAQ data
    if (guideFaqData[g.slug]) {
      schemas.push(jsonLdFAQPage(guideFaqData[g.slug]));
    }

    writePage(join(SITE, 'guides', `${g.slug}.html`), layout(g.title, g.description, `/guides/${g.slug}.html`, body, {
      priority: 0.7,
      pageType: 'guide',
      ogType: 'article',
      schemas
    }));
  });
}

// === Build Trust Pages ===
function buildTrustPages() {
  const aboutBody = `
<h1>关于本站</h1>
<p>本站提供搜索引擎收录问题的诊断工具和排查指南，帮助网站管理员定位和修复页面未被收录的技术问题。</p>
<h2>我们提供什么</h2>
<ul>
<li>交互式诊断向导，快速定位问题方向</li>
<li>浏览器本地运行的检查工具，不上传任何数据</li>
<li>详细的排查指南，包含具体步骤和验证方法</li>
<li>AI 搜索可见性优化建议</li>
</ul>
<h2>隐私承诺</h2>
<p>所有工具完全在浏览器本地运行。你粘贴的 HTML、URL 列表等数据不会发送到任何服务器，不会被存储或分析。</p>
<h2>联系方式</h2>
<p>如有问题或建议，请发送邮件至 <a href="mailto:${EMAIL}">${EMAIL}</a>。</p>`;
  writePage(join(SITE, 'pages', 'about.html'), layout('关于', '关于搜索可见性与 GSC 收录诊断工具', '/pages/about.html', aboutBody, {
    priority: 0.4,
    pageType: 'trust',
    schemas: [jsonLdBreadcrumb([
      { name: '首页', url: DOMAIN + '/' },
      { name: '关于', url: DOMAIN + '/pages/about.html' }
    ])]
  }));

  const contactBody = `
<h1>联系我们</h1>
<p>如果你在使用工具或指南时遇到问题，或有改进建议，欢迎联系我们。</p>
<h2>邮箱</h2>
<p><a href="mailto:${EMAIL}">${EMAIL}</a></p>
<h2>反馈内容</h2>
<ul>
<li>工具使用中的问题或 Bug</li>
<li>指南内容的错误或过时信息</li>
<li>新工具或新指南的建议</li>
<li>其他合作事宜</li>
</ul>`;
  writePage(join(SITE, 'pages', 'contact.html'), layout('联系我们', '联系搜索可见性与 GSC 收录诊断工具团队', '/pages/contact.html', contactBody, {
    priority: 0.4,
    pageType: 'trust',
    schemas: [jsonLdBreadcrumb([
      { name: '首页', url: DOMAIN + '/' },
      { name: '联系我们', url: DOMAIN + '/pages/contact.html' }
    ])]
  }));

  const privacyBody = `
<h1>隐私政策</h1>
<p>最后更新：2024 年 1 月</p>
<h2>数据收集</h2>
<p>本站的所有诊断工具完全在浏览器本地运行。你输入的 HTML 源码、URL 列表、robots.txt 内容等数据不会被发送到任何服务器，不会被存储、分析或与第三方共享。</p>
<h2>Cookies</h2>
<p>本站不使用 cookies 追踪用户行为。</p>
<h2>第三方服务</h2>
<p>本站不集成任何第三方分析或广告服务。</p>
<h2>联系方式</h2>
<p>如对隐私政策有疑问，请联系 <a href="mailto:${EMAIL}">${EMAIL}</a>。</p>`;
  writePage(join(SITE, 'pages', 'privacy.html'), layout('隐私政策', '搜索可见性与 GSC 收录诊断工具的隐私政策', '/pages/privacy.html', privacyBody, {
    priority: 0.4,
    pageType: 'trust',
    schemas: [jsonLdBreadcrumb([
      { name: '首页', url: DOMAIN + '/' },
      { name: '隐私政策', url: DOMAIN + '/pages/privacy.html' }
    ])]
  }));

  const disclaimerBody = `
<h1>免责声明</h1>
<h2>工具准确性</h2>
<p>本站提供的诊断工具基于常见规则进行检查，结果仅供参考。工具无法覆盖所有边缘情况，不能替代专业的 SEO 审计。</p>
<h2>指南内容</h2>
<p>排查指南基于公开的搜索引擎文档和行业最佳实践编写。搜索引擎的算法和规则可能随时变化，我们会尽力保持内容更新，但不保证所有信息在任何时间点都完全准确。</p>
<h2>结果不保证</h2>
<p>使用本站工具和指南不保证页面一定会被搜索引擎收录。收录决定权在搜索引擎，受多种因素影响。</p>
<h2>联系方式</h2>
<p>如有疑问请联系 <a href="mailto:${EMAIL}">${EMAIL}</a>。</p>`;
  writePage(join(SITE, 'pages', 'disclaimer.html'), layout('免责声明', '搜索可见性与 GSC 收录诊断工具的免责声明', '/pages/disclaimer.html', disclaimerBody, {
    priority: 0.4,
    pageType: 'trust',
    schemas: [jsonLdBreadcrumb([
      { name: '首页', url: DOMAIN + '/' },
      { name: '免责声明', url: DOMAIN + '/pages/disclaimer.html' }
    ])]
  }));
}

// === Build Sitemap & Robots ===
function buildSitemap() {
  const today = new Date().toISOString().split('T')[0];
  const urls = allPages.map(p => `  <url>
    <loc>${DOMAIN}${cleanUrl(p.path)}</loc>
    <lastmod>${today}</lastmod>
    <priority>${p.priority.toFixed(1)}</priority>
  </url>`).join('\n');

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
  writeFileSync(join(SITE, 'sitemap.xml'), sitemap, 'utf-8');

  const robots = `User-agent: *
Allow: /

Sitemap: ${DOMAIN}/sitemap.xml`;
  writeFileSync(join(SITE, 'robots.txt'), robots, 'utf-8');
}

// === Main Execution ===
console.log('Building site...');
buildHomepage();
buildWizard();
buildToolPages();
buildGuidePages();
buildTrustPages();
buildSitemap();
console.log(`Done! Generated ${pageCount} pages + sitemap.xml + robots.txt`);
