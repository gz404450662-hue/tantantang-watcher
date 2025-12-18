<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getMonitorTask, deleteMonitorTask, stopMonitorTask, updateTargetPrice, type MonitorTask } from '../api/monitor'
import { showToast, showConfirmDialog, showDialog } from 'vant'

const router = useRouter()
const route = useRoute()
const taskId = route.params.id as string

const task = ref<MonitorTask | null>(null)
const loading = ref(false)
const refreshTimer = ref<number>()
const showPriceEdit = ref(false)
const editPrice = ref('')

// 加载任务详情
const loadTask = async () => {
  loading.value = true
  try {
    const response = await getMonitorTask(taskId)
    task.value = response.data
  } catch (error) {
    showToast('加载失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 删除任务
const handleDelete = async () => {
  try {
    await showConfirmDialog({
      title: '确认删除',
      message: '确定要删除这个监听任务吗？',
    })
    
    const response = await deleteMonitorTask(taskId)
    if (response.data.success) {
      showToast('删除成功')
      router.back()
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
const handleStop = async () => {
  try {
    await showConfirmDialog({
      title: '确认停止',
      message: '确定要停止这个监听任务吗？',
    })
    
    const response = await stopMonitorTask(taskId)
    if (response.data.success) {
      showToast('已停止')
      loadTask()
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

// 打开编辑价格弹窗
const openEditPrice = () => {
  console.log('openEditPrice called, task:', task.value)
  if (!task.value) {
    console.log('task is null, returning')
    return
  }
  editPrice.value = task.value.targetPrice.toString()
  showPriceEdit.value = true
  console.log('showPriceEdit set to true')
}

// 保存目标价格
const saveTargetPrice = async () => {
  const price = parseFloat(editPrice.value)
  if (isNaN(price) || price <= 0) {
    showToast('请输入有效的价格')
    return
  }

  loading.value = true
  try {
    const response = await updateTargetPrice(taskId, price)
    if (response.data.success) {
      showToast('修改成功')
      showPriceEdit.value = false
      loadTask()
    } else {
      showToast('修改失败')
    }
  } catch (error) {
    showToast('操作失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 格式化价格
const formatPrice = (price: number) => {
  return price.toFixed(2)
}

// 格式化时间
const formatDateTime = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
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

onMounted(() => {
  loadTask()
  // 每10秒自动刷新一次
  refreshTimer.value = window.setInterval(() => {
    loadTask()
  }, 10000)
})

onUnmounted(() => {
  if (refreshTimer.value) {
    clearInterval(refreshTimer.value)
  }
})
</script>

<template>
  <div class="detail-page">
    <van-nav-bar
      title="任务详情"
      left-arrow
      @click-left="router.back()"
    />

    <div v-if="task" class="detail-content">
      <!-- 基本信息 -->
      <div class="info-card">
        <div class="card-header">
          <span class="card-title">基本信息</span>
          <van-tag :type="getStatusType(task.status)" size="medium">
            {{ getStatusText(task.status) }}
          </van-tag>
        </div>

        <van-cell-group inset>
          <van-cell title="店铺名称" :value="task.shopName" />
          <van-cell title="商品ID" :value="task.targetActivityId" />
          <van-cell 
            title="目标价格" 
            :value="`¥${formatPrice(task.targetPrice)}`"
            clickable
            @click="openEditPrice"
          >
            <template #right-icon>
              <van-icon name="edit" class="edit-icon" />
            </template>
          </van-cell>
          <van-cell 
            v-if="task.currentPrice"
            title="当前价格" 
            :value="`¥${formatPrice(task.currentPrice)}`"
            :class="{ 'price-reached': task.currentPrice <= task.targetPrice }"
          />
          <van-cell 
            v-if="task.currentStock !== undefined"
            title="当前库存" 
            :value="task.currentStock"
          />
          <van-cell title="创建时间" :value="formatDateTime(task.createdAt)" />
          <van-cell 
            v-if="task.lastCheckedAt"
            title="最后检查" 
            :value="formatDateTime(task.lastCheckedAt)" 
          />
        </van-cell-group>
      </div>

      <!-- 历史成交记录 -->
      <div class="daily-card" v-if="task.dailyRecords && task.dailyRecords.length > 0">
        <div class="card-header">
          <span class="card-title">历史成交记录</span>
          <span class="stats-count">{{ task.dailyRecords.length }} 天</span>
        </div>

        <div class="daily-list">
          <div
            v-for="(record, index) in task.dailyRecords.slice().reverse()"
            :key="index"
            class="daily-item"
          >
            <div class="daily-date">
              <van-icon name="calendar-o" />
              {{ record.date }}
            </div>
            <div class="daily-info">
              <div class="daily-row">
                <span class="daily-label">成交价：</span>
                <span class="daily-value price">¥{{ formatPrice(record.finalPrice) }}</span>
              </div>
              <div class="daily-row" v-if="record.soldOutTime">
                <span class="daily-label">售罄时间：</span>
                <span class="daily-value">{{ formatDateTime(record.soldOutTime) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <van-button
          v-if="task.status === 'active'"
          type="warning"
          block
          @click="handleStop"
        >
          停止监听
        </van-button>
        <van-button
          type="danger"
          block
          @click="handleDelete"
        >
          删除任务
        </van-button>
      </div>
    </div>

    <van-loading v-else-if="loading" type="spinner" size="32" class="loading" />

    <!-- 编辑目标价格弹窗 - 放在外层，不受 task 条件影响 -->
    <van-dialog
      :show="showPriceEdit"
      title="修改目标价格"
      show-cancel-button
      @confirm="saveTargetPrice"
      @update:show="(val) => showPriceEdit = val"
    >
      <div class="edit-price-form">
        <van-field
          v-model="editPrice"
          type="number"
          label="目标价格"
          placeholder="请输入目标价格"
          :rules="[{ required: true, message: '请输入目标价格' }]"
        >
          <template #button>
            <span class="price-unit">元</span>
          </template>
        </van-field>
      </div>
    </van-dialog>
  </div>
</template>

<style scoped>
.detail-page {
  min-height: 100vh;
  background-color: #f7f8fa;
  padding-bottom: 20px;
}

.detail-content {
  padding: 12px;
}

.info-card,
.history-card,
.daily-card {
  background: white;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #323233;
}

.stats-count {
  font-size: 13px;
  color: #969799;
}

:deep(.van-cell-group) {
  margin: 0;
}

.edit-icon {
  color: #1989fa;
  font-size: 16px;
}

.price-reached :deep(.van-cell__value) {
  color: #07c160;
  font-weight: 600;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 12px;
}

.loading {
  display: flex;
  justify-content: center;
  padding: 40px;
}

.daily-card {
  background: white;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
}

.daily-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.daily-item {
  padding: 14px;
  background: #f7f8fa;
  border-radius: 8px;
  border-left: 3px solid #1989fa;
}

.daily-date {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: #323233;
  margin-bottom: 10px;
}

.daily-date :deep(.van-icon) {
  font-size: 14px;
  color: #1989fa;
}

.daily-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.daily-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}

.daily-label {
  color: #646566;
}

.daily-value {
  font-weight: 500;
  color: #323233;
}

.daily-value.price {
  font-size: 16px;
  font-weight: 700;
  color: #ee0a24;
}

.edit-price-form {
  padding: 20px 16px;
}

.price-unit {
  color: #969799;
  font-size: 14px;
}
</style>
