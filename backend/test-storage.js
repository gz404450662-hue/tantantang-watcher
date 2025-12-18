/**
 * 测试数据存储功能
 * 运行: node test-storage.js
 */

const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'data');
const dataFile = path.join(dataDir, 'monitor-tasks.json');

console.log('='.repeat(50));
console.log('测试数据存储功能');
console.log('='.repeat(50));

// 测试1: 检查数据目录
console.log('\n✓ 测试1: 检查数据目录');
if (fs.existsSync(dataDir)) {
  console.log(`  ✓ 数据目录存在: ${dataDir}`);
} else {
  console.log(`  ✗ 数据目录不存在，正在创建...`);
  fs.mkdirSync(dataDir, { recursive: true });
  console.log(`  ✓ 已创建数据目录`);
}

// 测试2: 检查数据文件
console.log('\n✓ 测试2: 检查数据文件');
if (fs.existsSync(dataFile)) {
  console.log(`  ✓ 数据文件存在: ${dataFile}`);
  const stats = fs.statSync(dataFile);
  console.log(`  ✓ 文件大小: ${stats.size} 字节`);
  
  try {
    const content = fs.readFileSync(dataFile, 'utf-8');
    const tasks = JSON.parse(content);
    console.log(`  ✓ JSON 格式正确`);
    console.log(`  ✓ 任务数量: ${tasks.length}`);
    
    if (tasks.length > 0) {
      console.log('\n  任务列表:');
      tasks.forEach((task, index) => {
        console.log(`    ${index + 1}. ${task.shopName} (${task.status})`);
        console.log(`       - 目标价格: ¥${task.targetPrice}`);
        console.log(`       - 价格记录: ${task.priceHistory.length} 条`);
      });
    }
  } catch (error) {
    console.log(`  ✗ JSON 解析失败: ${error.message}`);
  }
} else {
  console.log(`  ⚠ 数据文件不存在（首次运行时正常）`);
  console.log(`  提示: 启动服务后会自动创建`);
}

// 测试3: 写入权限
console.log('\n✓ 测试3: 检查写入权限');
try {
  const testFile = path.join(dataDir, 'test.tmp');
  fs.writeFileSync(testFile, 'test', 'utf-8');
  fs.unlinkSync(testFile);
  console.log(`  ✓ 写入权限正常`);
} catch (error) {
  console.log(`  ✗ 写入权限异常: ${error.message}`);
}

// 测试4: 模拟数据写入
console.log('\n✓ 测试4: 模拟数据写入');
const mockTask = {
  id: 'test_' + Date.now(),
  shopName: '测试店铺',
  targetActivityId: 99999,
  targetPrice: 50,
  status: 'active',
  createdAt: new Date().toISOString(),
  priceHistory: [
    {
      price: 88,
      timestamp: new Date().toISOString(),
      sy_store: 50
    }
  ]
};

try {
  let tasks = [];
  if (fs.existsSync(dataFile)) {
    const content = fs.readFileSync(dataFile, 'utf-8');
    tasks = JSON.parse(content);
  }
  
  // 不实际写入，只是模拟
  const newTasks = [...tasks, mockTask];
  console.log(`  ✓ 模拟写入成功`);
  console.log(`  ✓ 模拟后任务数: ${newTasks.length}`);
} catch (error) {
  console.log(`  ✗ 模拟失败: ${error.message}`);
}

console.log('\n' + '='.repeat(50));
console.log('测试完成！');
console.log('='.repeat(50));
console.log('\n提示:');
console.log('- 数据目录: ' + dataDir);
console.log('- 数据文件: ' + dataFile);
console.log('- 启动后端服务: cd backend && npm run start:dev');
console.log('- 查看实时日志以确认数据加载和保存');
console.log('');
