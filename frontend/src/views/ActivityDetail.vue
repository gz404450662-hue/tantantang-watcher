<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getActivityDetail, type ActivityDetail } from '../api/activity'
import { showToast } from 'vant'

const route = useRoute()
const router = useRouter()
const detail = ref<ActivityDetail | null>(null)
const loading = ref(true)

const formatPrice = (price: string) => {
  return parseFloat(price).toFixed(2)
}

const discount = computed(() => {
  if (!detail.value) return '0'
  const current = parseFloat(detail.value.price)
  const original = parseFloat(detail.value.y_price)
  if (original === 0) return '0'
  return ((current / original) * 10).toFixed(1)
})

const loadDetail = async () => {
  loading.value = true
  try {
    const response = await getActivityDetail(route.params.id as string)
    if (response.data.code === 1) {
      detail.value = response.data.data
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

const onClickLeft = () => {
  router.back()
}

const onBuy = () => {
  showToast('购买功能开发中...')
}

const createMonitor = () => {
  if (!detail.value) return
  router.push({
    path: '/monitor/create',
    query: {
      shopName: detail.value.shop.shop_name,
      activityId: detail.value.id.toString(),
      price: detail.value.price,
    }
  })
}

onMounted(() => {
  loadDetail()
})
</script>

<template>
  <div class="detail-page">
    <van-nav-bar
      title="活动详情"
      left-arrow
      fixed
      @click-left="onClickLeft"
    />

    <div v-if="loading" class="loading-container">
      <van-loading type="spinner" size="40">加载中...</van-loading>
    </div>

    <div v-else-if="detail" class="detail-content">
      <!-- 图片轮播 -->
      <div class="swipe-container">
        <van-swipe class="detail-swipe" :autoplay="3000" indicator-color="white">
          <van-swipe-item v-for="(image, index) in detail.goods.images_url" :key="index">
            <van-image :src="image" fit="cover" />
          </van-swipe-item>
        </van-swipe>
        <!-- 已抢光遮罩 -->
        <div v-if="detail.sy_store === 0" class="sold-out-overlay">
          <div class="sold-out-text">已抢光</div>
        </div>
      </div>

      <!-- 价格信息 -->
      <div class="price-section">
        <div class="price-main">
          <div class="current-price">
            <span class="symbol">¥</span>
            <span class="amount">{{ formatPrice(detail.price) }}</span>
            <span class="discount-tag">{{ discount }}折</span>
          </div>
          <div class="original-price">原价 ¥{{ formatPrice(detail.y_price) }}</div>
        </div>
        <div class="price-extra">
          <div class="stock-info" :class="{ 'stock-empty': detail.sy_store === 0 }">
            <van-icon :name="detail.sy_store === 0 ? 'warning-o' : 'fire-o'" color="#ee0a24" />
            <span>{{ detail.sy_store === 0 ? '已抢光' : `剩余${detail.sy_store}份` }}</span>
          </div>
          <div class="hot-info">
            <van-icon name="eye-o" />
            <span>{{ detail.hot }}人浏览</span>
          </div>
        </div>
      </div>

      <!-- 标题信息 -->
      <div class="title-section">
        <h1 class="title">{{ detail.title }}</h1>
        <div class="title-tags" v-if="detail.goods.tags">
          <van-tag 
            v-for="(tag, index) in detail.goods.tags.split(',')" 
            :key="index"
            type="warning"
            plain
          >
            {{ tag }}
          </van-tag>
        </div>
      </div>

      <!-- 商家信息 -->
      <div class="shop-section">
        <div class="section-title">
          <van-icon name="shop-o" />
          <span>商家信息</span>
        </div>
        <div class="shop-info">
          <div class="shop-name">{{ detail.shop.shop_name }}</div>
          <div class="shop-tags" v-if="detail.shop.tags">
            <van-tag size="small">{{ detail.shop.tags }}</van-tag>
          </div>
          <div class="shop-item">
            <van-icon name="phone-o" />
            <span>{{ detail.shop.phone }}</span>
            <van-button 
              type="primary" 
              size="mini" 
              plain
              @click="() => showToast('拨打电话')"
            >
              拨打
            </van-button>
          </div>
          <div class="shop-item">
            <van-icon name="location-o" />
            <span>{{ detail.shop.address }}</span>
          </div>
        </div>
      </div>

      <!-- 套餐详情 -->
      <div class="content-section" v-if="detail.goods.content3">
        <div class="section-title">
          <van-icon name="bars" />
          <span>套餐详情</span>
        </div>
        <div class="rich-content" v-html="detail.goods.content3"></div>
      </div>

      <!-- 使用说明 -->
      <div class="content-section" v-if="detail.goods.content">
        <div class="section-title">
          <van-icon name="info-o" />
          <span>使用说明</span>
        </div>
        <div class="rich-content" v-html="detail.goods.content"></div>
      </div>

      <!-- 占位符，防止底部按钮遮挡内容 -->
      <div style="height: 60px;"></div>
    </div>

    <!-- 底部操作栏 -->
    <div class="bottom-bar" v-if="detail">
      <div class="bar-left">
        <van-button 
          type="default" 
          size="small"
          icon="clock-o"
          plain
          @click="createMonitor"
        >
          监听价格
        </van-button>
      </div>
      <div class="bar-right">
        <div class="price-display">
          <span class="label">抢购价</span>
          <span class="price">¥{{ formatPrice(detail.price) }}</span>
        </div>
        <van-button 
          type="danger" 
          size="large" 
          round
          class="buy-button"
          :disabled="detail.sy_store === 0"
          @click="onBuy"
        >
          {{ detail.sy_store === 0 ? '已抢光' : '立即抢购' }}
        </van-button>
      </div>
    </div>

    <van-empty v-if="!loading && !detail" description="活动不存在" />
  </div>
</template>

<style scoped>
.detail-page {
  min-height: 100vh;
  background-color: #f7f8fa;
  padding-top: 46px;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 60vh;
}

.detail-content {
  padding-bottom: 20px;
}

.swipe-container {
  position: relative;
  height: 375px;
}

.detail-swipe {
  height: 375px;
  background-color: #f0f0f0;
}

.detail-swipe :deep(.van-image) {
  width: 100%;
  height: 100%;
}

.sold-out-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.sold-out-text {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee0a24 100%);
  color: white;
  padding: 12px 40px;
  border-radius: 8px;
  font-size: 28px;
  font-weight: 700;
  transform: rotate(-15deg);
  box-shadow: 0 4px 12px rgba(238, 10, 36, 0.4);
}

.price-section {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee0a24 100%);
  padding: 20px 16px;
  color: white;
}

.price-main {
  margin-bottom: 12px;
}

.current-price {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 6px;
}

.symbol {
  font-size: 20px;
  font-weight: 600;
}

.amount {
  font-size: 36px;
  font-weight: 700;
}

.discount-tag {
  display: inline-block;
  background: rgba(255, 255, 255, 0.25);
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 13px;
}

.original-price {
  font-size: 14px;
  opacity: 0.9;
  text-decoration: line-through;
}

.price-extra {
  display: flex;
  gap: 20px;
  font-size: 13px;
  opacity: 0.95;
}

.stock-info, .hot-info {
  display: flex;
  align-items: center;
  gap: 4px;
}

.stock-info.stock-empty {
  font-weight: 600;
}

.title-section {
  background: white;
  padding: 16px;
  margin-bottom: 8px;
}

.title {
  font-size: 18px;
  font-weight: 600;
  color: #323233;
  line-height: 26px;
  margin-bottom: 10px;
}

.title-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.shop-section,
.content-section {
  background: white;
  padding: 16px;
  margin-bottom: 8px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 16px;
  font-weight: 600;
  color: #323233;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.section-title :deep(.van-icon) {
  font-size: 18px;
  color: #ee0a24;
}

.shop-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.shop-name {
  font-size: 16px;
  font-weight: 600;
  color: #323233;
}

.shop-tags {
  display: flex;
  gap: 6px;
}

.shop-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #646566;
}

.shop-item :deep(.van-icon) {
  color: #969799;
  font-size: 16px;
}

.shop-item span {
  flex: 1;
}

.rich-content {
  font-size: 14px;
  line-height: 24px;
  color: #646566;
}

.rich-content :deep(p) {
  margin-bottom: 10px;
}

.rich-content :deep(img) {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 10px 0;
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  padding: 8px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.08);
  z-index: 100;
}

.bar-left {
  display: flex;
  align-items: center;
}

.bar-right {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
}

.price-display {
  display: flex;
  flex-direction: column;
}

.price-display .label {
  font-size: 12px;
  color: #969799;
}

.price-display .price {
  font-size: 20px;
  font-weight: 700;
  color: #ee0a24;
}

.buy-button {
  width: 120px;
  height: 40px;
}
</style>
