/**
 * 数据库种子脚本。
 * 运行：npm run db:seed（或 npx tsx prisma/seed.ts）
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 开始填充种子数据...');

  // ---- 管理员 ----
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      passwordHash: adminPassword,
      nickname: '管理员',
      role: 'admin',
      emailVerified: true,
    },
  });
  console.log(`   管理员: ${admin.email} (密码: admin123)`);

  // ---- 测试用户 ----
  const userPassword = await bcrypt.hash('user123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      passwordHash: userPassword,
      nickname: '备考小王',
      role: 'user',
      emailVerified: true,
    },
  });
  console.log(`   测试用户: ${user.email} (密码: user123)`);

  // ---- 种子题目 ----
  const sampleQuestions = [
    {
      type: '综合分析',
      subtype: '社会现象分析',
      content: '某市推行垃圾分类政策后，执行效果不佳，居民配合度低，作为社区工作人员，你会怎么办？',
      thinkingProcess: JSON.stringify(['分析政策执行不佳的原因', '提出针对性解决措施', '总结长效机制']),
      modelAnswer: '首先，我会深入社区调研，了解居民不配合的具体原因...（展开论述）',
      scoringPoints: JSON.stringify([
        { point: '问题分析', weight: 3, description: '准确识别政策执行障碍' },
        { point: '解决措施', weight: 4, description: '提出可操作的具体方案' },
        { point: '长效机制', weight: 3, description: '建立持续改善机制' },
      ]),
      difficulty: 3,
      tags: JSON.stringify(['垃圾分类', '社区治理', '政策执行']),
      sourceYear: 2024,
      sourceRegion: '国考',
    },
    {
      type: '应急应变',
      subtype: '群众投诉',
      content: '办事大厅有群众因排队时间过长情绪激动，大声指责工作人员效率低下，引起其他群众围观。作为值班负责人，你怎么办？',
      thinkingProcess: JSON.stringify(['第一时间安抚情绪', '查明原因并解决核心问题', '反思流程改进']),
      modelAnswer: '第一步，立即上前表明身份，将群众引导至接待室...（展开论述）',
      scoringPoints: JSON.stringify([
        { point: '应急响应', weight: 3, description: '快速响应、控制局面' },
        { point: '问题处置', weight: 4, description: '妥善解决问题、化解矛盾' },
        { point: '总结反思', weight: 3, description: '举一反三、流程改进' },
      ]),
      difficulty: 4,
      tags: JSON.stringify(['窗口服务', '群众工作', '突发事件']),
      sourceYear: 2023,
      sourceRegion: '省考',
    },
    {
      type: '组织管理',
      subtype: '活动策划',
      content: '单位要组织一次"我为群众办实事"主题实践活动，领导让你负责策划，你会如何开展？',
      thinkingProcess: JSON.stringify(['活动主题与目标', '前期筹备', '具体实施步骤', '总结评估']),
      modelAnswer: '首先明确活动目标是解决群众急难愁盼问题...（展开论述）',
      scoringPoints: JSON.stringify([
        { point: '方案设计', weight: 3, description: '活动方案周全可行' },
        { point: '组织实施', weight: 4, description: '组织过程有序高效' },
        { point: '效果评估', weight: 3, description: '注重实效与长效' },
      ]),
      difficulty: 3,
      tags: JSON.stringify(['为民服务', '活动组织', '党建']),
      sourceYear: 2024,
      sourceRegion: '国考',
    },
    {
      type: '人际沟通',
      subtype: '与同事相处',
      content: '你和小王是同科室的同事，他经常把自己的工作推给你，导致你自己的工作经常加班才能完成。你会如何处理？',
      thinkingProcess: JSON.stringify(['分析原因', '选取沟通方式', '设定边界', '必要时求助上级']),
      modelAnswer: '首先冷静分析小王推工作的原因...（展开论述）',
      scoringPoints: JSON.stringify([
        { point: '态度与方法', weight: 3, description: '以工作为重、态度诚恳' },
        { point: '沟通技巧', weight: 4, description: '有效沟通、合理拒绝' },
        { point: '团队协作', weight: 3, description: '维护良好工作关系' },
      ]),
      difficulty: 2,
      tags: JSON.stringify(['同事关系', '工作分配', '沟通技巧']),
      sourceYear: 2022,
      sourceRegion: '省考',
    },
    {
      type: '自我认知',
      subtype: '优缺点分析',
      content: '请谈谈你最大的优点和缺点是什么？这些特质对你未来的公务员工作有何影响？',
      thinkingProcess: JSON.stringify(['选择真实且有代表性的优缺点', '分析对工作的影响', '展示改进意愿']),
      modelAnswer: '我的最大优点是责任心强、做事有始有终...（展开论述）',
      scoringPoints: JSON.stringify([
        { point: '自我认知', weight: 4, description: '认识客观、定位准确' },
        { point: '岗位匹配', weight: 3, description: '特质与岗位契合' },
        { point: '改进意识', weight: 3, description: '展现成长潜力' },
      ]),
      difficulty: 2,
      tags: JSON.stringify(['自我认知', '人岗匹配', '成长潜力']),
      sourceYear: 2023,
      sourceRegion: '国考',
    },
    {
      type: '时政热点',
      subtype: '国内时政',
      content: '请谈谈你对"新质生产力"的理解，以及基层公务员如何在工作中服务新质生产力发展？',
      thinkingProcess: JSON.stringify(['新质生产力定义', '时代意义', '基层公务员的角色']),
      modelAnswer: '新质生产力是以科技创新为主导...（展开论述）',
      scoringPoints: JSON.stringify([
        { point: '理论理解', weight: 4, description: '准确把握概念内涵' },
        { point: '结合实际', weight: 3, description: '联系基层工作实际' },
        { point: '践行方向', weight: 3, description: '提出具体可行建议' },
      ]),
      difficulty: 5,
      tags: JSON.stringify(['新质生产力', '科技创新', '高质量发展']),
      sourceYear: 2024,
      sourceRegion: '国考',
    },
  ];

  for (const q of sampleQuestions) {
    await prisma.question.create({
      data: { ...q, createdBy: admin.id },
    });
  }
  console.log(`   已创建 ${sampleQuestions.length} 道示例题目`);

  console.log('✅ 种子数据填充完成！');
}

main()
  .catch((e) => {
    console.error('❌ 种子数据填充失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
