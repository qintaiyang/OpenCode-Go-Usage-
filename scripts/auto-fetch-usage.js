/**
 * OpenCode Go Usage — browser console fetcher
 *
 * Run this in the devtools console on https://opencode.ai/workspace/<id>/go
 * to fetch usage data without installing anything.
 */

(async () => {
  const WID = document.location?.pathname?.match(/\/workspace\/([^/]+)/)?.[1];
  if (!WID) { console.error('❌ No workspace ID detected'); return; }

  // ============================================================
  // Server function hashes (stable, extracted from page bundle)
  // ============================================================
  const HASH = {
    SUMMARY:  "c7389bd0e731f80f49593e5ee53835475f4e28594dd6bd83eb229bab753498cd",
    LIST:     "6262ba54bff26cd7ec162f93db420e0d19df9cd94b2233dfe3b6b24c3f990388",
    REFERRAL: "2a0b2fef5fd2ec9eff0cb5d4955e4ada4eece21fac85591ed4c09630168d4844",
  };

  // ============================================================
  // Args 编码 (seroval 格式)
  // ============================================================
  const args = JSON.stringify({
    t: { t: 9, i: 0, l: 1, a: [{ t: 1, s: WID }], o: 0 },
    f: 31, m: []
  });

  // ============================================================
  // API 调用
  // ============================================================
  const api = async (hash) => {
    const url = `/_server?id=${hash}&args=${encodeURIComponent(args)}`;
    const r = await fetch(url, {
      method: 'GET',
      headers: { 'X-Server-Id': hash, 'X-Server-Instance': `fn:${Date.now()}` }
    });
    return r.text();
  };

  // ============================================================
  // 格式化
  // ============================================================
  const fmtDur = (sec) => {
    const d = Math.floor(sec / 86400), h = Math.floor((sec % 86400) / 3600), m = Math.floor((sec % 3600) / 60);
    if (d >= 1) return `${d}d ${h}h`;
    if (h >= 1) return `${h}h ${m}m`;
    return m === 0 ? '即将重置' : `${m}m`;
  };

  const fmtCost = (cost) => `${(cost / 100000).toFixed(2)} 分`;

  try {
    console.log('='.repeat(56));
    console.log('  🚀 OpenCode Go — 使用量自动获取');
    console.log(`  📋 工作区: ${WID}`);
    console.log('='.repeat(56));

    // ──────── 1. 使用量摘要 ────────
    const s = await api(HASH.SUMMARY);
    const f = (key, raw) => {
      const re = new RegExp(key + ':\\$R\\[\\d+\\]=\\{status:"(\\w+)",resetInSec:(\\d+),usagePercent:(\\d+)\\}');
      const m = raw.match(re);
      return m ? { status: m[1], reset: +m[2], pct: +m[3] } : null;
    };
    const rRoll = f('rollingUsage', s);
    const rWeek = f('weeklyUsage', s);
    const rMonth = f('monthlyUsage', s);
    const useBal = s.includes('useBalance:!0');

    console.log('\n  📊 使用量摘要');
    if (rRoll) console.log(`     🔄 滚动用量: ${rRoll.pct}%  (${fmtDur(rRoll.reset)}后重置)`);
    if (rWeek) console.log(`     📅 周用量:   ${rWeek.pct}%  (${fmtDur(rWeek.reset)}后重置)`);
    if (rMonth) console.log(`     📅 月用量:   ${rMonth.pct}%  (${fmtDur(rMonth.reset)}后重置)`);
    console.log(`     💳 余额抵扣:  ${useBal ? '已开启 ✓' : '未开启'}`);

    // ──────── 2. 使用量明细 ────────
    const l = await api(HASH.LIST);
    const recordCount = (l.match(/id:"usg_/g) || []).length;
    const costs = (l.match(/cost:(\d+)/g) || []).map(v => parseInt(v.replace('cost:', '')));
    const totalCost = costs.reduce((a, b) => a + b, 0);

    // 模型分布
    const modelMatches = l.match(/model:"([^"]+)"/g) || [];
    const modelCounts = {};
    modelMatches.forEach(m => {
      const name = m.replace(/model:"(.*)"/, '$1');
      modelCounts[name] = (modelCounts[name] || 0) + 1;
    });

    console.log(`\n  📋 使用明细: ${recordCount} 条记录`);
    console.log(`     🤖 模型分布:`);
    Object.entries(modelCounts).forEach(([name, count]) => {
      console.log(`        ${name}: ${count} 次`);
    });
    console.log(`     💰 总消耗: ${fmtCost(totalCost)}`);

    // ──────── 3. 推荐奖励 ────────
    const ref = await api(HASH.REFERRAL);
    const refCode = ref.match(/referralCode:"([^"]+)"/);
    const reward = ref.match(/rewardAmount:(\d+)/);
    if (refCode) {
      console.log(`\n  🎁 推荐奖励`);
      console.log(`     推荐码: ${refCode[1]}`);
      console.log(`     奖励: $${reward ? reward[1] : '?'}`);
    }

    console.log('\n' + '='.repeat(56));
    console.log('  ✅ 获取完成!');
  } catch (err) {
    console.error('❌ 错误:', err);
  }
})();
