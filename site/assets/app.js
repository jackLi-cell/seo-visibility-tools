/**
 * AI 搜索可见性与 GSC 诊断站 - 前端交互
 * 所有工具本地处理，不上传数据
 */

(function () {
  'use strict';

  // === 诊断向导 ===
  const wizardData = {
    questions: [
      {
        id: 'q1',
        text: 'URL 返回什么状态码？',
        options: [
          { label: '200（正常）', value: '200' },
          { label: '3xx（重定向）', value: '3xx' },
          { label: '4xx（未找到）', value: '4xx' },
          { label: '5xx（服务器错误）', value: '5xx' },
          { label: '不确定', value: 'unknown' }
        ]
      },
      {
        id: 'q2',
        text: '页面有没有 noindex 标记？',
        options: [
          { label: '有 noindex', value: 'yes' },
          { label: '没有 noindex', value: 'no' },
          { label: '不确定', value: 'unknown' }
        ]
      },
      {
        id: 'q3',
        text: 'Canonical 标签指向哪里？',
        options: [
          { label: '指向自己（自指）', value: 'self' },
          { label: '指向其他页面', value: 'other' },
          { label: '指向首页', value: 'home' },
          { label: '没有 canonical', value: 'none' }
        ]
      },
      {
        id: 'q4',
        text: 'URL 在 sitemap 中吗？',
        options: [
          { label: '在 sitemap 中', value: 'yes' },
          { label: '不在 sitemap 中', value: 'no' },
          { label: '不确定', value: 'unknown' }
        ]
      },
      {
        id: 'q5',
        text: '初始 HTML 中有正文内容吗？',
        options: [
          { label: '有完整正文', value: 'yes' },
          { label: '只有 JS 框架代码', value: 'js-only' },
          { label: '不确定', value: 'unknown' }
        ]
      }
    ]
  };

  function initWizard() {
    const container = document.getElementById('wizard-app');
    if (!container) return;

    let answers = {};
    let currentStep = 0;

    function render() {
      if (currentStep < wizardData.questions.length) {
        const q = wizardData.questions[currentStep];
        container.innerHTML = `
          <div class="wizard-question">
            <p style="font-size:13px;color:var(--color-text-secondary);margin-bottom:8px;">问题 ${currentStep + 1} / ${wizardData.questions.length}</p>
            <h3>${q.text}</h3>
            <div class="wizard-options">
              ${q.options.map(o => `<button data-value="${o.value}">${o.label}</button>`).join('')}
            </div>
          </div>`;
        container.querySelectorAll('.wizard-options button').forEach(btn => {
          btn.addEventListener('click', () => {
            answers[q.id] = btn.dataset.value;
            currentStep++;
            render();
          });
        });
      } else {
        showResult();
      }
    }

    function showResult() {
      const diagnosis = generateDiagnosis(answers);
      container.innerHTML = `
        <div class="wizard-diagnosis-result">
          <h3>诊断结果</h3>
          <div class="diagnosis-causes">
            <h4>最可能的原因</h4>
            <ul>${diagnosis.causes.map(c => `<li>${c}</li>`).join('')}</ul>
          </div>
          <div class="diagnosis-steps">
            <h4>推荐排查顺序</h4>
            <ol>${diagnosis.steps.map(s => `<li>${s}</li>`).join('')}</ol>
          </div>
          ${diagnosis.tools.length > 0 ? `
          <div class="diagnosis-links">
            <h4>相关工具</h4>
            <ul>${diagnosis.tools.map(t => `<li><a href="${t.url}">${t.name}</a></li>`).join('')}</ul>
          </div>` : ''}
          ${diagnosis.guides.length > 0 ? `
          <div class="diagnosis-links">
            <h4>相关指南</h4>
            <ul>${diagnosis.guides.map(g => `<li><a href="${g.url}">${g.name}</a></li>`).join('')}</ul>
          </div>` : ''}
        </div>
        <button class="btn btn-secondary" style="margin-top:16px;" id="wizard-restart">重新诊断</button>`;
      document.getElementById('wizard-restart').addEventListener('click', () => {
        answers = {};
        currentStep = 0;
        render();
      });
    }

    function generateDiagnosis(a) {
      const result = { causes: [], steps: [], tools: [], guides: [] };

      if (a.q1 === '5xx') {
        result.causes.push('服务器返回 5xx 错误，Googlebot 无法正常抓取页面');
        result.steps.push('检查服务器错误日志，定位具体错误信息');
        result.steps.push('确认服务器资源（CPU/内存）是否充足');
        result.steps.push('检查是否有针对爬虫的限流规则');
        result.steps.push('修复后使用 GSC URL 检查工具验证');
        result.guides.push({ name: '5xx 服务器错误排查指南', url: '/guides/server-error-5xx.html' });
      }
      if (a.q1 === '4xx') {
        result.causes.push('页面返回 4xx 错误（404/410），URL 不存在或已删除');
        result.steps.push('确认 URL 拼写是否正确');
        result.steps.push('检查是否需要设置 301 重定向到新 URL');
        result.steps.push('从 sitemap 中移除无效 URL');
        result.tools.push({ name: 'Sitemap 审计工具', url: '/tools/sitemap-audit.html' });
      }
      if (a.q1 === '3xx') {
        result.causes.push('页面存在重定向，搜索引擎会跟踪到最终 URL');
        result.steps.push('确认重定向目标 URL 是否正确');
        result.steps.push('检查是否存在重定向链（多次跳转）');
        result.steps.push('确保 sitemap 和内链使用最终 URL');
      }
      if (a.q2 === 'yes') {
        result.causes.push('页面设置了 noindex 标记，搜索引擎被明确告知不收录');
        result.steps.push('检查 HTML 中的 meta robots 标签');
        result.steps.push('检查 HTTP 响应头中的 X-Robots-Tag');
        result.steps.push('确认 CMS 后台是否勾选了"阻止索引"');
        result.steps.push('移除 noindex 后请求重新索引');
        result.tools.push({ name: 'Robots / Noindex 检查器', url: '/tools/robots-checker.html' });
        result.guides.push({ name: 'Robots 与 Noindex 排查指南', url: '/guides/robots-noindex.html' });
      }
      if (a.q3 === 'other' || a.q3 === 'home') {
        result.causes.push('Canonical 标签未自指，搜索引擎将当前页面视为重复内容');
        result.steps.push('修改 canonical 标签指向当前页面自身 URL');
        result.steps.push('检查是否是框架默认配置导致 canonical 指向首页');
        result.steps.push('确认 canonical URL 使用绝对路径且协议正确');
        result.tools.push({ name: 'Canonical 检查器', url: '/tools/canonical-checker.html' });
        result.guides.push({ name: 'Canonical 自指配置指南', url: '/guides/self-referencing-canonical.html' });
      }
      if (a.q3 === 'none') {
        result.causes.push('缺少 canonical 标签，可能导致重复内容问题');
        result.steps.push('为页面添加自指 canonical 标签');
        result.steps.push('确保使用完整的绝对 URL（含 https://）');
        result.tools.push({ name: 'Canonical 检查器', url: '/tools/canonical-checker.html' });
        result.guides.push({ name: 'Canonical 自指配置指南', url: '/guides/self-referencing-canonical.html' });
      }
      if (a.q4 === 'no') {
        result.steps.push('将页面 URL 添加到 sitemap.xml 中');
        result.steps.push('重新提交 sitemap 到 GSC');
        result.tools.push({ name: 'Sitemap 审计工具', url: '/tools/sitemap-audit.html' });
        result.guides.push({ name: 'Sitemap 最佳实践', url: '/guides/sitemap-best-practices.html' });
      }
      if (a.q5 === 'js-only') {
        result.causes.push('初始 HTML 无正文内容，搜索引擎可能无法读取 JS 渲染的内容');
        result.steps.push('使用 curl 确认初始 HTML 是否包含正文');
        result.steps.push('考虑使用 SSR/SSG 方案输出完整 HTML');
        result.steps.push('确保 title、H1、meta description 在初始 HTML 中');
        result.tools.push({ name: 'HTML 可读性检查工具', url: '/tools/html-checker.html' });
        result.guides.push({ name: 'HTML 可读性与 JS 渲染', url: '/guides/html-readability.html' });
        result.guides.push({ name: 'JS 渲染 SEO 指南', url: '/guides/js-rendering-seo.html' });
      }
      if (a.q1 === '200' && a.q2 === 'no' && a.q3 === 'self' && a.q5 === 'yes') {
        result.causes.push('技术配置正常，可能是内容质量或权重不足导致未收录');
        result.steps.push('提升页面内容质量和独特性');
        result.steps.push('增加从高权重页面到该页面的内链');
        result.steps.push('添加结构化数据增强页面信号');
        result.steps.push('在 GSC 中手动请求索引');
        result.tools.push({ name: 'AI 可读性评分器', url: '/tools/ai-readability-scorer.html' });
        result.guides.push({ name: '已抓取未收录排查', url: '/guides/crawled-not-indexed.html' });
      }
      if (a.q2 === 'unknown' || a.q5 === 'unknown') {
        result.steps.push('使用 curl 或浏览器开发者工具查看页面源码确认不确定项');
      }
      if (result.causes.length === 0) {
        result.causes.push('根据回答未发现明显技术问题，建议逐一使用工具深入检查');
      }
      if (result.steps.length === 0) {
        result.steps.push('使用下方工具逐项检查页面配置');
      }
      // Deduplicate tools and guides
      result.tools = result.tools.filter((t, i, arr) => arr.findIndex(x => x.url === t.url) === i);
      result.guides = result.guides.filter((g, i, arr) => arr.findIndex(x => x.url === g.url) === i);
      return result;
    }

    render();
  }

  // === Sitemap 审计工具 ===
  function initSitemapAudit() {
    const container = document.getElementById('tool-sitemap-audit');
    if (!container) return;

    const btn = container.querySelector('.tool-run-btn');
    const textarea = container.querySelector('textarea');
    const resultArea = container.querySelector('.tool-result-area');

    btn.addEventListener('click', () => {
      const input = textarea.value.trim();
      if (!input) { resultArea.innerHTML = '<p class="result-item result-warn">请粘贴 URL 列表</p>'; return; }

      const urls = input.split('\n').map(u => u.trim()).filter(Boolean);
      const results = [];
      const seen = new Set();

      urls.forEach(url => {
        const issues = [];
        let status = 'keep'; // keep, check, remove

        if (seen.has(url)) {
          issues.push('重复 URL');
          status = 'remove';
        }
        seen.add(url);

        if (/\.(pdf|zip|doc|docx|xls|xlsx|ppt|pptx)$/i.test(url)) {
          issues.push('非 HTML 资源');
          status = 'remove';
        } else if (/\.(png|jpg|jpeg|gif|svg|webp|mp4|mp3|avi)$/i.test(url)) {
          issues.push('媒体文件');
          status = 'remove';
        } else if (/\/wp-json\//i.test(url)) {
          issues.push('API 端点');
          status = 'remove';
        } else if (/\/feed\/?$/i.test(url)) {
          issues.push('Feed 地址');
          status = 'remove';
        } else if (/[?&](utm_|fbclid|gclid|sessionid|sid=)/i.test(url)) {
          issues.push('包含追踪/会话参数');
          status = 'remove';
        } else if (/\?/.test(url)) {
          issues.push('包含查询参数');
          status = 'check';
        } else if (/\/tag\//i.test(url)) {
          issues.push('标签聚合页');
          status = 'check';
        } else if (/\/page\/\d+/i.test(url)) {
          issues.push('分页页面');
          status = 'check';
        } else if (/\/(admin|login|register|cart|checkout|account|wp-admin|_next|\.well-known)\//i.test(url)) {
          issues.push('路径含内部文件标识');
          status = 'remove';
        }

        results.push({ url, status, reasons: issues });
      });

      const keepCount = results.filter(r => r.status === 'keep').length;
      const checkCount = results.filter(r => r.status === 'check').length;
      const removeCount = results.filter(r => r.status === 'remove').length;

      let html = `<div class="audit-summary">
        <div class="audit-stat audit-stat-ok"><span class="audit-stat-num">${keepCount}</span><span class="audit-stat-label">建议保留</span></div>
        <div class="audit-stat audit-stat-warn"><span class="audit-stat-num">${checkCount}</span><span class="audit-stat-label">需要检查</span></div>
        <div class="audit-stat audit-stat-error"><span class="audit-stat-num">${removeCount}</span><span class="audit-stat-label">建议移除</span></div>
      </div>`;

      // Group by status
      const groups = [
        { key: 'remove', icon: '❌', label: '建议移除', cls: 'result-error' },
        { key: 'check', icon: '⚠️', label: '需要检查', cls: 'result-warn' },
        { key: 'keep', icon: '✅', label: '建议保留', cls: 'result-ok' }
      ];

      groups.forEach(g => {
        const items = results.filter(r => r.status === g.key);
        if (items.length === 0) return;
        html += `<div style="margin-top:16px;"><h4 style="margin-bottom:8px;">${g.icon} ${g.label}（${items.length} 个）</h4>`;
        items.forEach(r => {
          const reason = r.reasons.length > 0 ? ` <span style="opacity:0.8;">— ${r.reasons.join(', ')}</span>` : '';
          html += `<div class="result-item ${g.cls}"><code>${r.url}</code>${reason}</div>`;
        });
        html += '</div>';
      });

      html += `<div style="margin-top:16px;padding:12px 16px;background:var(--color-bg);border-radius:var(--radius-sm);font-size:13px;">
        <strong>统计：</strong>总计 ${urls.length} 个 URL，建议保留 ${keepCount} 个，需要检查 ${checkCount} 个，建议移除 ${removeCount} 个
      </div>`;

      resultArea.innerHTML = html;
    });
  }

  // === Canonical 检查器 ===
  function initCanonicalChecker() {
    const container = document.getElementById('tool-canonical-checker');
    if (!container) return;

    const btn = container.querySelector('.tool-run-btn');
    const resultArea = container.querySelector('.tool-result-area');

    btn.addEventListener('click', () => {
      const pageUrl = container.querySelector('#canonical-page-url').value.trim();
      const canonicalUrl = container.querySelector('#canonical-value').value.trim();
      if (!pageUrl || !canonicalUrl) {
        resultArea.innerHTML = '<p class="result-item result-warn">请填写页面 URL 和 canonical 值</p>';
        return;
      }

      const results = [];

      // Parse URLs for comparison
      let pageUrlObj, canonicalUrlObj;
      try { pageUrlObj = new URL(pageUrl); } catch (e) { pageUrlObj = null; }
      try { canonicalUrlObj = new URL(canonicalUrl); } catch (e) { canonicalUrlObj = null; }

      if (!pageUrlObj || !canonicalUrlObj) {
        resultArea.innerHTML = '<p class="result-item result-error">URL 格式无效，请输入完整的 URL（含 https://）</p>';
        return;
      }

      // Check protocol mismatch
      if (pageUrlObj.protocol !== canonicalUrlObj.protocol) {
        results.push({ status: 'error', icon: '❌', msg: '协议不一致', detail: `页面使用 ${pageUrlObj.protocol.replace(':', '')} 但 canonical 使用 ${canonicalUrlObj.protocol.replace(':', '')}，可能导致收录异常` });
      }

      // Check domain mismatch
      if (pageUrlObj.hostname !== canonicalUrlObj.hostname) {
        results.push({ status: 'error', icon: '❌', msg: '域名不一致', detail: `页面域名 ${pageUrlObj.hostname} 与 canonical 域名 ${canonicalUrlObj.hostname} 不同，当前页面不会被收录` });
      }

      // Normalize for comparison (remove trailing slash, lowercase)
      const normPage = pageUrlObj.origin + pageUrlObj.pathname.replace(/\/+$/, '');
      const normCanonical = canonicalUrlObj.origin + canonicalUrlObj.pathname.replace(/\/+$/, '');

      if (normPage.toLowerCase() === normCanonical.toLowerCase()) {
        results.push({ status: 'ok', icon: '✅', msg: '自指 canonical（正确）', detail: 'Canonical 指向当前页面自身，配置正确' });
      } else if (canonicalUrlObj.pathname === '/' || canonicalUrlObj.pathname === '') {
        results.push({ status: 'error', icon: '❌', msg: 'Canonical 指向首页', detail: '这通常是框架默认配置错误，会导致当前页面被视为首页的重复内容而不被收录' });
      } else {
        results.push({ status: 'warn', icon: '⚠️', msg: 'Canonical 指向其他页面', detail: `指向 ${canonicalUrl}，请确认这是否是有意为之（如合并重复内容）。如果不是，当前页面将不会被独立收录` });
      }

      // Additional checks
      if (canonicalUrl.includes('?')) {
        results.push({ status: 'warn', icon: '⚠️', msg: 'Canonical 包含查询参数', detail: '通常 canonical 应使用不带参数的干净 URL' });
      }
      if (canonicalUrl.includes('#')) {
        results.push({ status: 'warn', icon: '⚠️', msg: 'Canonical 包含锚点（#）', detail: '搜索引擎会忽略 # 后的内容，建议移除' });
      }
      if (!canonicalUrl.startsWith('http://') && !canonicalUrl.startsWith('https://')) {
        results.push({ status: 'error', icon: '❌', msg: 'Canonical 不是绝对 URL', detail: '必须使用完整的绝对 URL（含协议和域名）' });
      }

      resultArea.innerHTML = results.map(r => `
        <div class="result-item result-${r.status}">
          <div style="font-weight:600;margin-bottom:4px;">${r.icon} ${r.msg}</div>
          <div style="font-size:12px;opacity:0.85;">${r.detail}</div>
        </div>`).join('');
    });
  }

  // === Robots 检查器 ===
  function initRobotsChecker() {
    const container = document.getElementById('tool-robots-checker');
    if (!container) return;

    const btn = container.querySelector('.tool-run-btn');
    const textarea = container.querySelector('textarea');
    const resultArea = container.querySelector('.tool-result-area');

    btn.addEventListener('click', () => {
      const input = textarea.value.trim();
      if (!input) { resultArea.innerHTML = '<p class="result-item result-warn">请粘贴 robots.txt 或 meta robots 内容</p>'; return; }

      const results = [];
      const lower = input.toLowerCase();

      // Check for meta robots
      if (lower.includes('noindex')) {
        results.push({ status: 'error', msg: '检测到 noindex 指令，搜索引擎不会收录此页面' });
      }
      if (lower.includes('nofollow')) {
        results.push({ status: 'warn', msg: '检测到 nofollow 指令，搜索引擎不会跟踪此页面的链接' });
      }

      // Check robots.txt patterns
      if (lower.includes('disallow: /')) {
        const lines = input.split('\n');
        lines.forEach(line => {
          const trimmed = line.trim().toLowerCase();
          if (trimmed === 'disallow: /') {
            results.push({ status: 'error', msg: '"Disallow: /" 会屏蔽整个站点，请确认这是否是你的意图' });
          } else if (trimmed.startsWith('disallow:') && trimmed.length > 10) {
            const path = trimmed.replace('disallow:', '').trim();
            results.push({ status: 'info', msg: `屏蔽路径: ${path}` });
          }
        });
      }

      if (lower.includes('user-agent: *') && lower.includes('disallow: /')) {
        results.push({ status: 'error', msg: '对所有爬虫屏蔽了路径，可能导致页面无法被收录' });
      }

      // Check for common AI crawlers
      const aiCrawlers = ['gptbot', 'chatgpt-user', 'claudebot', 'anthropic', 'perplexitybot', 'bytespider'];
      aiCrawlers.forEach(crawler => {
        if (lower.includes(crawler)) {
          results.push({ status: 'info', msg: `检测到针对 AI 爬虫 "${crawler}" 的规则` });
        }
      });

      if (lower.includes('x-robots-tag')) {
        results.push({ status: 'info', msg: '检测到 X-Robots-Tag HTTP 头配置' });
      }

      if (results.length === 0) {
        results.push({ status: 'ok', msg: '未检测到明显的屏蔽问题' });
      }

      resultArea.innerHTML = results.map(r => `<div class="result-item result-${r.status}">${r.msg}</div>`).join('');
    });
  }

  // === HTML 可读性检查 ===
  function initHtmlChecker() {
    const container = document.getElementById('tool-html-checker');
    if (!container) return;

    const btn = container.querySelector('.tool-run-btn');
    const textarea = container.querySelector('textarea');
    const resultArea = container.querySelector('.tool-result-area');

    btn.addEventListener('click', () => {
      const html = textarea.value.trim();
      if (!html) { resultArea.innerHTML = '<p class="result-item result-warn">请粘贴 HTML 源码</p>'; return; }

      const results = [];

      // Check title
      const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/is);
      if (titleMatch && titleMatch[1].trim()) {
        results.push({ status: 'ok', msg: `Title: "${titleMatch[1].trim().substring(0, 60)}"` });
      } else {
        results.push({ status: 'error', msg: '缺少 <title> 标签' });
      }

      // Check H1
      const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/is);
      if (h1Match && h1Match[1].trim()) {
        results.push({ status: 'ok', msg: `H1: "${h1Match[1].replace(/<[^>]+>/g, '').trim().substring(0, 60)}"` });
      } else {
        results.push({ status: 'error', msg: '缺少 <h1> 标签' });
      }

      // Check meta description
      const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["'](.*?)["']/is) ||
                         html.match(/<meta[^>]*content=["'](.*?)["'][^>]*name=["']description["']/is);
      if (descMatch && descMatch[1].trim()) {
        results.push({ status: 'ok', msg: `Description: "${descMatch[1].trim().substring(0, 80)}"` });
      } else {
        results.push({ status: 'error', msg: '缺少 meta description' });
      }

      // Check body text content
      const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      if (bodyMatch) {
        const textContent = bodyMatch[1].replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, '').trim();
        if (textContent.length > 300) {
          results.push({ status: 'ok', msg: `正文内容: ${textContent.length} 字符` });
        } else if (textContent.length > 0) {
          results.push({ status: 'warn', msg: `正文内容较少: 仅 ${textContent.length} 字符` });
        } else {
          results.push({ status: 'error', msg: '初始 HTML 中没有可读正文，可能依赖 JS 渲染' });
        }
      }

      // Check JSON-LD
      const jsonldMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
      if (jsonldMatch) {
        results.push({ status: 'ok', msg: '包含 JSON-LD 结构化数据' });
        try {
          JSON.parse(jsonldMatch[1]);
          results.push({ status: 'ok', msg: 'JSON-LD 格式有效' });
        } catch (e) {
          results.push({ status: 'error', msg: 'JSON-LD 格式无效: ' + e.message });
        }
      } else {
        results.push({ status: 'warn', msg: '没有 JSON-LD 结构化数据' });
      }

      // Check canonical
      const canonMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["'](.*?)["']/i);
      if (canonMatch) {
        results.push({ status: 'ok', msg: `Canonical: ${canonMatch[1]}` });
      } else {
        results.push({ status: 'warn', msg: '缺少 canonical 标签' });
      }

      resultArea.innerHTML = results.map(r => `<div class="result-item result-${r.status}">${r.msg}</div>`).join('');
    });
  }

  // === AI 搜索可读性评分器 ===
  function initAiReadabilityScorer() {
    const container = document.getElementById('tool-ai-readability-scorer');
    if (!container) return;

    const btn = container.querySelector('.tool-run-btn');
    const textarea = container.querySelector('textarea');
    const resultArea = container.querySelector('.tool-result-area');

    btn.addEventListener('click', () => {
      const html = textarea.value.trim();
      if (!html) { resultArea.innerHTML = '<p class="result-item result-warn">请粘贴 HTML 源码</p>'; return; }

      let score = 0;
      const details = [];

      // H1: +15
      const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/is);
      if (h1Match && h1Match[1].trim()) {
        score += 15;
        details.push({ status: 'ok', msg: '有 H1 标签', points: 15, max: 15 });
      } else {
        details.push({ status: 'error', msg: '缺少 H1 标签', points: 0, max: 15 });
      }

      // Meta description: +10
      const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["'](.*?)["']/is) ||
                         html.match(/<meta[^>]*content=["'](.*?)["'][^>]*name=["']description["']/is);
      if (descMatch && descMatch[1].trim()) {
        score += 10;
        details.push({ status: 'ok', msg: '有 meta description', points: 10, max: 10 });
      } else {
        details.push({ status: 'error', msg: '缺少 meta description', points: 0, max: 10 });
      }

      // FAQ structured data: +15
      if (html.includes('FAQPage') || html.includes('faqpage')) {
        score += 15;
        details.push({ status: 'ok', msg: '有 FAQ 结构化数据', points: 15, max: 15 });
      } else {
        details.push({ status: 'warn', msg: '没有 FAQ 结构化数据', points: 0, max: 15 });
      }

      // Author: +5
      if (html.match(/["']author["']/i) || html.match(/<meta[^>]*name=["']author["']/i)) {
        score += 5;
        details.push({ status: 'ok', msg: '有 author 信息', points: 5, max: 5 });
      } else {
        details.push({ status: 'warn', msg: '没有 author 信息', points: 0, max: 5 });
      }

      // dateModified: +10
      if (html.includes('dateModified') || html.includes('datemodified')) {
        score += 10;
        details.push({ status: 'ok', msg: '有 dateModified', points: 10, max: 10 });
      } else {
        details.push({ status: 'warn', msg: '没有 dateModified', points: 0, max: 10 });
      }

      // Body text > 300 chars: +15
      const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      let textLen = 0;
      if (bodyMatch) {
        const textContent = bodyMatch[1].replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, '').trim();
        textLen = textContent.length;
      } else {
        const textContent = html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, '').trim();
        textLen = textContent.length;
      }
      if (textLen > 300) {
        score += 15;
        details.push({ status: 'ok', msg: `正文 > 300 字符 (${textLen} 字符)`, points: 15, max: 15 });
      } else {
        details.push({ status: 'error', msg: `正文不足 300 字符 (${textLen} 字符)`, points: 0, max: 15 });
      }

      // JSON-LD: +10
      if (html.includes('application/ld+json')) {
        score += 10;
        details.push({ status: 'ok', msg: '有 JSON-LD', points: 10, max: 10 });
      } else {
        details.push({ status: 'warn', msg: '没有 JSON-LD', points: 0, max: 10 });
      }

      // Internal links: +10
      const linkMatches = html.match(/<a[^>]*href=["'][^"']*["']/gi);
      if (linkMatches && linkMatches.length > 1) {
        score += 10;
        details.push({ status: 'ok', msg: `有内链 (${linkMatches.length} 个链接)`, points: 10, max: 10 });
      } else {
        details.push({ status: 'warn', msg: '缺少内链', points: 0, max: 10 });
      }

      // No noindex: +10
      if (!html.toLowerCase().includes('noindex')) {
        score += 10;
        details.push({ status: 'ok', msg: '无 noindex', points: 10, max: 10 });
      } else {
        details.push({ status: 'error', msg: '存在 noindex', points: 0, max: 10 });
      }

      // Determine level
      let level = 'error';
      let label = '需要改进';
      let barColor = 'var(--color-error)';
      if (score >= 80) { level = 'ok'; label = '优秀'; barColor = 'var(--color-success)'; }
      else if (score >= 60) { level = 'info'; label = '良好'; barColor = 'var(--color-info)'; }
      else if (score >= 40) { level = 'warn'; label = '一般'; barColor = 'var(--color-warning)'; }

      // Generate improvement suggestions
      const improvements = [];
      const failedItems = details.filter(d => d.points === 0).sort((a, b) => b.max - a.max);
      failedItems.slice(0, 3).forEach(item => {
        if (item.msg.includes('H1')) improvements.push('添加一个清晰的 H1 标签，明确表达页面主题（+15 分）');
        else if (item.msg.includes('FAQ')) improvements.push('添加 FAQPage 结构化数据，让 AI 搜索引擎可以直接提取问答（+15 分）');
        else if (item.msg.includes('正文')) improvements.push('增加正文内容到 300 字符以上，确保有足够的信息深度（+15 分）');
        else if (item.msg.includes('description')) improvements.push('添加 meta description，提供可被引用的页面摘要（+10 分）');
        else if (item.msg.includes('dateModified')) improvements.push('在 JSON-LD 中添加 dateModified 字段，表明内容时效性（+10 分）');
        else if (item.msg.includes('JSON-LD')) improvements.push('添加 JSON-LD 结构化数据，帮助搜索引擎理解页面内容（+10 分）');
        else if (item.msg.includes('内链')) improvements.push('添加内部链接到相关页面，建立主题关联（+10 分）');
        else if (item.msg.includes('noindex')) improvements.push('移除 noindex 标记，允许搜索引擎收录此页面（+10 分）');
        else if (item.msg.includes('author')) improvements.push('添加 author 信息，增强内容可信度（+5 分）');
      });

      // Render result
      resultArea.innerHTML = `
        <div class="score-display">
          <div class="score-number">${score}</div>
          <div class="score-label">/ 100 — ${label}</div>
          <div class="score-progress-bar" style="margin-top:16px;">
            <div class="score-progress-track">
              <div class="score-progress-fill" style="width:${score}%;background:${barColor};"></div>
            </div>
          </div>
        </div>
        <div style="margin-top:16px;">
        ${details.map(d => `
          <div class="result-item result-${d.status}" style="display:flex;align-items:center;gap:10px;">
            <span style="font-size:16px;">${d.points > 0 ? '✅' : '❌'}</span>
            <span style="flex:1;">${d.msg}</span>
            <span style="font-weight:600;white-space:nowrap;">${d.points} / ${d.max}</span>
          </div>`).join('')}
        </div>
        ${improvements.length > 0 ? `
        <div style="margin-top:20px;padding:16px;background:var(--color-primary-light);border:1px solid var(--color-primary-lighter);border-radius:var(--radius);">
          <h4 style="margin-bottom:10px;color:var(--color-primary-dark);">最重要的改进建议</h4>
          <ol style="padding-left:20px;margin:0;">
            ${improvements.map(imp => `<li style="margin-bottom:6px;font-size:13px;">${imp}</li>`).join('')}
          </ol>
        </div>` : ''}
      `;
    });
  }

  // === 首页快速检查 ===
  function initQuickCheck() {
    const container = document.getElementById('quick-check-section');
    if (!container) return;

    const btn = container.querySelector('#quick-check-btn');
    const input = container.querySelector('#quick-check-url');
    const select = container.querySelector('#quick-check-tool');

    btn.addEventListener('click', () => {
      const url = input.value.trim();
      if (!url) { input.focus(); return; }
      const tool = select.value;
      // Navigate to the tool page with the URL as a hash parameter
      window.location.href = `/tools/${tool}.html#url=${encodeURIComponent(url)}`;
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') btn.click();
    });
  }

  // === Init on DOM ready ===
  document.addEventListener('DOMContentLoaded', () => {
    initWizard();
    initSitemapAudit();
    initCanonicalChecker();
    initRobotsChecker();
    initHtmlChecker();
    initAiReadabilityScorer();
    initQuickCheck();
  });

})();
