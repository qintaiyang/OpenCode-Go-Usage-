#!/usr/bin/env node
/**
 * OpenCode Go 使用量 CLI 获取工具
 *
 * 依赖 src/core/usage-service.js 和 src/core/config-service.js
 *
 * 用法:
 *   直接运行（使用 config.json 配置）:
 *      node scripts/fetch-usage-cli.js
 *
 *   设置环境变量:
 *      set OPENCODE_AUTH=Fe26.2**...
 *      node scripts/fetch-usage-cli.js
 *
 *   命令行传参:
 *      node scripts/fetch-usage-cli.js "Fe26.2**..." [workspace-id]
 *
 *   从文件读取:
 *      echo "Fe26.2**..." > .opencode_auth
 *      node scripts/fetch-usage-cli.js
 *
 * 如何获取 auth cookie:
 *   1. 在浏览器中打开 https://opencode.ai/workspace/xxx/go
 *   2. F12 → Application → Cookies → opencode.ai → 复制 auth 的值
 *   3. 粘贴到仓库根目录的 config.json 或 .opencode_auth 文件
 *   4. 注意: cookie 会过期（约 30 天），过期后需重新获取
 */

const { fetchUsage } = require('../src/core/usage-service');
const { loadConfig } = require('../src/core/config-service');

// ============================================================
// 格式化
// ============================================================
function fmtDuration(sec) {
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (d >= 1) return `${d}天 ${h}小时`;
  if (h >= 1) return `${h}小时 ${m}分钟`;
  return m === 0 ? '即将重置' : `${m}分钟`;
}

// ============================================================
// 主函数
// ============================================================
async function main() {
  const cfg = loadConfig();

  // CLI 参数覆盖
  const cliAuth = process.argv[2];
  const cliWid = process.argv[3];
  const auth = cliAuth || cfg.auth;
  const workspaceId = cliWid || cfg.workspaceId;

  if (!auth || auth.startsWith('Fe26.2**...')) {
    console.error('');
    console.error('❌ 需要设置 auth cookie');
    console.error('');
    console.error('方式一: 编辑 config.json（推荐）');
    console.error('  将 auth cookie 填入 config.json 的 "auth" 字段');
    console.error('');
    console.error('方式二: 环境变量');
    console.error('  set OPENCODE_AUTH=<cookie> && node scripts/fetch-usage-cli.js');
    console.error('');
    console.error('方式三: 命令行参数');
    console.error('  node scripts/fetch-usage-cli.js "<cookie>" [workspace-id]');
    console.error('');
    console.error('获取 cookie:');
    console.error('  F12 → Application → Cookies → opencode.ai → 复制 "auth" 的值');
    console.error('');
    process.exit(1);
  }

  console.log('');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║     OpenCode Go 使用量 CLI 获取工具          ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log(`  工作区: ${workspaceId}`);
  console.log(`  认证: ${auth.substring(0, 16)}...${auth.slice(-8)}`);
  console.log('');

  try {
    console.log('📡 正在获取使用量数据...');
    const usage = await fetchUsage({ auth, workspaceId });
    const { summary, detail } = usage;

    console.log('\n  📊 使用量摘要');
    if (summary.rolling) {
      const r = summary.rolling;
      const used = r.usedPercent ?? r.usagePercent;
      console.log(`     🔄 滚动使用量: ${used}% (剩余: ${r.remainingPercent}%)`);
      console.log(`         重置时间: ${fmtDuration(r.resetInSec)}后`);
    }
    if (summary.weekly) {
      const w = summary.weekly;
      const used = w.usedPercent ?? w.usagePercent;
      console.log(`     📅 周使用量:   ${used}% (剩余: ${w.remainingPercent}%)`);
      console.log(`         重置时间: ${fmtDuration(w.resetInSec)}后`);
    }
    if (summary.monthly) {
      const m = summary.monthly;
      const used = m.usedPercent ?? m.usagePercent;
      console.log(`     📅 月使用量:   ${used}% (剩余: ${m.remainingPercent}%)`);
      console.log(`         重置时间: ${fmtDuration(m.resetInSec)}后`);
    }
    console.log(`     💳 余额抵扣:    ${summary.useBalance ? '已开启 ✓' : '未开启'}`);
    console.log(`     👤 所属:        ${summary.isMine ? '当前工作区 ✓' : '其他'}`);

    console.log(`\n  📋 使用明细: ${detail.count} 条记录`);
    console.log(`     🤖 模型分布:`);
    Object.entries(detail.modelCounts).forEach(([name, count]) => {
      console.log(`        ${name}: ${count} 次`);
    });
    console.log(`     📊 Token 统计:`);
    console.log(`        📝 输入:    ${detail.totalInput.toLocaleString()}`);
    console.log(`        💬 输出:    ${detail.totalOutput.toLocaleString()}`);
    console.log(`        🧠 推理:    ${detail.totalReasoning.toLocaleString()}`);
    console.log(`        💾 缓存读取: ${detail.totalCache.toLocaleString()}`);
    console.log(`     💰 总消耗:     ${(detail.totalCost / 100000).toFixed(2)} 分`);
    console.log(`        (成本单位: 1 分 = 0.01 元)`);

    console.log('\n  ✅ 获取完成!');
    console.log('');

  } catch (err) {
    console.error(`\n  ❌ 错误: ${err.message}`);
    if (err.message.includes('expired') || err.message.includes('Missing')) {
      console.error('\n  💡 提示: cookie 可能已过期，请重新从浏览器获取。');
      console.error('     F12 → Application → Cookies → opencode.ai → 复制 auth 值');
    }
    process.exit(1);
  }
}

// ============================================================
// 启动 (Node 18+ 内置 fetch)
// ============================================================
if (parseInt(process.version.slice(1)) < 18) {
  console.error('❌ 需要 Node.js 18+ (原生 fetch 支持)');
  process.exit(1);
}

main();
