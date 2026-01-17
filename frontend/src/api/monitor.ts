import axios from 'axios'

const api = axios.create({
  baseURL: '/tantantang/api',
  timeout: 10000,
})

export interface MonitorTask {
  id: string
  shopName: string
  targetActivityId: number
  targetPrice: number
  status: 'active' | 'completed' | 'expired' | 'stopped' | 'sold_out_today'
  createdAt: string
  lastCheckedAt?: string
  currentPrice?: number // 当前价格
  currentStock?: number // 当前库存
  dailyRecords: DailyRecord[]
  lastNotifiedPrice?: number // 最后推送通知时的价格
}

export interface DailyRecord {
  date: string // YYYY-MM-DD
  finalPrice: number
  soldOutTime?: string
}

export interface CreateMonitorTaskDto {
  shopName: string
  targetActivityId: number
  targetPrice: number
}

export const createMonitorTask = (data: CreateMonitorTaskDto) => {
  return api.post<MonitorTask>('/monitor/task', data)
}

export const getMonitorTasks = () => {
  return api.get<MonitorTask[]>('/monitor/tasks')
}

export const getMonitorTask = (id: string) => {
  return api.get<MonitorTask>(`/monitor/task/${id}`)
}

export const deleteMonitorTask = (id: string) => {
  return api.delete<{ success: boolean }>(`/monitor/task/${id}`)
}

export const stopMonitorTask = (id: string) => {
  return api.post<{ success: boolean }>(`/monitor/task/${id}/stop`)
}

export const updateTargetPrice = (id: string, targetPrice: number) => {
  return api.patch<{ success: boolean }>(`/monitor/task/${id}/price`, { targetPrice })
}

export const cleanupTasks = () => {
  return api.post<{ count: number }>('/monitor/cleanup')
}

export const getHistoricalData = (activityId: number) => {
  return api.get<DailyRecord[]>(`/monitor/historical/${activityId}`)
}
