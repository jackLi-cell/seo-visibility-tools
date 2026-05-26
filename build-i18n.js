const fs = require('fs');
const path = require('path');

const SITE_DIR = path.join(__dirname, 'site');
const DOMAIN = 'https://seo.jtlcook.com';

// Translation dictionary for Chinese -> English
const translations = {
  // Site name
  '搜索可见性与 GSC 收录诊断工具': 'AI Search Visibility & GSC Indexing Diagnostics',
  // Nav
  '首页': 'Home',
  '诊断向导': 'Diagnostic Wizard',
  '工具': 'Tools',
  '指南': 'Guides',
  '关于': 'About',
  '联系': 'Contact',
  '隐私': 'Privacy',
  '免责声明': 'Disclaimer',
  // Index page
  '通过诊断向导快速定位问题，使用本地工具检查配置，按指南逐步修复。': 'Quickly identify issues with the diagnostic wizard, check configurations with local tools, and fix step by step with guides.',
  '开始诊断': 'Start Diagnosis',
  '快速检查': 'Quick Check',
  '粘贴一个 URL，选择检查工具，快速开始诊断。': 'Paste a URL, select a check tool, and start diagnosing quickly.',
  '选择你遇到的问题': 'Select Your Issue',
  '排查指南': 'Troubleshooting Guides',
  '诊断工具': 'Diagnostic Tools',
  '所有工具在浏览器本地运行，不上传任何数据。': 'All tools run locally in your browser. No data is uploaded.',
  '常见问题': 'FAQ',
  // FAQ
  '这些工具会上传我的数据吗？': 'Will these tools upload my data?',
  '不会。所有工具完全在浏览器本地运行，你的 HTML、URL 列表等数据不会发送到任何服务器。': 'No. All tools run entirely in your browser. Your HTML, URL lists, and other data are never sent to any server.',
  '页面显示"已发现未编入索引"多久会被收录？': 'How long until a page marked "Discovered - not indexed" gets indexed?',
  '页面显示\\\"已发现未编入索引\\\"多久会被收录？': 'How long until a page marked \\\"Discovered - not indexed\\\" gets indexed?',
  '没有固定时间。Google 会根据页面质量、站点权重和抓取预算决定是否收录。修复技术问题可以提高收录概率。': 'There is no fixed timeline. Google decides based on page quality, site authority, and crawl budget. Fixing technical issues can improve indexing probability.',
  'AI 搜索引擎和传统搜索引擎有什么区别？': 'What is the difference between AI search engines and traditional search engines?',
  'AI 搜索引擎更依赖结构化内容、清晰的语义标记和可直接提取的答案。传统 SEO 的关键词密度策略对 AI 搜索效果有限。': 'AI search engines rely more on structured content, clear semantic markup, and directly extractable answers. Traditional SEO keyword density strategies have limited effect on AI search.',
  'Canonical 自指是什么意思？': 'What does self-referencing canonical mean?',
  'Canonical 自指是指页面的 canonical 标签指向自己的 URL。这告诉搜索引擎"这是此内容的正式版本"，是推荐的做法。': 'Self-referencing canonical means the page\'s canonical tag points to its own URL. This tells search engines "this is the official version of this content" and is a recommended practice.',
  'Canonical 自指是指页面的 canonical 标签指向自己的 URL。这告诉搜索引擎\\\"这是此内容的正式版本\\\"，是推荐的做法。': 'Self-referencing canonical means the page\\\'s canonical tag points to its own URL. This tells search engines \\\"this is the official version of this content\\\" and is a recommended practice.',
  // Meta descriptions
  '页面没被收录？通过诊断向导定位问题，使用本地工具检查配置，按指南逐步修复。': 'Page not indexed? Use the diagnostic wizard to identify issues, check configurations with local tools, and fix step by step with guides.',
  '交互式诊断向导，根据页面状态快速定位收录问题并获取修复建议': 'Interactive diagnostic wizard to quickly identify indexing issues based on page status and get fix recommendations',
  '回答几个问题，快速定位页面未被收录的原因。所有判断在浏览器本地完成。': 'Answer a few questions to quickly identify why your page is not indexed. All analysis runs locally in your browser.',
  '诊断向导需要 JavaScript 支持。': 'The diagnostic wizard requires JavaScript.',
};

const translations2 = {
  // Guide titles
  '已发现未编入索引': 'Discovered but Not Indexed',
  '已抓取未编入索引': 'Crawled but Not Indexed',
  '服务器错误 5xx': 'Server Error 5xx',
  'Sitemap 问题': 'Sitemap Issues',
  'Canonical 错误': 'Canonical Errors',
  'Robots 屏蔽': 'Robots Blocking',
  '排查方法': 'Troubleshoot',
  '最佳实践': 'Best Practices',
  '了解详情': 'Learn More',
  '检查方法': 'How to Check',
  '查看指南': 'View Guide',
  '使用工具': 'Use Tool',
  // Guide descriptions on index
  'Google 发现了 URL 但没有抓取': 'Google discovered the URL but did not crawl it',
  'Google 抓取了但不收录': 'Google crawled it but did not index it',
  '服务器返回错误': 'Server returned an error',
  'Sitemap 配置不当': 'Sitemap misconfiguration',
  'Canonical 没有自指': 'Canonical not self-referencing',
  '误用 noindex 或 disallow': 'Misuse of noindex or disallow',
  // Tool names
  'Sitemap 审计清单': 'Sitemap Audit Checklist',
  'Canonical 检查清单': 'Canonical Check Checklist',
  'Robots / Noindex 检查器': 'Robots / Noindex Checker',
  '初始 HTML 可读性检查': 'Initial HTML Readability Check',
  'AI 搜索可读性评分器': 'AI Search Readability Scorer',
  'Canonical 检查': 'Canonical Check',
  'Sitemap 审计': 'Sitemap Audit',
  'HTML 可读性': 'HTML Readability',
  'AI 可读性评分': 'AI Readability Score',
  'Robots 检查': 'Robots Check',
  // Tool descriptions
  '粘贴 sitemap URL 列表，检查低价值资源、非 HTML 文件和域名混用': 'Paste sitemap URL list to check for low-value resources, non-HTML files, and mixed domains',
  '输入页面 URL 和 canonical 值，检查是否自指、是否指向首页': 'Enter page URL and canonical value to check self-referencing and homepage pointing',
  '粘贴 robots.txt 或 meta robots 内容，检查是否误屏蔽': 'Paste robots.txt or meta robots content to check for accidental blocking',
  '粘贴 HTML 源码，检查 H1、title、description、正文和 JSON-LD': 'Paste HTML source to check H1, title, description, body content, and JSON-LD',
  '粘贴 HTML 源码，评估页面对 AI 搜索引擎的可读性': 'Paste HTML source to evaluate page readability for AI search engines',
  // Guide card descriptions on index
  'Google 发现了 URL 但还没有抓取，通常是抓取优先级不够或页面质量信号不足': 'Google discovered the URL but has not crawled it yet, usually due to insufficient crawl priority or page quality signals',
  'Google 已抓取但认为不值得收录，通常是内容质量、重复或薄内容问题': 'Google crawled but deemed not worth indexing, usually due to content quality, duplication, or thin content issues',
  '服务器返回 5xx 错误，需要定位具体 URL 和错误原因': 'Server returned 5xx errors, need to identify specific URLs and error causes',
  'sitemap 只收录高质量公开页面，不要把所有文件都塞进去': 'Sitemap should only include high-quality public pages, do not stuff all files into it',
  '每个页面的 canonical 应该指向自己的正式 URL，不要全站指向首页': 'Each page\'s canonical should point to its own official URL, not all pointing to the homepage',
  'Next.js App Router 中 metadata 和 canonical 的正确配置方法': 'Correct metadata and canonical configuration in Next.js App Router',
  '检查 robots.txt、meta robots 和 X-Robots-Tag 是否误屏蔽页面': 'Check if robots.txt, meta robots, and X-Robots-Tag accidentally block pages',
  '确认搜索引擎首次抓取时能在初始 HTML 中读到核心内容': 'Confirm search engines can read core content in initial HTML on first crawl',
  '让页面能被 AI 搜索引擎和摘要工具有效理解的优化方法': 'Optimization methods to make pages effectively understood by AI search engines and summarization tools',
  'JSON-LD 结构化数据的基本检查方法和常见错误': 'Basic check methods and common errors for JSON-LD structured data',
  '对比 Bing Webmaster Tools 和 Google Search Console 的功能差异与使用策略': 'Compare feature differences and usage strategies between Bing Webmaster Tools and Google Search Console',
  '通过 IndexNow 协议主动通知搜索引擎内容更新，加速 Bing 和 Yandex 收录': 'Proactively notify search engines of content updates via IndexNow protocol to accelerate Bing and Yandex indexing',
  'LCP、INP、CLS 三大核心指标如何影响搜索排名和收录优先级': 'How the three core metrics LCP, INP, and CLS affect search ranking and indexing priority',
  '检查 hreflang 标签配置是否正确，避免多语言页面互相竞争排名': 'Check if hreflang tag configuration is correct to avoid multilingual pages competing for rankings',
  '理解搜索引擎如何处理 JavaScript 渲染内容，以及 CSR/SSR/SSG 的 SEO 影响': 'Understand how search engines handle JavaScript-rendered content and the SEO impact of CSR/SSR/SSG',
  '新网站上线第一个月的 SEO 检查清单和时间节点安排': 'SEO checklist and timeline for the first month after a new website launches',
  // Guide titles on index
  '已发现但未编入索引怎么排查': 'How to Troubleshoot Discovered but Not Indexed',
  '已抓取但未编入索引怎么排查': 'How to Troubleshoot Crawled but Not Indexed',
  'GSC 服务器错误 5xx 怎么定位': 'How to Locate GSC Server Error 5xx',
  'Sitemap 应该提交哪些页面': 'Which Pages Should Be in Your Sitemap',
  'Canonical 自指是什么意思': 'What Does Self-Referencing Canonical Mean',
  'Next.js Canonical 配置常见错误': 'Common Next.js Canonical Configuration Errors',
  'Robots.txt 和 Noindex 怎么检查': 'How to Check Robots.txt and Noindex',
  '初始 HTML 可读内容检查清单': 'Initial HTML Readable Content Checklist',
  'AI 搜索可读性怎么提升': 'How to Improve AI Search Readability',
  '结构化数据和 FAQ 基础检查': 'Structured Data and FAQ Basic Check',
  'Bing Webmaster Tools 与 GSC 的差异': 'Differences Between Bing Webmaster Tools and GSC',
  'IndexNow 协议使用指南': 'IndexNow Protocol Usage Guide',
  'Core Web Vitals 对收录的影响': 'Impact of Core Web Vitals on Indexing',
  '多语言网站 hreflang 配置检查': 'Multilingual Website hreflang Configuration Check',
  'JavaScript 渲染与 SEO 的关系': 'JavaScript Rendering and SEO',
  '新站首月 SEO 检查时间表': 'New Site First Month SEO Checklist',
  // About page
  '关于本站': 'About This Site',
  '本站提供搜索引擎收录问题的诊断工具和排查指南，帮助网站管理员定位和修复页面未被收录的技术问题。': 'This site provides diagnostic tools and troubleshooting guides for search engine indexing issues, helping webmasters identify and fix technical problems preventing pages from being indexed.',
  '我们提供什么': 'What We Offer',
  '交互式诊断向导，快速定位问题方向': 'Interactive diagnostic wizard for quick issue identification',
  '浏览器本地运行的检查工具，不上传任何数据': 'Browser-based check tools that run locally without uploading any data',
  '详细的排查指南，包含具体步骤和验证方法': 'Detailed troubleshooting guides with specific steps and verification methods',
  'AI 搜索可见性优化建议': 'AI search visibility optimization recommendations',
  '隐私承诺': 'Privacy Commitment',
  '所有工具完全在浏览器本地运行。你粘贴的 HTML、URL 列表等数据不会发送到任何服务器，不会被存储或分析。': 'All tools run entirely in your browser. Your HTML, URL lists, and other data are never sent to any server, stored, or analyzed.',
  '联系方式': 'Contact',
  '如有问题或建议，请发送邮件至': 'For questions or suggestions, please email',
  // Contact page
  '联系我们': 'Contact Us',
  '如果你在使用工具或指南时遇到问题，或有改进建议，欢迎联系我们。': 'If you encounter issues using our tools or guides, or have suggestions for improvement, feel free to contact us.',
  '邮箱': 'Email',
  '反馈内容': 'Feedback Topics',
  '工具使用中的问题或 Bug': 'Issues or bugs when using tools',
  '指南内容的错误或过时信息': 'Errors or outdated information in guides',
  '新工具或新指南的建议': 'Suggestions for new tools or guides',
  '其他合作事宜': 'Other collaboration matters',
  // Tool pages
  '粘贴页面 HTML 源码': 'Paste page HTML source',
  '评分': 'Score',
  '所有数据仅在浏览器本地处理，不会上传到服务器。': 'All data is processed locally in your browser and never uploaded to any server.',
  '收录诊断向导': 'Indexing Diagnostic Wizard',
  'GSC 收录问题诊断向导': 'GSC Indexing Issue Diagnostic Wizard',
  // JSON-LD escaped versions
  '什么是\\\"已抓取但未编入索引\\\"？': 'What is \\\"Crawled - currently not indexed\\\"?',
  '\\\"Crawled - currently not indexed\\\" 表示 Google 已经抓取了页面内容，但决定不将其加入索引。这比\\\"已发现未索引\\\"更严重，因为 Google 看过内容后主动选择不收录。': '\\\"Crawled - currently not indexed\\\" means Google has crawled the page content but decided not to add it to the index. This is more serious than \\\"Discovered - not indexed\\\" because Google actively chose not to index it after reviewing the content.',
  '\\\"已抓取未编入索引\\\"和\\\"已发现未编入索引\\\"有什么区别？': 'What is the difference between \\\"Crawled - not indexed\\\" and \\\"Discovered - not indexed\\\"?',
  '\\\"已发现未编入索引\\\"是 Google 还没来抓取；\\\"已抓取未编入索引\\\"是 Google 抓取后主动不收录，通常是内容质量问题。': '\\\"Discovered - not indexed\\\" means Google has not crawled it yet; \\\"Crawled - not indexed\\\" means Google actively chose not to index it after crawling, usually due to content quality issues.',
  '如何修复\\\"已抓取未编入索引\\\"？': 'How to fix \\\"Crawled - not indexed\\\"?',
  '大幅提升内容质量，增加原创分析和数据；合并相似页面用 301 重定向；添加结构化数据；增加作者信息和更新日期；获取外部链接提升权威性。': 'Significantly improve content quality with original analysis and data; merge similar pages with 301 redirects; add structured data; add author information and update dates; acquire external links to boost authority.',
  // Footer
  '返回指南列表': 'Back to Guides',
  // Guide body content translations
  '什么是"已抓取但未编入索引"': 'What is "Crawled - currently not indexed"',
  '"Crawled - currently not indexed" 表示 Google 已经抓取了页面内容，但决定不将其加入索引。这比"已发现未索引"更严重，因为 Google 看过内容后主动选择不收录。': '"Crawled - currently not indexed" means Google has crawled the page content but decided not to add it to the index. This is more serious than "Discovered - not indexed" because Google actively chose not to index it after reviewing the content.',
  '常见原因': 'Common Causes',
  '内容质量不足或内容过薄': 'Insufficient content quality or thin content',
  '与站内其他页面内容重复或高度相似': 'Content duplicated or highly similar to other pages on the site',
  '页面是自动生成的低价值内容': 'Page contains auto-generated low-value content',
  '缺少 E-E-A-T 信号（经验、专业性、权威性、可信度）': 'Lacking E-E-A-T signals (Experience, Expertise, Authoritativeness, Trustworthiness)',
  '页面用户体验差': 'Poor page user experience',
  '站点整体质量评分不高': 'Overall site quality score is not high',
  '排查步骤': 'Troubleshooting Steps',
  '在 GSC URL 检查中确认状态和上次抓取时间': 'Confirm status and last crawl time in GSC URL Inspection',
  '对比该页面与已收录页面的内容差异': 'Compare content differences between this page and indexed pages',
  '检查是否存在站内重复内容': 'Check for duplicate content within the site',
  '评估页面字数和信息密度（建议大于 800 字有实质内容）': 'Evaluate word count and information density (recommend over 800 words of substantial content)',
  '检查页面是否有独特价值': 'Check if the page has unique value',
  '确认页面有正确的 canonical 自指': 'Confirm the page has correct self-referencing canonical',
  '检查页面加载后的实际渲染内容': 'Check the actual rendered content after page load',
  '修复方法': 'Fix Methods',
  '大幅提升内容质量：增加原创分析、数据、案例': 'Significantly improve content quality: add original analysis, data, and case studies',
  '合并相似页面，用 301 重定向指向最佳版本': 'Merge similar pages with 301 redirects to the best version',
  '添加结构化数据增强页面信号': 'Add structured data to enhance page signals',
  '增加作者信息和发布/更新日期': 'Add author information and publish/update dates',
  '获取外部链接提升页面权威性': 'Acquire external links to boost page authority',
  '验证方法': 'Verification',
  '内容优化后重新请求索引。如果 2-4 周后仍未收录，考虑该页面是否应该合并到其他页面中。': 'Request re-indexing after content optimization. If still not indexed after 2-4 weeks, consider whether the page should be merged into another page.',
  // Discovered not indexed guide
  '什么是"已发现但未编入索引"': 'What is "Discovered - currently not indexed"',
  'Google Search Console 中显示 "Discovered - currently not indexed" 表示 Google 知道这个 URL 存在，但还没有去抓取它。通常意味着 Google 认为这个页面的优先级不够高。': 'Google Search Console showing "Discovered - currently not indexed" means Google knows this URL exists but has not crawled it yet. This usually means Google considers this page not high enough priority.',
  '站点抓取预算不足，Google 优先抓取更重要的页面': 'Insufficient site crawl budget, Google prioritizes crawling more important pages',
  '页面缺少内链支撑，被认为不重要': 'Page lacks internal link support, considered unimportant',
  '新站点或新页面，Google 还没来得及抓取': 'New site or new page, Google has not had time to crawl yet',
  '服务器响应慢，Google 降低了抓取频率': 'Slow server response, Google reduced crawl frequency',
  '页面内容薄弱，Google 预判价值不高': 'Weak page content, Google predicts low value',
  'Sitemap 中 URL 过多，稀释了优先级': 'Too many URLs in sitemap, diluting priority',
  '在 GSC 中确认 URL 状态确实是 "Discovered - currently not indexed"': 'Confirm URL status is indeed "Discovered - currently not indexed" in GSC',
  '检查页面是否有足够的内链指向（至少 2-3 个内链）': 'Check if the page has sufficient internal links (at least 2-3 internal links)',
  '确认页面在 sitemap 中，且 sitemap 已提交给 Google': 'Confirm the page is in the sitemap and the sitemap has been submitted to Google',
  '检查服务器响应时间，确保 TTFB 小于 500ms': 'Check server response time, ensure TTFB is under 500ms',
  '确认 robots.txt 没有屏蔽该 URL': 'Confirm robots.txt is not blocking this URL',
  '检查页面内容是否有实质价值': 'Check if the page content has substantial value',
  '使用 GSC 的 URL 检查工具请求编入索引': 'Use GSC URL Inspection tool to request indexing',
  '等待 1-2 周后再次检查状态变化': 'Wait 1-2 weeks and check status changes again',
  '增加从高权重页面到该页面的内链': 'Add internal links from high-authority pages to this page',
  '精简 sitemap，只保留高质量页面': 'Streamline sitemap, keep only high-quality pages',
  '提升页面内容质量和独特性': 'Improve page content quality and uniqueness',
  '优化服务器性能，减少响应时间': 'Optimize server performance, reduce response time',
  '在 GSC 中手动请求索引': 'Manually request indexing in GSC',
  '修复后在 GSC URL 检查工具中重新提交，观察 1-2 周内状态是否变化。也可以通过 site:yoururl 搜索确认是否已收录。': 'After fixing, resubmit in GSC URL Inspection tool and observe status changes within 1-2 weeks. You can also confirm indexing by searching site:yoururl.',
  // Server error 5xx guide
  '什么是 5xx 服务器错误': 'What are 5xx Server Errors',
  'GSC 报告 5xx 错误表示 Googlebot 在抓取时收到了服务器错误响应。常见的有 500（内部错误）、502（网关错误）、503（服务不可用）、504（网关超时）。': 'GSC reporting 5xx errors means Googlebot received server error responses during crawling. Common ones include 500 (Internal Error), 502 (Gateway Error), 503 (Service Unavailable), 504 (Gateway Timeout).',
  '如何定位具体 URL': 'How to Identify Specific URLs',
  'GSC - 索引 - 页面 - 筛选"服务器错误 (5xx)"': 'GSC - Indexing - Pages - Filter "Server error (5xx)"',
  '导出完整 URL 列表进行批量检查': 'Export complete URL list for batch checking',
  '检查服务器访问日志中 Googlebot 的请求记录': 'Check Googlebot request records in server access logs',
  '服务器资源不足（CPU/内存/连接数耗尽）': 'Insufficient server resources (CPU/memory/connections exhausted)',
  '应用代码错误（未处理的异常）': 'Application code errors (unhandled exceptions)',
  '数据库连接超时或查询过慢': 'Database connection timeout or slow queries',
  'CDN 或反向代理配置错误': 'CDN or reverse proxy misconfiguration',
  '服务器对爬虫限流过于激进': 'Server rate limiting crawlers too aggressively',
  'SSL 证书问题导致 HTTPS 握手失败': 'SSL certificate issues causing HTTPS handshake failure',
  '检查服务器错误日志，定位具体错误信息': 'Check server error logs to identify specific error messages',
  '确认服务器资源是否充足': 'Confirm server resources are sufficient',
  '检查是否有针对爬虫的限流规则过于严格': 'Check if rate limiting rules for crawlers are too strict',
  '优化慢查询和耗时操作': 'Optimize slow queries and time-consuming operations',
  '配置合理的超时时间和重试机制': 'Configure reasonable timeout and retry mechanisms',
  '确保 CDN 回源配置正确': 'Ensure CDN origin configuration is correct',
  '修复后使用 GSC URL 检查工具测试实时抓取，确认返回 200。持续监控 GSC 抓取统计报告。': 'After fixing, use GSC URL Inspection tool to test live crawl and confirm 200 response. Continue monitoring GSC crawl stats report.',
  // Common section headings across all guides
  '正确配置示例': 'Correct Configuration Example',
  '常见错误': 'Common Errors',
  '检查方法': 'How to Check',
  '解决方案': 'Solutions',
  '配置方法': 'Configuration',
  '达标阈值': 'Passing Thresholds',
  '功能对比': 'Feature Comparison',
  '渲染方案对比': 'Rendering Approach Comparison',
  '第一周检查清单': 'First Week Checklist',
  '首批提交规则': 'Initial Submission Rules',
  'CMS 集成': 'CMS Integration',
  '评分标准': 'Scoring Criteria',
  // Canonical guide
  '什么是 Canonical 自指': 'What is Self-Referencing Canonical',
  '为什么需要自指': 'Why Self-Referencing is Needed',
  '防止带参数的 URL 被当作独立页面': 'Prevent URLs with parameters from being treated as separate pages',
  '明确声明内容归属，避免被判定为重复': 'Clearly declare content ownership to avoid being flagged as duplicate',
  '统一链接权重到正式 URL': 'Consolidate link equity to the official URL',
  '处理 HTTP/HTTPS、www/non-www 的变体': 'Handle HTTP/HTTPS, www/non-www variants',
  '所有页面 canonical 都指向首页（最常见的严重错误）': 'All pages canonical pointing to homepage (most common serious error)',
  'canonical 使用相对路径而非绝对 URL': 'Canonical using relative path instead of absolute URL',
  'canonical URL 与实际 URL 的协议不一致': 'Canonical URL protocol inconsistent with actual URL',
  'canonical 指向 404 页面': 'Canonical pointing to 404 page',
  'canonical 指向重定向链中的 URL': 'Canonical pointing to URL in redirect chain',
  '动态页面 canonical 包含会话参数': 'Dynamic page canonical contains session parameters',
  // Sitemap guide
  'Sitemap 的作用': 'Purpose of Sitemap',
  'Sitemap 告诉搜索引擎你的站点有哪些页面值得抓取和收录。它不是保证收录的手段，而是一个发现机制。': 'Sitemap tells search engines which pages on your site are worth crawling and indexing. It is not a guarantee of indexing, but a discovery mechanism.',
  '应该放入 Sitemap 的页面': 'Pages That Should Be in Sitemap',
  '不应该放入 Sitemap 的内容': 'Content That Should Not Be in Sitemap',
  '所有希望被收录的公开页面': 'All public pages you want indexed',
  '返回 200 状态码的页面': 'Pages returning 200 status code',
  '有 canonical 自指的页面': 'Pages with self-referencing canonical',
  '没有 noindex 的页面': 'Pages without noindex',
  '有实质内容的页面': 'Pages with substantial content',
  '非 HTML 文件（PDF、图片用媒体 sitemap）': 'Non-HTML files (use media sitemap for PDFs, images)',
  '带参数的重复 URL': 'Duplicate URLs with parameters',
  '已设置 noindex 的页面': 'Pages with noindex set',
  '301/302 重定向的源 URL': 'Source URLs of 301/302 redirects',
  '返回 4xx/5xx 的 URL': 'URLs returning 4xx/5xx',
  '低质量标签页、空分类页': 'Low-quality tag pages, empty category pages',
  '内部搜索结果页': 'Internal search result pages',
  '需要登录的页面': 'Pages requiring login',
  '新站首次提交不超过 1000 个 URL': 'New sites should submit no more than 1000 URLs initially',
  '优先提交最重要、内容最充实的页面': 'Prioritize submitting the most important pages with richest content',
  '确保每个 URL 都能正常访问（200 状态码）': 'Ensure every URL is accessible (200 status code)',
  '使用 lastmod 标注真实的最后修改时间': 'Use lastmod to mark the actual last modification time',
  '提交后在 GSC 中监控索引覆盖率变化': 'Monitor index coverage changes in GSC after submission',
  '根据收录情况逐步增加 URL': 'Gradually add URLs based on indexing results',
  'Sitemap 格式示例': 'Sitemap Format Example',
  // AI readability guide
  'AI 搜索引擎如何理解页面': 'How AI Search Engines Understand Pages',
  'AI 搜索引擎看重什么': 'What AI Search Engines Value',
  '优化方法': 'Optimization Methods',
  '清晰的内容结构（标题层级、段落分明）': 'Clear content structure (heading hierarchy, distinct paragraphs)',
  '可直接提取的答案（定义、步骤、列表）': 'Directly extractable answers (definitions, steps, lists)',
  '权威性信号（作者、来源、更新日期）': 'Authority signals (author, source, update date)',
  '结构化数据（JSON-LD，特别是 FAQ）': 'Structured data (JSON-LD, especially FAQ)',
  '内容的时效性（dateModified）': 'Content timeliness (dateModified)',
  '足够的内容深度': 'Sufficient content depth',
  '每个页面有且只有一个 H1，清晰表达主题': 'Each page should have exactly one H1 that clearly expresses the topic',
  '使用 H2/H3 组织内容层级': 'Use H2/H3 to organize content hierarchy',
  '在正文开头提供简洁的摘要或定义': 'Provide a concise summary or definition at the beginning',
  '使用有序列表呈现步骤，无序列表呈现要点': 'Use ordered lists for steps, unordered lists for key points',
  '添加 FAQ 结构化数据': 'Add FAQ structured data',
  '标注作者信息和最后更新日期': 'Mark author information and last update date',
  '确保正文超过 300 字': 'Ensure body text exceeds 300 words',
  '添加内链到相关内容': 'Add internal links to related content',
  '检查项': 'Check Item',
  '分值': 'Score',
  '说明': 'Description',
  '页面主题明确': 'Page topic is clear',
  '摘要可被引用': 'Summary can be cited',
  '问答可直接提取': 'Q&A can be directly extracted',
  '内容有归属': 'Content has attribution',
  '内容有时效性': 'Content has timeliness',
  '内容有深度': 'Content has depth',
  '机器可读': 'Machine readable',
  '主题关联': 'Topic relevance',
  '允许索引': 'Indexing allowed',
  // hreflang guide
  '什么是 hreflang': 'What is hreflang',
  '正确配置示例': 'Correct Configuration Example',
  // Robots guide
  '什么是 Robots 屏蔽': 'What is Robots Blocking',
  // JS rendering guide
  '搜索引擎如何处理 JavaScript': 'How Search Engines Handle JavaScript',
  'JS 渲染问题': 'JS Rendering Issues',
  // New site guide
  '新站首月 SEO 概述': 'New Site First Month SEO Overview',
  // IndexNow guide
  '什么是 IndexNow': 'What is IndexNow',
  // Core Web Vitals guide
  '什么是 Core Web Vitals': 'What are Core Web Vitals',
  // Bing vs GSC guide
  'Bing Webmaster Tools 与 GSC 概述': 'Bing Webmaster Tools vs GSC Overview',
  // Common phrases across guides
  '使用': 'Use',
  '检查你的': 'check your',
  '粘贴你的页面源码进行检查。': 'paste your page source code to check.',
  '检查你的 canonical 配置。': 'check your canonical configuration.',
  '检查你的页面得分。': 'check your page score.',
  '检查 URL 列表格式。': 'check URL list format.',
  'Canonical 检查器': 'Canonical Checker',
  'Sitemap 审计工具': 'Sitemap Audit Tool',
  'HTML 可读性检查工具': 'HTML Readability Check Tool',
  // Privacy page body
  '最后更新：2024 年 1 月': 'Last updated: January 2024',
  '数据收集': 'Data Collection',
  '本站的所有诊断工具完全在浏览器本地运行。你输入的 HTML 源码、URL 列表、robots.txt 内容等数据不会被发送到任何服务器，不会被存储、分析或与第三方共享。': 'All diagnostic tools on this site run entirely in your browser. Your HTML source code, URL lists, robots.txt content, and other data are never sent to any server, stored, analyzed, or shared with third parties.',
  'Cookies': 'Cookies',
  '本站不使用 cookies 追踪用户行为。': 'This site does not use cookies to track user behavior.',
  '第三方服务': 'Third-Party Services',
  '本站不集成任何第三方分析或广告服务。': 'This site does not integrate any third-party analytics or advertising services.',
  '如对隐私政策有疑问，请联系': 'For questions about the privacy policy, please contact',
  // Disclaimer page body
  '工具准确性': 'Tool Accuracy',
  '本站提供的诊断工具基于常见规则进行检查，结果仅供参考。工具无法覆盖所有边缘情况，不能替代专业的 SEO 审计。': 'The diagnostic tools on this site check based on common rules and results are for reference only. Tools cannot cover all edge cases and cannot replace professional SEO audits.',
  '指南内容': 'Guide Content',
  '排查指南基于公开的搜索引擎文档和行业最佳实践编写。搜索引擎的算法和规则可能随时变化，我们会尽力保持内容更新，但不保证所有信息在任何时间点都完全准确。': 'Troubleshooting guides are written based on public search engine documentation and industry best practices. Search engine algorithms and rules may change at any time. We strive to keep content updated but cannot guarantee all information is completely accurate at any given time.',
  '结果不保证': 'No Guarantee of Results',
  '使用本站工具和指南不保证页面一定会被搜索引擎收录。收录决定权在搜索引擎，受多种因素影响。': 'Using this site\'s tools and guides does not guarantee that pages will be indexed by search engines. Indexing decisions are made by search engines and are influenced by multiple factors.',
  '如有疑问请联系': 'For questions, please contact',
  // Robots guide body
  'Robots.txt 基础': 'Robots.txt Basics',
  'Robots.txt 语法': 'Robots.txt Syntax',
  'Meta Robots 标签': 'Meta Robots Tag',
  'X-Robots-Tag HTTP 头': 'X-Robots-Tag HTTP Header',
  '常见误屏蔽场景': 'Common Accidental Blocking Scenarios',
  'robots.txt 中 Disallow: / 屏蔽了整站': 'robots.txt Disallow: / blocking the entire site',
  '测试环境的 noindex 标签被带到了生产环境': 'noindex tag from test environment carried to production',
  'CMS 的"阻止搜索引擎索引"选项被勾选': 'CMS "Discourage search engines" option is checked',
  'CDN 或服务器配置添加了全局 X-Robots-Tag': 'CDN or server configuration added global X-Robots-Tag',
  '框架默认给某些路由加了 noindex': 'Framework adds noindex to certain routes by default',
  '访问 /robots.txt 检查是否有过度屏蔽': 'Visit /robots.txt to check for over-blocking',
  '查看页面源码搜索 "noindex"': 'View page source and search for "noindex"',
  '用开发者工具检查响应头中的 X-Robots-Tag': 'Use developer tools to check X-Robots-Tag in response headers',
  '检查 CMS 后台的 SEO 设置': 'Check CMS backend SEO settings',
  '确认 CDN 配置没有添加额外的 robots 头': 'Confirm CDN configuration has not added extra robots headers',
  'Robots 检查器': 'Robots Checker',
  '粘贴你的 robots.txt 或 meta 标签进行检查。': 'paste your robots.txt or meta tags to check.',
  'robots.txt 是放在网站根目录的文本文件，告诉爬虫哪些路径可以抓取、哪些不可以。注意：robots.txt 只是建议，不是强制屏蔽。': 'robots.txt is a text file placed in the website root directory that tells crawlers which paths can be crawled and which cannot. Note: robots.txt is only a suggestion, not a mandatory block.',
  // Tool page labels
  '检查': 'Check',
  '开始审计': 'Start Audit',
  '粘贴 sitemap URL 列表（每行一个）': 'Paste sitemap URL list (one per line)',
  '页面 URL': 'Page URL',
  'Canonical 值': 'Canonical Value',
  '粘贴 robots.txt 内容或 meta robots 标签': 'Paste robots.txt content or meta robots tag',
  // HTML readability guide body
  '为什么初始 HTML 很重要': 'Why Initial HTML Matters',
  '搜索引擎首次抓取页面时，主要读取服务器返回的初始 HTML。虽然 Google 可以执行 JavaScript，但这需要额外的抓取资源和时间，且不保证完整渲染。': 'When search engines first crawl a page, they primarily read the initial HTML returned by the server. While Google can execute JavaScript, this requires additional crawl resources and time, with no guarantee of complete rendering.',
  '初始 HTML 必须包含什么': 'What Initial HTML Must Contain',
  '完整的 title 标签（不是 JS 动态设置的）': 'Complete title tag (not dynamically set by JS)',
  'meta description 标签': 'meta description tag',
  '至少一个 H1 标签包含页面主题': 'At least one H1 tag containing the page topic',
  '页面核心正文内容（不依赖 JS 加载）': 'Core page body content (not dependent on JS loading)',
  'canonical 标签': 'canonical tag',
  '结构化数据（JSON-LD）': 'Structured data (JSON-LD)',
  '内部导航链接': 'Internal navigation links',
  'SPA 没有 SSR/SSG，初始 HTML 只有空 div': 'SPA without SSR/SSG, initial HTML only has empty div',
  '内容通过 AJAX 异步加载': 'Content loaded asynchronously via AJAX',
  '关键内容在 JS 执行后才插入 DOM': 'Key content only inserted into DOM after JS execution',
  '使用 client-side routing，服务器对所有路由返回相同 HTML': 'Using client-side routing, server returns same HTML for all routes',
  '使用 SSR（服务端渲染）或 SSG（静态生成）': 'Use SSR (Server-Side Rendering) or SSG (Static Site Generation)',
  '确保关键内容在初始 HTML 中可见': 'Ensure key content is visible in initial HTML',
  '使用 Next.js、Nuxt.js 等支持 SSR 的框架': 'Use frameworks that support SSR like Next.js, Nuxt.js',
  '对纯客户端应用考虑预渲染方案': 'Consider pre-rendering solutions for pure client-side apps',
  // Privacy/Disclaimer page
  '隐私政策': 'Privacy Policy',
  // Disclaimer
  '免责声明': 'Disclaimer',
};

// Merge all translations
const allTranslations = { ...translations, ...translations2 };

// ============ CORE BUILD LOGIC ============

function getAllHtmlFiles(dir, baseDir) {
  baseDir = baseDir || dir;
  let results = [];
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      // Skip zh/ and en/ directories when scanning from SITE_DIR
      if (dir === SITE_DIR && (item === 'zh' || item === 'en')) continue;
      results = results.concat(getAllHtmlFiles(fullPath, baseDir));
    } else if (item.endsWith('.html')) {
      results.push(fullPath);
    }
  }
  return results;
}

function getRelativePath(filePath) {
  return path.relative(SITE_DIR, filePath).replace(/\\/g, '/');
}

function computeDepth(relPath) {
  const parts = relPath.split('/');
  return parts.length - 1;
}

function translateText(text) {
  let result = text;
  // Sort by length descending to match longer phrases first
  const keys = Object.keys(allTranslations).sort((a, b) => b.length - a.length);
  for (const zh of keys) {
    const en = allTranslations[zh];
    result = result.split(zh).join(en);
  }
  return result;
}

function buildLangSwitcher(lang, relPath) {
  const cleanPath = relPath.replace(/\.html$/, '');
  const zhUrl = `${DOMAIN}/zh/${cleanPath}`;
  const enUrl = `${DOMAIN}/en/${cleanPath}`;
  if (lang === 'zh') {
    return `<div class="lang-switch"><a href="${enUrl}" hreflang="en">English</a></div>`;
  } else {
    return `<div class="lang-switch"><a href="${zhUrl}" hreflang="zh-CN">中文</a></div>`;
  }
}

function buildHreflangTags(relPath) {
  const cleanPath = relPath.replace(/\.html$/, '').replace(/index$/, '');
  const zhUrl = `${DOMAIN}/zh/${cleanPath}`;
  const enUrl = `${DOMAIN}/en/${cleanPath}`;
  return `<link rel="alternate" hreflang="zh-CN" href="${zhUrl}">
<link rel="alternate" hreflang="en" href="${enUrl}">
<link rel="alternate" hreflang="x-default" href="${zhUrl}">`;
}

function processHtmlForLang(html, lang, relPath) {
  const depth = computeDepth(relPath);

  let result = html;

  // Fix lang attribute
  if (lang === 'en') {
    result = result.replace(/lang="zh-CN"/, 'lang="en"');
  }

  // Fix JSON-LD URLs FIRST (before we change canonical/og:url)
  // Replace domain-only URLs in JSON-LD scripts
  const domainEsc = DOMAIN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  result = result.replace(/(type="application\/ld\+json">)([\s\S]*?)(<\/script>)/g, (match, open, json, close) => {
    // Replace all domain URLs in JSON-LD with lang-prefixed versions
    let fixed = json.replace(new RegExp(`${domainEsc}/`, 'g'), `${DOMAIN}/${lang}/`);
    // Fix double-slash: /lang// -> /lang/
    fixed = fixed.replace(new RegExp(`${domainEsc}/${lang}//`, 'g'), `${DOMAIN}/${lang}/`);
    return open + fixed + close;
  });

  // Fix canonical URL
  const canonicalPath = relPath.replace(/\.html$/, '').replace(/index$/, '');
  const newCanonical = `${DOMAIN}/${lang}/${canonicalPath}`;
  result = result.replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${newCanonical}">`);

  // Add hreflang tags after canonical
  const hreflangTags = buildHreflangTags(relPath);
  result = result.replace(/(<link rel="canonical" href="[^"]*">)/, `$1\n${hreflangTags}`);

  // Fix og:url
  result = result.replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${newCanonical}">`);

  // Fix resource paths (CSS, JS, favicon, internal links)
  if (depth === 0) {
    // Root level files: ./ -> ../
    result = result.replace(/(href|src)="\.\/assets\//g, '$1="../assets/');
    result = result.replace(/(href|src)="\.\/favicon\.svg"/g, '$1="../favicon.svg"');
    // Internal links at root level
    result = result.replace(/href="\.\/index\.html/g, `href="../${lang}/index.html`);
    result = result.replace(/href="\.\/diagnose\//g, `href="../${lang}/diagnose/`);
    result = result.replace(/href="\.\/guides\//g, `href="../${lang}/guides/`);
    result = result.replace(/href="\.\/tools\//g, `href="../${lang}/tools/`);
    result = result.replace(/href="\.\/pages\//g, `href="../${lang}/pages/`);
    result = result.replace(/href="\.\/#/g, `href="../${lang}/index.html#`);
  } else {
    // Subdirectory files: ../ -> ../../
    result = result.replace(/(href|src)="\.\.\/assets\//g, '$1="../../assets/');
    result = result.replace(/(href|src)="\.\.\/favicon\.svg"/g, '$1="../../favicon.svg"');
    // Internal links in subdirectories
    result = result.replace(/href="\.\.\/index\.html#/g, `href="../../${lang}/index.html#`);
    result = result.replace(/href="\.\.\/index\.html/g, `href="../../${lang}/index.html`);
    result = result.replace(/href="\.\.\/diagnose\//g, `href="../../${lang}/diagnose/`);
    result = result.replace(/href="\.\.\/guides\//g, `href="../../${lang}/guides/`);
    result = result.replace(/href="\.\.\/tools\//g, `href="../../${lang}/tools/`);
    result = result.replace(/href="\.\.\/pages\//g, `href="../../${lang}/pages/`);
  }

  // Add language switcher in header nav
  const langSwitcher = buildLangSwitcher(lang, relPath);
  result = result.replace(/<\/nav>/, `${langSwitcher}\n</nav>`);

  // Translate content for English
  if (lang === 'en') {
    result = translateText(result);
  }

  return result;
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function buildLanguageVersion(lang) {
  const langDir = path.join(SITE_DIR, lang);
  ensureDir(langDir);

  const htmlFiles = getAllHtmlFiles(SITE_DIR);
  let count = 0;

  for (const filePath of htmlFiles) {
    const relPath = getRelativePath(filePath);
    const html = fs.readFileSync(filePath, 'utf-8');
    const processed = processHtmlForLang(html, lang, relPath);

    const outPath = path.join(langDir, relPath);
    ensureDir(path.dirname(outPath));
    fs.writeFileSync(outPath, processed, 'utf-8');
    count++;
  }

  console.log(`[${lang}] Generated ${count} files in ${langDir}`);
  return count;
}

function buildLanguageVersionFromSource(lang, sourceDir) {
  // Build a language version using sourceDir as the source
  // sourceDir might be zh/ which already has lang-specific modifications
  const langDir = path.join(SITE_DIR, lang);
  ensureDir(langDir);

  const htmlFiles = getAllHtmlFiles(sourceDir);
  let count = 0;

  for (const filePath of htmlFiles) {
    const relPath = path.relative(sourceDir, filePath).replace(/\\/g, '/');
    let html = fs.readFileSync(filePath, 'utf-8');

    // If source is zh/, we need to reverse the zh-specific path modifications first
    if (sourceDir.endsWith('zh') || sourceDir.endsWith('zh/') || sourceDir.endsWith('zh\\')) {
      // Reverse zh paths back to original relative paths
      const depth = computeDepth(relPath);
      if (depth === 0) {
        html = html.replace(/href="\.\.\/zh\//g, 'href="./');
        html = html.replace(/(href|src)="\.\.\/assets\//g, '$1="./assets/');
        html = html.replace(/(href|src)="\.\.\/favicon\.svg"/g, '$1="./favicon.svg"');
      } else {
        html = html.replace(/href="\.\.\/\.\.\/zh\//g, 'href="../');
        html = html.replace(/(href|src)="\.\.\/\.\.\/assets\//g, '$1="../assets/');
        html = html.replace(/(href|src)="\.\.\/\.\.\/favicon\.svg"/g, '$1="../favicon.svg"');
      }
      // Remove existing hreflang tags and lang-switch
      html = html.replace(/<link rel="alternate" hreflang="[^"]*" href="[^"]*">\n?/g, '');
      html = html.replace(/<div class="lang-switch">.*?<\/div>\n?/g, '');
      // Reset canonical to original
      const canonicalPath = relPath.replace(/\.html$/, '').replace(/index$/, '');
      html = html.replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${DOMAIN}/${canonicalPath}">`);
      // Reset og:url
      html = html.replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${DOMAIN}/${canonicalPath}">`);
      // Reset JSON-LD URLs from /zh/ back to /
      html = html.replace(new RegExp(`${DOMAIN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/zh/`, 'g'), `${DOMAIN}/`);
    }

    const processed = processHtmlForLang(html, lang, relPath);

    const outPath = path.join(langDir, relPath);
    ensureDir(path.dirname(outPath));
    fs.writeFileSync(outPath, processed, 'utf-8');
    count++;
  }

  console.log(`[${lang}] Generated ${count} files in ${langDir}`);
  return count;
}

// PLACEHOLDER_ROOT_INDEX

function buildRootIndex() {
  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>AI Search Visibility & GSC Indexing Diagnostics</title>
<meta name="description" content="AI Search Visibility & GSC Indexing Diagnostics - Choose your language">
<link rel="canonical" href="${DOMAIN}/">
<link rel="alternate" hreflang="zh-CN" href="${DOMAIN}/zh/">
<link rel="alternate" hreflang="en" href="${DOMAIN}/en/">
<link rel="alternate" hreflang="x-default" href="${DOMAIN}/zh/">
<link rel="icon" type="image/svg+xml" href="./favicon.svg">
<script>
(function() {
  var lang = navigator.language || navigator.userLanguage || '';
  if (lang.startsWith('zh')) {
    window.location.replace('./zh/index.html');
  } else {
    window.location.replace('./en/index.html');
  }
})();
</script>
<style>
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #f8f9fa; }
.lang-select { text-align: center; }
.lang-select h1 { margin-bottom: 24px; font-size: 24px; }
.lang-select a { display: inline-block; margin: 0 16px; padding: 12px 32px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 8px; font-size: 16px; }
.lang-select a:hover { background: #1d4ed8; }
</style>
</head>
<body>
<div class="lang-select">
  <h1>Choose Language / 选择语言</h1>
  <a href="./zh/index.html">中文</a>
  <a href="./en/index.html">English</a>
</div>
</body>
</html>`;
  fs.writeFileSync(path.join(SITE_DIR, 'index.html'), html, 'utf-8');
  console.log('[root] Generated language detection index.html');
}

function buildSitemap() {
  // Use zh/ directory to enumerate pages
  const zhDir = path.join(SITE_DIR, 'zh');
  const sourceDir = fs.existsSync(zhDir) ? zhDir : SITE_DIR;
  const htmlFiles = getAllHtmlFiles(sourceDir);
  const today = new Date().toISOString().split('T')[0];
  let urls = [];

  // Root
  urls.push(`  <url>
    <loc>${DOMAIN}/</loc>
    <lastmod>${today}</lastmod>
    <xhtml:link rel="alternate" hreflang="zh-CN" href="${DOMAIN}/zh/" />
    <xhtml:link rel="alternate" hreflang="en" href="${DOMAIN}/en/" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${DOMAIN}/zh/" />
  </url>`);

  for (const filePath of htmlFiles) {
    const relPath = path.relative(sourceDir, filePath).replace(/\\/g, '/').replace(/\.html$/, '').replace(/index$/, '');
    const zhUrl = `${DOMAIN}/zh/${relPath}`;
    const enUrl = `${DOMAIN}/en/${relPath}`;

    urls.push(`  <url>
    <loc>${zhUrl}</loc>
    <lastmod>${today}</lastmod>
    <xhtml:link rel="alternate" hreflang="zh-CN" href="${zhUrl}" />
    <xhtml:link rel="alternate" hreflang="en" href="${enUrl}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${zhUrl}" />
  </url>`);
    urls.push(`  <url>
    <loc>${enUrl}</loc>
    <lastmod>${today}</lastmod>
    <xhtml:link rel="alternate" hreflang="zh-CN" href="${zhUrl}" />
    <xhtml:link rel="alternate" hreflang="en" href="${enUrl}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${zhUrl}" />
  </url>`);
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>`;

  fs.writeFileSync(path.join(SITE_DIR, 'sitemap.xml'), sitemap, 'utf-8');
  console.log(`[sitemap] Generated sitemap.xml with ${urls.length} URLs`);
}

// ============ EXECUTE ============
console.log('Building i18n site...');
console.log('Site directory:', SITE_DIR);

// Determine source: use zh/ as source if root HTML files don't exist
const ZH_DIR = path.join(SITE_DIR, 'zh');
let SOURCE_DIR = SITE_DIR;
const rootHtmlFiles = getAllHtmlFiles(SITE_DIR);
if (rootHtmlFiles.length === 0 || (rootHtmlFiles.length === 1 && rootHtmlFiles[0].endsWith('index.html'))) {
  // Root only has the language detection index.html or no HTML files
  // Use zh/ as source (strip the zh-specific modifications)
  SOURCE_DIR = ZH_DIR;
  console.log('Using zh/ as source directory (root content pages already removed)');
}

// Clean previous builds
const zhDir = path.join(SITE_DIR, 'zh');
const enDir = path.join(SITE_DIR, 'en');
if (SOURCE_DIR !== ZH_DIR) {
  // Only clean if we're building from root source
  if (fs.existsSync(zhDir)) fs.rmSync(zhDir, { recursive: true });
}
if (fs.existsSync(enDir)) fs.rmSync(enDir, { recursive: true });

// Step 1: Build zh/ version (Chinese, with hreflang and lang switcher)
if (SOURCE_DIR !== ZH_DIR) {
  buildLanguageVersion('zh');
}

// Step 2: Build en/ version (English translation)
buildLanguageVersionFromSource('en', SOURCE_DIR);

// Step 3: Generate root index.html with language detection
buildRootIndex();

// Step 4: Generate sitemap.xml
buildSitemap();

console.log('\nDone! Multi-language site built successfully.');
