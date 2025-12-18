<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { getMonitorTasks, deleteMonitorTask, stopMonitorTask, cleanupTasks, type MonitorTask } from '../api/monitor'
import { showToast, showConfirmDialog } from 'vant'

const router = useRouter()
const tasks = ref<MonitorTask[]>([])
const loading = ref(false)
const refreshTimer = ref<number>()

// 加载监听任务列表
const loadTasks = async () => {
  loading.value = true
  try {
    const response = await getMonitorTasks()
    tasks.value = response.data
  } catch (error) {
    showToast('加载失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 删除任务
const handleDelete = async (task: MonitorTask) => {
  try {
    await showConfirmDialog({
      title: '确认删除',
      message: `确定要删除监听任务"${task.shopName}"吗？`,
    })
    
    const response = await deleteMonitorTask(task.id)
    if (response.data.success) {
      showToast('删除成功')
      loadTasks()
    } else {
      showToast('删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      showToast('操作失败')
      console.error(error)
    }
  }
}

// 停止任务
const handleStop = async (task: MonitorTask) => {
  try {
    await showConfirmDialog({
      title: '确认停止',
      message: `确定要停止监听任务"${task.shopName}"吗？`,
    })
    
    const response = await stopMonitorTask(task.id)
    if (response.data.success) {
      showToast('已停止')
      loadTasks()
    } else {
      showToast('操作失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      showToast('操作失败')
      console.error(error)
    }
  }
}

// 清理已完成任务
const handleCleanup = async () => {
  try {
    await showConfirmDialog({
      title: '确认清理',
      message: '确定要清理所有已完成和过期的任务吗？',
    })
    
    const response = await cleanupTasks()
    showToast(`已清理 ${response.data.count} 个任务`)
    loadTasks()
  } catch (error) {
    if (error !== 'cancel') {
      showToast('操作失败')
      console.error(error)
    }
  }
}

// 查看任务详情
const goToDetail = (task: MonitorTask) => {
  router.push(`/monitor/${task.id}`)
}

// 创建新任务
const createTask = () => {
  router.push('/monitor/create')
}

// 格式化价格
const formatPrice = (price: number) => {
  return price.toFixed(2)
}

// 格式化时间
const formatTime = (dateStr?: string) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  return date.toLocaleString('zh-CN', { 
    month: '2-digit', 
    day: '2-digit', 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

// 获取状态标签类型
const getStatusType = (status: string) => {
  const types: Record<string, any> = {
    active: 'primary',
    completed: 'success',
    expired: 'warning',
    stopped: 'default',
    sold_out_today: 'warning',
  }
  return types[status] || 'default'
}

// 获取状态文本
const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    active: '监听中',
    completed: '已完成',
    expired: '已过期',
    stopped: '已停止',
    sold_out_today: '今日售罄',
  }
  return texts[status] || status
}

// 获取最新价格
const getLatestPrice = (task: MonitorTask) => {
  if (task.currentPrice === undefined) return '-'
  return formatPrice(task.currentPrice)
}

// 判断价格是否达标
const isPriceReached = (task: MonitorTask) => {
  if (task.currentPrice === undefined) return false
  return task.currentPrice <= task.targetPrice
}

onMounted(() => {
  loadTasks()
  // 每30秒自动刷新一次列表
  refreshTimer.value = window.setInterval(() => {
    loadTasks()
  }, 30000)
})

onUnmounted(() => {
  if (refreshTimer.value) {
    clearInterval(refreshTimer.value)
  }
})
</script>

<template>
  <div class="monitor-page">
    <!-- 头部工具栏 -->
    <van-nav-bar
      title="价格监听"
      left-arrow
      @click-left="router.back()"
    >
      <template #right>
        <van-button 
          type="primary" 
          size="small"
          @click="createTask"
        >
          创建任务
        </van-button>
      </template>
    </van-nav-bar>

    <!-- 统计信息 -->
    <div class="stats-bar">
      <div class="stat-item">
        <div class="stat-value">{{ tasks.filter(t => t.status === 'active').length }}</div>
        <div class="stat-label">监听中</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">{{ tasks.filter(t => isPriceReached(t)).length }}</div>
        <div class="stat-label">价格达标</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">{{ tasks.length }}</div>
        <div class="stat-label">总任务</div>
      </div>
    </div>

    <!-- 操作栏 -->
    <div class="action-bar">
      <van-button 
        type="default" 
        size="small"
        @click="loadTasks"
        :loading="loading"
      >
        <van-icon name="replay" />
        刷新
      </van-button>
      <van-button 
        type="warning" 
        size="small"
        @click="handleCleanup"
      >
        <van-icon name="delete-o" />
        清理已完成
      </van-button>
    </div>

    <!-- 任务列表 -->
    <div class="task-list">
      <van-empty
        v-if="!loading && tasks.length === 0"
        description="暂无监听任务"
      >
        <van-button type="primary" @click="createTask">创建任务</van-button>
      </van-empty>

      <div
        v-for="task in tasks"
        :key="task.id"
        class="task-item"
      >
        <div class="task-header" @click="goToDetail(task)">
          <div class="task-info">
            <div class="task-shop">
              <van-icon name="shop-o" />
              {{ task.shopName }}
            </div>
            <van-tag :type="getStatusType(task.status)" size="small">
              {{ getStatusText(task.status) }}
            </van-tag>
          </div>
          <div class="task-meta">
            <span class="task-id">ID: {{ task.targetActivityId }}</span>
            <span class="task-time">{{ formatTime(task.lastCheckedAt) }}</span>
          </div>
        </div>

        <div class="task-content" @click="goToDetail(task)">
          <div class="price-row">
            <div class="price-item">
              <span class="price-label">目标价格</span>
              <span class="price-value target">¥{{ formatPrice(task.targetPrice) }}</span>
            </div>
            <div class="price-item">
              <span class="price-label">当前价格</span>
              <span 
                class="price-value current"
                :class="{ reached: isPriceReached(task) }"
              >
                ¥{{ getLatestPrice(task) }}
              </span>
            </div>
          </div>

          <div class="history-info" v-if="task.lastCheckedAt">
            <van-icon name="clock-o" />
            <span>最后检查: {{ formatTime(task.lastCheckedAt) }}</span>
            <van-tag
              v-if="isPriceReached(task)"
              type="success"
              size="small"
              plain
            >
              已达标
            </van-tag>
          </div>
        </div>

        <div class="task-actions">
          <van-button
            v-if="task.status === 'active'"
            size="small"
            type="warning"
            @click="handleStop(task)"
          >
            停止
          </van-button>
          <van-button
            size="small"
            type="default"
            @click="goToDetail(task)"
          >
            详情
          </van-button>
          <van-button
            size="small"
            type="danger"
            @click="handleDelete(task)"
          >
            删除
          </van-button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.monitor-page {
  min-height: 100vh;
  background-color: #f7f8fa;
}

.stats-bar {
  display: flex;
  background: white;
  padding: 16px;
  margin-bottom: 8px;
}

.stat-item {
  flex: 1;
  text-align: center;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #323233;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #969799;
}

.action-bar {
  display: flex;
  gap: 12px;
  padding: 12px 16px;
  background: white;
  margin-bottom: 8px;
}

.action-bar .van-button {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.task-list {
  padding: 12px;
}

.task-item {
  background: white;
  border-radius: 8px;
  margin-bottom: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.task-header {
  padding: 12px 16px;
  border-bottom: 1px solid #f7f8fa;
  cursor: pointer;
}

.task-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.task-shop {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 15px;
  font-weight: 500;
  color: #323233;
}

.task-shop :deep(.van-icon) {
  font-size: 16px;
  color: #1989fa;
}

.task-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: #969799;
}

.task-id {
  font-family: monospace;
}

.task-content {
  padding: 12px 16px;
  cursor: pointer;
}

.price-row {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
}

.price-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.price-label {
  font-size: 12px;
  color: #969799;
}

.price-value {
  font-size: 18px;
  font-weight: 600;
}

.price-value.target {
  color: #ff976a;
}

.price-value.current {
  color: #323233;
}

.price-value.current.reached {
  color: #07c160;
}

.history-info {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #969799;
  padding: 8px 12px;
  background: #f7f8fa;
  border-radius: 4px;
}

.history-info :deep(.van-icon) {
  font-size: 14px;
}

.task-actions {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid #f7f8fa;
}

.task-actions .van-button {
  flex: 1;
}
</style>
