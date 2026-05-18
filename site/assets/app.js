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
      const suggestions = generateSuggestions(answers);
      container.innerHTML = `
        <div class="wizard-result">
          <h3>诊断建议</h3>
          <ul>${suggestions.map(s => `<li>${s}</li>`).join('')}</ul>
        </div>
        <button class="btn btn-secondary" style="margin-top:16px;" id="wizard-restart">重新诊断</button>`;
      document.getElementById('wizard-restart').addEventListener('click', () => {
        answers = {};
        currentStep = 0;
        render();
      });
    }

    function generateSuggestions(a) {
      const tips = [];
      if (a.q1 === '5xx') {
        tips.push('服务器返回 5xx 错误，需要先修复服务器问题。<a href="/guides/server-error-5xx.html">查看 5xx 排查指南</a>');
      }
      if (a.q1 === '4xx') {
        tips.push('页面返回 404/410，Google 不会收录不存在的页面。检查 URL 是否正确，或设置 301 重定向。');
      }
      if (a.q1 === '3xx') {
        tips.push('页面存在重定向，确认最终目标 URL 是否正确，避免重定向链过长。');
      }
      if (a.q2 === 'yes') {
        tips.push('页面有 noindex 标记，搜索引擎不会收录。<a href="/guides/robots-noindex.html">检查 noindex 配置</a>');
        tips.push('使用 <a href="/tools/robots-checker.html">Robots 检查器</a> 确认具体屏蔽来源。');
      }
      if (a.q3 === 'other' || a.q3 === 'home') {
        tips.push('Canonical 没有自指，搜索引擎会认为当前页面是重复内容。<a href="/guides/self-referencing-canonical.html">了解 canonical 自指</a>');
        tips.push('使用 <a href="/tools/canonical-checker.html">Canonical 检查器</a> 验证配置。');
      }
      if (a.q3 === 'none') {
        tips.push('缺少 canonical 标签，建议添加自指 canonical。<a href="/guides/self-referencing-canonical.html">查看指南</a>');
      }
      if (a.q4 === 'no') {
        tips.push('URL 不在 sitemap 中，建议将需要收录的页面加入 sitemap。<a href="/guides/sitemap-best-practices.html">Sitemap 最佳实践</a>');
      }
      if (a.q5 === 'js-only') {
        tips.push('初始 HTML 没有正文，搜索引擎可能无法读取 JS 渲染的内容。<a href="/guides/html-readability.html">HTML 可读性检查</a>');
        tips.push('使用 <a href="/tools/html-checker.html">HTML 可读性检查工具</a> 分析页面。');
      }
      if (a.q1 === '200' && a.q2 === 'no' && a.q3 === 'self' && a.q5 === 'yes') {
        tips.push('基本配置看起来正确。可能是内容质量或内链不足导致未收录。<a href="/guides/crawled-not-indexed.html">查看已抓取未收录排查</a>');
        tips.push('尝试用 <a href="/tools/ai-readability-scorer.html">AI 可读性评分器</a> 检查内容质量。');
      }
      if (a.q2 === 'unknown' || a.q5 === 'unknown') {
        tips.push('对于不确定的项目，建议使用 curl 或浏览器开发者工具查看页面源码。');
      }
      if (tips.length === 0) {
        tips.push('根据你的回答，页面基本配置正常。建议逐一使用工具进行深入检查。');
      }
      return tips;
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
      const lowValuePatterns = [/\.(pdf|zip|doc|xls|ppt|png|jpg|gif|svg|mp4|mp3)$/i, /\?/, /\/tag\//, /\/page\/\d+/, /\/feed\/?$/, /\/wp-json\//];
      const seen = new Set();

      urls.forEach(url => {
        const issues = [];
        if (seen.has(url)) { issues.push('重复 URL'); }
        seen.add(url);
        lowValuePatterns.forEach(p => {
          if (p.test(url)) {
            if (/\.(pdf|zip|doc|xls|ppt)$/i.test(url)) issues.push('非 HTML 文件');
            else if (/\.(png|jpg|gif|svg|mp4|mp3)$/i.test(url)) issues.push('媒体文件');
            else if (/\?/.test(url)) issues.push('带参数 URL');
            else if (/\/tag\//.test(url)) issues.push('标签页');
            else if (/\/page\/\d+/.test(url)) issues.push('分页');
            else if (/\/feed\/?$/.test(url)) issues.push('Feed');
            else if (/\/wp-json\//.test(url)) issues.push('API 端点');
          }
        });
        if (issues.length > 0) {
          results.push({ url, status: 'warn', msg: '建议移除: ' + issues.join(', ') });
        } else {
          results.push({ url, status: 'ok', msg: '可保留' });
        }
      });

      const warnCount = results.filter(r => r.status === 'warn').length;
      let html = `<p style="margin-bottom:12px;font-weight:500;">共 ${urls.length} 个 URL，${warnCount} 个建议移除</p>`;
      results.forEach(r => {
        const cls = r.status === 'warn' ? 'result-warn' : 'result-ok';
        html += `<div class="result-item ${cls}"><code>${r.url}</code> — ${r.msg}</div>`;
      });
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
      const normalizeUrl = u => u.replace(/\/+$/, '').replace(/^https?:\/\//, '').toLowerCase();

      if (normalizeUrl(pageUrl) === normalizeUrl(canonicalUrl)) {
        results.push({ status: 'ok', msg: 'Canonical 自指正确，指向当前页面' });
      } else if (normalizeUrl(canonicalUrl) === normalizeUrl(canonicalUrl.replace(/\/[^/]*$/, '')) || canonicalUrl.replace(/\/$/, '').split('/').length <= 3) {
        results.push({ status: 'error', msg: 'Canonical 可能指向首页，这会导致当前页面不被收录' });
      } else {
        results.push({ status: 'warn', msg: 'Canonical 指向其他页面，当前页面会被视为重复内容' });
      }

      if (pageUrl.startsWith('http://') && canonicalUrl.startsWith('https://')) {
        results.push({ status: 'info', msg: '注意：页面是 HTTP 但 canonical 是 HTTPS，确认是否有正确的重定向' });
      }
      if (canonicalUrl.includes('?')) {
        results.push({ status: 'warn', msg: 'Canonical 包含查询参数，通常应使用不带参数的干净 URL' });
      }

      resultArea.innerHTML = results.map(r => `<div class="result-item result-${r.status}">${r.msg}</div>`).join('');
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
        details.push({ status: 'ok', msg: '有 H1 标签 (+15)', points: 15 });
      } else {
        details.push({ status: 'error', msg: '缺少 H1 标签 (+0)', points: 0 });
      }

      // Meta description: +10
      const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["'](.*?)["']/is) ||
                         html.match(/<meta[^>]*content=["'](.*?)["'][^>]*name=["']description["']/is);
      if (descMatch && descMatch[1].trim()) {
        score += 10;
        details.push({ status: 'ok', msg: '有 meta description (+10)', points: 10 });
      } else {
        details.push({ status: 'error', msg: '缺少 meta description (+0)', points: 0 });
      }

      // FAQ structured data: +15
      if (html.includes('FAQPage') || html.includes('faqpage')) {
        score += 15;
        details.push({ status: 'ok', msg: '有 FAQ 结构化数据 (+15)', points: 15 });
      } else {
        details.push({ status: 'warn', msg: '没有 FAQ 结构化数据 (+0)', points: 0 });
      }

      // Author: +5
      if (html.match(/["']author["']/i) || html.match(/<meta[^>]*name=["']author["']/i)) {
        score += 5;
        details.push({ status: 'ok', msg: '有 author 信息 (+5)', points: 5 });
      } else {
        details.push({ status: 'warn', msg: '没有 author 信息 (+0)', points: 0 });
      }

      // dateModified: +10
      if (html.includes('dateModified') || html.includes('datemodified')) {
        score += 10;
        details.push({ status: 'ok', msg: '有 dateModified (+10)', points: 10 });
      } else {
        details.push({ status: 'warn', msg: '没有 dateModified (+0)', points: 0 });
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
        details.push({ status: 'ok', msg: `正文 > 300 字符 (${textLen} 字符) (+15)`, points: 15 });
      } else {
        details.push({ status: 'error', msg: `正文不足 300 字符 (${textLen} 字符) (+0)`, points: 0 });
      }

      // JSON-LD: +10
      if (html.includes('application/ld+json')) {
        score += 10;
        details.push({ status: 'ok', msg: '有 JSON-LD (+10)', points: 10 });
      } else {
        details.push({ status: 'warn', msg: '没有 JSON-LD (+0)', points: 0 });
      }

      // Internal links: +10
      const linkMatches = html.match(/<a[^>]*href=["'][^"']*["']/gi);
      if (linkMatches && linkMatches.length > 1) {
        score += 10;
        details.push({ status: 'ok', msg: `有内链 (${linkMatches.length} 个链接) (+10)`, points: 10 });
      } else {
        details.push({ status: 'warn', msg: '缺少内链 (+0)', points: 0 });
      }

      // No noindex: +10
      if (!html.toLowerCase().includes('noindex')) {
        score += 10;
        details.push({ status: 'ok', msg: '无 noindex (+10)', points: 10 });
      } else {
        details.push({ status: 'error', msg: '存在 noindex (+0)', points: 0 });
      }

      // Render result
      let level = 'error';
      let label = '需要改进';
      if (score >= 80) { level = 'ok'; label = '优秀'; }
      else if (score >= 60) { level = 'info'; label = '良好'; }
      else if (score >= 40) { level = 'warn'; label = '一般'; }

      resultArea.innerHTML = `
        <div class="score-display">
          <div class="score-number">${score}</div>
          <div class="score-label">/ 100 — ${label}</div>
        </div>
        ${details.map(d => `<div class="result-item result-${d.status}">${d.msg}</div>`).join('')}
      `;
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
  });

})();
