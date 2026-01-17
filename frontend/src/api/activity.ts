import axios from 'axios'

const api = axios.create({
  baseURL: '/tantantang/api',
  timeout: 10000,
})

export interface Activity {
  activitygoods_id: number
  activity_id: number
  first_price: string
  title: string
  hot: number
  y_price: string
  price: string
  shop_name: string
  is_stop: number
  is_sell: number
  sy_store: number
  is_top: number
  sales_volume: number
  kj_num: number
  lon: string
  lat: string
  rank3: string
  is_m_shop: number
  daily_buy_limit: number
  image: string
  share_image: string
  tags: string[]
  distance: number
  is_cut: number
  kan: number
  is_tag: number
  appl_stores_num?: number
}

export interface ActivityResponse {
  code: number
  msg: string
  time: string
  data: {
    data: Activity[]
  }
}

export interface ActivityDetail {
  id: number
  user_id: number
  activity_id: number
  goods_id: number
  shop_id: number
  title: string
  y_price: string
  price: string
  first_price: string
  store: number
  sy_store: number
  hot: number
  is_sell: number
  kan: number
  goods: {
    title: string
    tags: string
    content: string
    content2: string
    content3: string
    appl_stores_num: number
    is_tag: number
    image_url: string[]
    share_image_url: string[]
    images_url: string[]
  }
  shop: {
    id: number
    shop_name: string
    prove_image: string
    tags: string
    money: string
    phone: string
    address: string
    lon: string
    lat: string
    city_id: number
    c_type: number
    image_url: string[]
    images_url: string[]
    proveimage_url: string[]
  }
  activity: {
    id: number
    rank3: string
    is_m_shop: number
    is_sell_text: string
    status_text: string
  }
  is_sell_text: string
  grass: any[]
  rice: number
  is_cut: number
}

export interface ActivityDetailResponse {
  code: number
  msg: string
  time: string
  data: ActivityDetail
}

export const getActivityList = (params: {
  page?: number
  count?: number
  city?: string
}) => {
  return api.get<ActivityResponse>('/activity/list', {
    params: {
      page: params.page || 1,
      count: params.count || 10,
      city: params.city || '广州市',
    },
  })
}

export const searchActivity = (params: {
  keyword: string
  page?: number
  count?: number
  city?: string
}) => {
  return api.get<ActivityResponse>('/activity/search', {
    params: {
      keyword: params.keyword,
      page: params.page || 1,
      count: params.count || 10,
      city: params.city || '广州市',
    },
  })
}

export const getActivityDetail = (id: string | number) => {
  return api.get<ActivityDetailResponse>(`/activity/detail/${id}`)
}
