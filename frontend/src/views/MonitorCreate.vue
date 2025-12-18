<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { searchActivity, type Activity } from '../api/activity'
import { createMonitorTask, getHistoricalData, type DailyRecord } from '../api/monitor'
import { showToast } from 'vant'

const router = useRouter()
const route = useRoute()
const step = ref(1) // 1: 搜索商品, 2: 选择商品, 3: 设置目标价格
const shopName = ref('')
const searchResults = ref<Activity[]>([])
const selectedActivity = ref<Activity | null>(null)
const targetPrice = ref('')
const loading = ref(false)
const historicalData = ref<DailyRecord[]>([])

// 计算昨天的成交数据
const yesterdayData = computed(() => {
  if (historicalData.value.length === 0) return null
  return historicalData.value[0] // 已按日期排序，第一个是最新的
})

// 从路由参数初始化
onMounted(() => {
  const { shopName: queryShopName, activityId, price } = route.query
  if (queryShopName && activityId) {
    shopName.value = queryShopName as string
    targetPrice.value = (price as string) || ''
    // 自动搜索并选中
    handleAutoSearch(parseInt(activityId as string))
  }
})

// 自动搜索并选中商品
const handleAutoSearch = async (activityId: number) => {
  loading.value = true
  try {
    const response = await searchActivity({ keyword: shopName.value, count: 100 })
    if (response.data.code === 1) {
      searchResults.value = response.data.data.data
      const activity = searchResults.value.find(item => item.activitygoods_id === activityId)
      if (activity) {
        selectActivity(activity)
      } else {
        showToast('未找到该商品')
        step.value = 2
      }
    } else {
      showToast(response.data.msg || '搜索失败')
    }
  } catch (error) {
    showToast('网络错误')
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 搜索商品
const handleSearch = async () => {
  if (!shopName.value.trim()) {
    showToast('请输入店铺名称')
    return
  }

  loading.value = true
  try {
    const response = await searchActivity({ keyword: shopName.value, count: 100 })
    if (response.data.code === 1) {
      searchResults.value = response.data.data.data
      if (searchResults.value.length === 0) {
        showToast('未找到相关商品')
      } else {
        step.value = 2
      }
    } else {
      showToast(response.data.msg || '搜索失败')
    }
  } catch (error) {
    showToast('网络错误')
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 选择商品
const selectActivity = async (activity: Activity) => {
  selectedActivity.value = activity
  targetPrice.value = activity.price
  
  // 加载历史数据
  loading.value = true
  try {
    const response = await getHistoricalData(activity.activitygoods_id)
    historicalData.value = response.data
    
    // 如果有昨天的数据，建议使用昨天的成交价
    if (historicalData.value.length > 0) {
      const yesterday = historicalData.value[0]
      targetPrice.value = yesterday.finalPrice.toString()
      showToast(`已加载历史数据，建议参考昨日成交价 ¥${yesterday.finalPrice}`)
    }
  } catch (error) {
    console.error('加载历史数据失败:', error)
  } finally {
    loading.value = false
  }
  
  step.value = 3
}

// 创建任务
const handleCreate = async () => {
  if (!selectedActivity.value) {
    showToast('请选择商品')
    return
  }

  const price = parseFloat(targetPrice.value)
  if (isNaN(price) || price <= 0) {
    showToast('请输入有效的目标价格')
    return
  }

  loading.value = true
  try {
    await createMonitorTask({
      shopName: shopName.value,
      targetActivityId: selectedActivity.value.activitygoods_id,
      targetPrice: price,
    })
    showToast('创建成功')
    router.push('/monitor/list')
  } catch (error) {
    showToast('创建失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 返回上一步
const goBack = () => {
  if (step.value > 1) {
    step.value--
  } else {
    router.back()
  }
}

// 格式化价格
const formatPrice = (price: string) => {
  return parseFloat(price).toFixed(2)
}
</script>

<template>
  <div class="create-page">
    <van-nav-bar
      title="创建监听任务"
      left-arrow
      @click-left="goBack"
    />

    <!-- 步骤指示器 -->
    <van-steps :active="step - 1" active-color="#1989fa">
      <van-step>搜索商品</van-step>
      <van-step>选择商品</van-step>
      <van-step>设置价格</van-step>
    </van-steps>

    <!-- 步骤 1: 搜索商品 -->
    <div v-if="step === 1" class="step-content">
      <div class="search-section">
        <van-cell-group inset>
          <van-field
            v-model="shopName"
            label="店铺名称"
            placeholder="请输入店铺名称或商品名称"
            clearable
            @keyup.enter="handleSearch"
          />
        </van-cell-group>

        <div class="tips">
          <van-icon name="info-o" />
          <span>输入店铺名称可以搜索该店铺的所有商品</span>
        </div>

        <van-button
          type="primary"
          block
          :loading="loading"
          @click="handleSearch"
          class="search-btn"
        >
          搜索商品
        </van-button>
      </div>
    </div>

    <!-- 步骤 2: 选择商品 -->
    <div v-if="step === 2" class="step-content">
      <div class="result-header">
        <span>找到 {{ searchResults.length }} 个商品</span>
        <van-button size="small" @click="step = 1">重新搜索</van-button>
      </div>

      <div class="activity-list">
        <div
          v-for="item in searchResults"
          :key="item.activitygoods_id"
          class="activity-item"
          @click="selectActivity(item)"
        >
          <div class="item-image">
            <van-image
              :src="item.image"
              fit="cover"
            >
              <template #loading>
                <van-loading type="spinner" size="20" />
              </template>
            </van-image>
            <div v-if="item.sy_store === 0" class="sold-out-badge">
              已抢光
            </div>
          </div>

          <div class="item-content">
            <div class="item-title">{{ item.title }}</div>
            <div class="item-shop">
              <van-icon name="shop-o" />
              {{ item.shop_name }}
            </div>
            <div class="item-price">
              <span class="current-price">¥{{ formatPrice(item.price) }}</span>
              <span class="original-price">¥{{ formatPrice(item.y_price) }}</span>
              <span class="sales">已售{{ item.sales_volume }}</span>
            </div>
          </div>

          <van-icon name="arrow" class="arrow-icon" />
        </div>
      </div>
    </div>

    <!-- 步骤 3: 设置目标价格 -->
    <div v-if="step === 3" class="step-content">
      <div class="selected-activity" v-if="selectedActivity">
        <div class="activity-card">
          <van-image
            :src="selectedActivity.image"
            width="80"
            height="80"
            fit="cover"
            round
          />
          <div class="activity-info">
            <div class="activity-title">{{ selectedActivity.title }}</div>
            <div class="activity-shop">{{ selectedActivity.shop_name }}</div>
            <div class="activity-price">
              当前价格: ¥{{ formatPrice(selectedActivity.price) }}
            </div>
          </div>
        </div>
      </div>

      <van-cell-group inset>
        <van-field
          v-model="targetPrice"
          label="目标价格"
          type="number"
          placeholder="请输入目标价格"
          :rules="[{ required: true, message: '请输入目标价格' }]"
        >
          <template #button>
            <span class="price-unit">元</span>
          </template>
        </van-field>
      </van-cell-group>

      <!-- 历史数据提示 -->
      <div class="history-tip" v-if="yesterdayData">
        <div class="tip-header">
          <van-icon name="clock-o" />
          <span>历史成交数据参考</span>
        </div>
        <div class="tip-content">
          <div class="tip-row">
            <span class="tip-label">日期：</span>
            <span class="tip-value">{{ yesterdayData.date }}</span>
          </div>
          <div class="tip-row highlight">
            <span class="tip-label">成交价：</span>
            <span class="tip-value price">¥{{ yesterdayData.finalPrice.toFixed(2) }}</span>
          </div>
        </div>
      </div>

      <div class="tips">
        <van-icon name="info-o" />
        <span>当商品价格低于或等于目标价格时，系统将记录价格变动</span>
      </div>

      <div class="monitor-info">
        <div class="info-title">监听规则</div>
        <div class="info-item">
          <van-icon name="clock-o" />
          <span>每10秒自动检查一次价格</span>
        </div>
        <div class="info-item">
          <van-icon name="calendar-o" />
          <span>每天0点自动重置监听</span>
        </div>
        <div class="info-item">
          <van-icon name="stop-circle-o" />
          <span>售罄后记录成交价，次日继续监听</span>
        </div>
      </div>

      <van-button
        type="primary"
        block
        :loading="loading"
        @click="handleCreate"
        class="create-btn"
      >
        创建监听任务
      </van-button>
    </div>
  </div>
</template>

<style scoped>
.create-page {
  min-height: 100vh;
  background-color: #f7f8fa;
  padding-bottom: 20px;
}

:deep(.van-steps) {
  background: white;
  padding: 16px;
  margin-bottom: 12px;
}

.step-content {
  padding: 16px;
}

.search-section {
  max-width: 500px;
  margin: 0 auto;
}

.search-btn {
  margin-top: 24px;
}

.tips {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 12px;
  padding: 8px 12px;
  background: #fff7e6;
  border-radius: 4px;
  font-size: 13px;
  color: #ff976a;
}

.tips :deep(.van-icon) {
  font-size: 14px;
}

.result-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  padding: 0 4px;
  font-size: 14px;
  color: #646566;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.2s;
}

.activity-item:active {
  transform: scale(0.98);
}

.item-image {
  width: 80px;
  height: 80px;
  flex-shrink: 0;
  position: relative;
  border-radius: 4px;
  overflow: hidden;
}

.item-image :deep(.van-image) {
  width: 100%;
  height: 100%;
}

.sold-out-badge {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 12px;
  font-weight: 600;
}

.item-content {
  flex: 1;
  min-width: 0;
}

.item-title {
  font-size: 14px;
  font-weight: 500;
  color: #323233;
  margin-bottom: 6px;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.item-shop {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #969799;
  margin-bottom: 6px;
}

.item-shop :deep(.van-icon) {
  font-size: 12px;
}

.item-price {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.current-price {
  font-size: 16px;
  font-weight: 600;
  color: #ee0a24;
}

.original-price {
  font-size: 12px;
  color: #969799;
  text-decoration: line-through;
}

.sales {
  font-size: 12px;
  color: #969799;
  margin-left: auto;
}

.arrow-icon {
  font-size: 16px;
  color: #c8c9cc;
}

.selected-activity {
  margin-bottom: 16px;
}

.activity-card {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: white;
  border-radius: 8px;
}

.activity-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 6px;
}

.activity-title {
  font-size: 15px;
  font-weight: 500;
  color: #323233;
}

.activity-shop {
  font-size: 13px;
  color: #969799;
}

.activity-price {
  font-size: 14px;
  color: #ee0a24;
  font-weight: 600;
}

.price-unit {
  color: #969799;
  font-size: 14px;
}

.monitor-info {
  margin-top: 16px;
  padding: 16px;
  background: white;
  border-radius: 8px;
}

.info-title {
  font-size: 15px;
  font-weight: 500;
  color: #323233;
  margin-bottom: 12px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  font-size: 13px;
  color: #646566;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-item :deep(.van-icon) {
  font-size: 16px;
  color: #1989fa;
}

.create-btn {
  margin-top: 24px;
}

.history-tip {
  margin-top: 16px;
  padding: 16px;
  background: linear-gradient(135deg, #fff7e6 0%, #ffe7ba 100%);
  border-radius: 8px;
  border: 1px solid #ffd666;
}

.tip-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 600;
  color: #d48806;
}

.tip-header :deep(.van-icon) {
  font-size: 16px;
}

.tip-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tip-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: #8c6d1f;
}

.tip-row.highlight {
  padding: 6px 10px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 4px;
}

.tip-label {
  color: #8c6d1f;
}

.tip-value {
  font-weight: 500;
}

.tip-value.price {
  font-size: 16px;
  font-weight: 700;
  color: #d48806;
}
</style>
