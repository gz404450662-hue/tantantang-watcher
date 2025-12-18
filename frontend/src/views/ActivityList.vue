<script setup lang="ts">
import { ref, onMounted, onActivated } from 'vue'
import { useRouter } from 'vue-router'
import { getActivityList, searchActivity, type Activity } from '../api/activity'
import { showToast } from 'vant'

const router = useRouter()
const activities = ref<Activity[]>([])
const loading = ref(false)
const finished = ref(false)
const page = ref(1)
const searchKeyword = ref('')
const isSearchMode = ref(false)
const isFirstLoad = ref(true)

const loadActivities = async () => {
  if (loading.value) return
  
  loading.value = true
  try {
    const response = isSearchMode.value
      ? await searchActivity({ keyword: searchKeyword.value, page: page.value })
      : await getActivityList({ page: page.value })
    console.log(response)
    if (response.data.code === 1) {
      const newData = response.data.data.data
      if (newData.length === 0) {
        finished.value = true
      } else {
        activities.value = [...activities.value, ...newData]
        page.value++
      }
    } else {
      showToast(response.data.msg || '加载失败')
    }
  } catch (error) {
    showToast('网络错误，请稍后重试')
    console.error(error)
  } finally {
    loading.value = false
  }
}

const onSearch = async () => {
  isSearchMode.value = true
  page.value = 1
  activities.value = []
  finished.value = false
  await loadActivities()
}

const onCancel = () => {
  searchKeyword.value = ''
  isSearchMode.value = false
  page.value = 1
  activities.value = []
  finished.value = false
  loadActivities()
}

const formatPrice = (price: string) => {
  return parseFloat(price).toFixed(2)
}

const formatDistance = (distance: number) => {
  if (distance < 1000) {
    return `${Math.round(distance)}m`
  }
  return `${(distance / 1000).toFixed(1)}km`
}

const goToDetail = (id: number) => {
  router.push(`/detail/${id}`)
}

// 首次加载
onMounted(() => {
  if (isFirstLoad.value) {
    loadActivities()
    isFirstLoad.value = false
  }
})

// keep-alive 激活时不重新加载
onActivated(() => {
  // 从详情页返回时不重新加载数据
  // 数据已经被 keep-alive 缓存了
})

// 跳转到监听列表
const goToMonitorList = () => {
  router.push('/monitor/list')
}
</script>

<template>
  <div class="activity-page">
    <!-- 搜索栏 -->
    <van-sticky>
      <van-search
        v-model="searchKeyword"
        placeholder="搜索活动"
        show-action
        @search="onSearch"
      >
        <template #action>
          <div @click="onSearch" v-if="!isSearchMode">搜索</div>
          <div @click="onCancel" v-else>取消</div>
        </template>
        <template #left>
          <van-button 
            type="primary" 
            size="small"
            icon="chart-trending-o"
            @click="goToMonitorList"
          >
            价格监听
          </van-button>
        </template>
      </van-search>
    </van-sticky>

    <!-- 活动列表 -->
    <van-list
      v-model="loading"
      :finished="finished"
      finished-text="没有更多了"
      @load="loadActivities"
      class="activity-list"
    >
      <div
        v-for="item in activities"
        :key="item.activitygoods_id"
        class="activity-item"
        @click="goToDetail(item.activitygoods_id)"
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
          <!-- 已抢光标识 -->
          <div v-if="item.sy_store === 0" class="sold-out-badge">
            <span>已抢光</span>
          </div>
        </div>

        <div class="item-content">
          <div class="item-title">{{ item.title }}</div>
          
          <div class="item-shop">
            <van-icon name="shop-o" />
            <span>{{ item.shop_name }}</span>
          </div>

          <div class="item-tags" v-if="item.tags && item.tags.length > 0">
            <van-tag
              v-for="(tag, index) in item.tags"
              :key="index"
              type="warning"
              size="small"
            >
              {{ tag }}
            </van-tag>
          </div>

          <div class="item-footer">
            <div class="price-info">
              <span class="current-price">¥{{ formatPrice(item.price) }}</span>
              <span class="original-price">¥{{ formatPrice(item.y_price) }}</span>
            </div>
            
            <div class="extra-info">
              <span class="sales">已售{{ item.sales_volume }}</span>
              <span class="distance" v-if="item.distance">
                <van-icon name="location-o" />
                {{ formatDistance(item.distance) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </van-list>

    <!-- 空状态 -->
    <van-empty
      v-if="!loading && activities.length === 0"
      description="暂无活动"
    />
  </div>
</template>

<style scoped>
.activity-page {
  min-height: 100vh;
  background-color: #f7f8fa;
  padding-bottom: 20px;
}

.activity-list {
  padding: 12px;
}

.activity-item {
  display: flex;
  background: #fff;
  border-radius: 8px;
  margin-bottom: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: transform 0.2s;
}

.activity-item:active {
  transform: scale(0.98);
}

.item-image {
  width: 120px;
  height: 120px;
  flex-shrink: 0;
  position: relative;
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
}

.sold-out-badge span {
  background: #ee0a24;
  color: white;
  padding: 6px 16px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 600;
  transform: rotate(-15deg);
}

.item-content {
  flex: 1;
  padding: 12px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-width: 0;
}

.item-title {
  font-size: 15px;
  font-weight: 500;
  color: #323233;
  line-height: 20px;
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-shop {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #969799;
  margin-bottom: 8px;
}

.item-shop :deep(.van-icon) {
  font-size: 14px;
}

.item-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}

.item-footer {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.price-info {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.current-price {
  font-size: 20px;
  font-weight: 600;
  color: #ee0a24;
}

.original-price {
  font-size: 13px;
  color: #969799;
  text-decoration: line-through;
}

.extra-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  font-size: 12px;
  color: #969799;
}

.sales {
  color: #969799;
}

.distance {
  display: flex;
  align-items: center;
  gap: 2px;
}

.distance :deep(.van-icon) {
  font-size: 12px;
}
</style>
