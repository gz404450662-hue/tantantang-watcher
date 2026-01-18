import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ActivityService } from '../activity/activity.service';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';

export interface MonitorTask {
    id: string;
    shopName: string;
    targetActivityId: number;
    targetPrice: number;
    status: 'active' | 'completed' | 'expired' | 'stopped' | 'sold_out_today';
    createdAt: Date;
    lastCheckedAt?: Date;
    currentPrice?: number; // 当前价格
    currentStock?: number; // 当前库存
    dailyRecords: DailyRecord[]; // 每日成交记录
    lastNotifiedPrice?: number; // 最后推送通知时的价格，用于避免重复推送
}

export interface DailyRecord {
    date: string; // YYYY-MM-DD
    finalPrice: number; // 当天最终成交价格
    soldOutTime?: Date; // 售罄时间
}

export interface CreateMonitorTaskDto {
    shopName: string;
    targetActivityId: number;
    targetPrice: number;
}

export interface UpdateTargetPriceDto {
    targetPrice: number;
}

@Injectable()
export class MonitorService implements OnModuleInit {
    private readonly logger = new Logger(MonitorService.name);
    private tasks: Map<string, MonitorTask> = new Map();
    private timers: Map<string, NodeJS.Timeout> = new Map();
    private dailyResetTimer: NodeJS.Timeout | null = null;
    private readonly dataDir = path.join(process.cwd(), 'data');
    private readonly dataFile = path.join(this.dataDir, 'monitor-tasks.json');
    private readonly NOTIFY_URL = 'https://api.day.app/9V4LZSo9sw5JfKvvTrbAPY';

    constructor(private readonly activityService: ActivityService) { }

    // 模块初始化时加载数据
    async onModuleInit() {
        await this.loadTasksFromFile();
        this.startDailyResetTask();
        this.logger.log('监听服务已启动，数据已从文件加载');
    }

    // 从文件加载任务
    private async loadTasksFromFile(): Promise<void> {
        try {
            // 确保数据目录存在
            if (!fs.existsSync(this.dataDir)) {
                fs.mkdirSync(this.dataDir, { recursive: true });
                this.logger.log(`创建数据目录: ${this.dataDir}`);
            }

            // 检查数据文件是否存在
            if (!fs.existsSync(this.dataFile)) {
                this.logger.log('数据文件不存在，创建新文件');
                await this.saveTasksToFile();
                return;
            }

            // 读取文件
            const data = fs.readFileSync(this.dataFile, 'utf-8');
            const tasksArray = JSON.parse(data) as MonitorTask[];

            // 恢复任务数据（转换日期字符串为 Date 对象）
            tasksArray.forEach((task) => {
                task.createdAt = new Date(task.createdAt);
                if (task.lastCheckedAt) {
                    task.lastCheckedAt = new Date(task.lastCheckedAt);
                }

                // 确保有 dailyRecords 字段（兼容旧数据）
                if (!task.dailyRecords) {
                    task.dailyRecords = [];
                } else {
                    task.dailyRecords = task.dailyRecords.map((record) => ({
                        ...record,
                        soldOutTime: record.soldOutTime ? new Date(record.soldOutTime) : undefined,
                    }));
                }

                this.tasks.set(task.id, task);

                // 检查是否需要重置状态（新的一天）
                if (task.status === 'sold_out_today') {
                    const today = this.getToday();
                    const lastCheckDay = task.lastCheckedAt
                        ? this.formatDate(new Date(task.lastCheckedAt))
                        : null;

                    if (lastCheckDay !== today) {
                        // 新的一天，重置状态
                        task.status = 'active';
                        task.currentPrice = undefined;
                        task.currentStock = undefined;
                        task.lastNotifiedPrice = undefined; // 重置推送记录，允许新一天再次推送
                        this.logger.log(`任务 ${task.id} 进入新的一天，重置状态为 active`);
                    }
                }

                // 重启 active 状态的任务监听
                if (task.status === 'active') {
                    this.startMonitoring(task.id);
                    this.logger.log(`恢复监听任务: ${task.id}`);
                }
            });

            this.logger.log(`从文件加载了 ${tasksArray.length} 个任务`);
        } catch (error) {
            this.logger.error(`加载任务失败: ${error.message}`);
        }
    }

    // 保存任务到文件
    private async saveTasksToFile(): Promise<void> {
        try {
            const tasksArray = Array.from(this.tasks.values());
            const data = JSON.stringify(tasksArray, null, 2);
            fs.writeFileSync(this.dataFile, data, 'utf-8');
            this.logger.debug(`已保存 ${tasksArray.length} 个任务到文件`);
        } catch (error) {
            this.logger.error(`保存任务失败: ${error.message}`);
        }
    }

    // 创建监听任务
    async createTask(dto: CreateMonitorTaskDto): Promise<MonitorTask> {
        const taskId = this.generateTaskId();

        const task: MonitorTask = {
            id: taskId,
            shopName: dto.shopName,
            targetActivityId: dto.targetActivityId,
            targetPrice: dto.targetPrice,
            status: 'active',
            createdAt: new Date(),
            dailyRecords: [],
        };

        this.tasks.set(taskId, task);
        await this.saveTasksToFile(); // 保存到文件
        this.startMonitoring(taskId);

        this.logger.log(`创建监听任务: ${taskId}, 店铺: ${dto.shopName}, 目标价格: ${dto.targetPrice}`);

        return task;
    }

    // 获取所有任务
    getAllTasks(): MonitorTask[] {
        return Array.from(this.tasks.values());
    }

    // 获取单个任务
    getTask(taskId: string): MonitorTask | undefined {
        return this.tasks.get(taskId);
    }

    // 删除任务
    async deleteTask(taskId: string): Promise<boolean> {
        this.stopMonitoring(taskId);
        const result = this.tasks.delete(taskId);
        if (result) {
            await this.saveTasksToFile(); // 保存到文件
        }
        return result;
    }

    // 停止任务
    async stopTask(taskId: string): Promise<boolean> {
        const task = this.tasks.get(taskId);
        if (task && task.status === 'active') {
            task.status = 'stopped';
            this.stopMonitoring(taskId);
            await this.saveTasksToFile(); // 保存到文件
            this.logger.log(`停止监听任务: ${taskId}`);
            return true;
        }
        return false;
    }

    // 更新目标价格
    async updateTargetPrice(taskId: string, targetPrice: number): Promise<boolean> {
        const task = this.tasks.get(taskId);
        if (!task) {
            return false;
        }

        task.targetPrice = targetPrice;
        await this.saveTasksToFile(); // 保存到文件
        this.logger.log(`更新任务 ${taskId} 目标价格: ${targetPrice}`);
        return true;
    }

    // 开始监控
    private startMonitoring(taskId: string): void {
        const task = this.tasks.get(taskId);
        if (!task) return;

        // 立即检查一次
        this.checkPrice(taskId);

        // 每10秒检查一次
        const timer = setInterval(() => {
            this.checkPrice(taskId);
        }, 10000);

        this.timers.set(taskId, timer);
    }

    // 停止监控
    private stopMonitoring(taskId: string): void {
        const timer = this.timers.get(taskId);
        if (timer) {
            clearInterval(timer);
            this.timers.delete(taskId);
        }
    }

    // 检查价格
    private async checkPrice(taskId: string): Promise<void> {
        const task = this.tasks.get(taskId);
        if (!task || task.status !== 'active') {
            this.stopMonitoring(taskId);
            return;
        }

        try {
            // 通过店铺名称搜索活动
            const response = await this.activityService.queryActivity({
                searchKey: task.shopName,
                page: '1',
                count: '100', // 获取更多结果以便过滤
            });

            if (response.code !== 1 || !response.data?.data) {
                this.logger.warn(`任务 ${taskId} 搜索失败: ${response.msg}`);
                return;
            }

            // 从列表中找到目标商品
            const activities = response.data.data;
            const targetActivity = activities.find(
                (item: any) => item.activitygoods_id === task.targetActivityId,
            );

            if (!targetActivity) {
                this.logger.warn(`任务 ${taskId} 未找到目标商品 ID: ${task.targetActivityId}`);
                return;
            }

            const currentPrice = parseFloat(targetActivity.price);
            const sy_store = targetActivity.sy_store;

            // 更新当前价格和库存
            task.currentPrice = currentPrice;
            task.currentStock = sy_store;
            task.lastCheckedAt = new Date();

            // 保存更新
            await this.saveTasksToFile();

            this.logger.log(
                `任务 ${taskId} - 当前价格: ${currentPrice}, 剩余库存: ${sy_store}, 目标价格: ${task.targetPrice}`,
            );

            // 检查是否已抢光
            if (sy_store === 0) {
                // 记录今日成交数据
                await this.recordDailyData(task, currentPrice);

                // 发送售罄通知
                await this.sendSoldOutNotification(task, currentPrice);

                task.status = 'sold_out_today';
                this.stopMonitoring(taskId);
                await this.saveTasksToFile(); // 保存状态变更
                this.logger.log(`任务 ${taskId} 今日售罄（价格: ${currentPrice}），明天将继续监听`);
                return;
            }

            // 检查价格是否达到目标
            if (currentPrice <= task.targetPrice) {
                this.logger.log(`🎉 任务 ${taskId} 价格已达到目标！当前: ${currentPrice}, 目标: ${task.targetPrice}`);

                // 检查是否需要推送通知（避免重复推送相同价格）
                if (task.lastNotifiedPrice === undefined || currentPrice < task.lastNotifiedPrice) {
                    await this.sendPriceNotification(task, currentPrice);
                    task.lastNotifiedPrice = currentPrice;
                    await this.saveTasksToFile(); // 保存推送记录
                }
            }
        } catch (error) {
            this.logger.error(`任务 ${taskId} 检查价格出错:`, error.message);
        }
    }

    // 发送价格达标通知
    private async sendPriceNotification(task: MonitorTask, currentPrice: number): Promise<void> {
        try {
            // 构建通知消息
            const stockInfo = task.currentStock !== undefined ? `库存${task.currentStock}` : '';
            const message = `【价格提醒】${task.shopName}\n当前价格: ¥${currentPrice.toFixed(2)}\n目标价格: ¥${task.targetPrice.toFixed(2)}\n${stockInfo}`;
            const notifyUrl = `${this.NOTIFY_URL}/${encodeURIComponent(message)}`;

            this.logger.log(`发送价格提醒通知: ${message.replace(/\n/g, ' ')}`);

            const response = await axios.get(notifyUrl, {
                timeout: 5000, // 5秒超时
            });

            if (response.status === 200) {
                this.logger.log(`✅ 通知发送成功: 任务 ${task.id}`);
            } else {
                this.logger.warn(`⚠️ 通知发送失败: 任务 ${task.id}, 状态码: ${response.status}`);
            }
        } catch (error) {
            this.logger.error(`❌ 发送通知失败: 任务 ${task.id}, 错误: ${error.message}`);
            // 通知失败不影响主流程，只记录错误
        }
    }

    // 发送售罄通知
    private async sendSoldOutNotification(task: MonitorTask, finalPrice: number): Promise<void> {
        try {
            const message = `【售罄提醒】${task.shopName}\n今日已售罄\n最终价格: ¥${finalPrice.toFixed(2)}\n目标价格: ¥${task.targetPrice.toFixed(2)}`;
            const notifyUrl = `${this.NOTIFY_URL}/${encodeURIComponent(message)}`;

            this.logger.log(`发送售罄通知: ${message.replace(/\n/g, ' ')}`);

            const response = await axios.get(notifyUrl, {
                timeout: 5000,
            });

            if (response.status === 200) {
                this.logger.log(`✅ 售罄通知发送成功: 任务 ${task.id}`);
            } else {
                this.logger.warn(`⚠️ 售罄通知发送失败: 任务 ${task.id}, 状态码: ${response.status}`);
            }
        } catch (error) {
            this.logger.error(`❌ 发送售罄通知失败: 任务 ${task.id}, 错误: ${error.message}`);
        }
    }

    // 记录每日成交数据
    private async recordDailyData(task: MonitorTask, finalPrice: number): Promise<void> {
        const today = this.getToday();

        // 检查今天是否已记录
        const existingRecord = task.dailyRecords.find(r => r.date === today);
        if (existingRecord) {
            return; // 已记录过了
        }

        const dailyRecord: DailyRecord = {
            date: today,
            finalPrice,
            soldOutTime: new Date(),
        };

        task.dailyRecords.push(dailyRecord);

        this.logger.log(
            `记录任务 ${task.id} 今日成交数据: 成交价=${finalPrice}`
        );
    }

    // 获取今天的日期字符串 YYYY-MM-DD
    private getToday(): string {
        return this.formatDate(new Date());
    }

    // 格式化日期为 YYYY-MM-DD
    private formatDate(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // 启动每日重置任务
    private startDailyResetTask(): void {
        // 计算到明天凌晨0点30分的时间
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 30, 0, 0); // 设置为0点30分
        const msUntilReset = tomorrow.getTime() - now.getTime();

        this.logger.log(`将在 ${Math.round(msUntilReset / 1000 / 60)} 分钟后（凌晨0:30）执行每日重置任务`);

        // 设置到明天凌晨0:30执行
        this.dailyResetTimer = setTimeout(() => {
            this.resetDailySoldOutTasks();
            // 重置后，设置每24小时执行一次
            this.dailyResetTimer = setInterval(() => {
                this.resetDailySoldOutTasks();
            }, 24 * 60 * 60 * 1000);
        }, msUntilReset);
    }

    // 重置昨天售罄的任务
    private async resetDailySoldOutTasks(): Promise<void> {
        this.logger.log('🌅 执行每日重置任务...');
        const today = this.getToday();
        let resetCount = 0;

        for (const [taskId, task] of this.tasks.entries()) {
            if (task.status === 'sold_out_today') {
                const lastCheckDay = task.lastCheckedAt
                    ? this.formatDate(new Date(task.lastCheckedAt))
                    : null;

                if (lastCheckDay !== today) {
                    // 新的一天，重置状态
                    task.status = 'active';
                    task.currentPrice = undefined;
                    task.currentStock = undefined;
                    task.lastNotifiedPrice = undefined;
                    
                    this.logger.log(`✨ 任务 ${task.id} (${task.shopName}) 进入新的一天，重置状态为 active`);
                    
                    // 重新启动监听
                    this.startMonitoring(taskId);
                    resetCount++;
                }
            }
        }

        if (resetCount > 0) {
            await this.saveTasksToFile();
            this.logger.log(`🎉 成功重置 ${resetCount} 个任务，开始新一天的监听`);
        } else {
            this.logger.log('✅ 没有需要重置的任务');
        }
    }

    // 生成任务ID
    private generateTaskId(): string {
        return `task_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }

    // 清理所有已完成或过期的任务
    async cleanupTasks(): Promise<number> {
        let count = 0;
        for (const [taskId, task] of this.tasks.entries()) {
            if (task.status === 'completed' || task.status === 'expired') {
                await this.deleteTask(taskId);
                count++;
            }
        }
        this.logger.log(`清理了 ${count} 个已完成/过期的任务`);
        return count;
    }

    // 获取商品的历史成交数据（用于创建任务时的参考）
    async getHistoricalData(activityId: number): Promise<DailyRecord[]> {
        const allRecords: DailyRecord[] = [];

        // 遍历所有任务，找出该商品的历史记录
        for (const task of this.tasks.values()) {
            if (task.targetActivityId === activityId && task.dailyRecords.length > 0) {
                allRecords.push(...task.dailyRecords);
            }
        }

        // 按日期排序（最新的在前）
        allRecords.sort((a, b) => b.date.localeCompare(a.date));

        return allRecords;
    }
}
