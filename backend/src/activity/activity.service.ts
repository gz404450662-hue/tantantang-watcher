import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { genRqToken } from '../utils/token.util';

@Injectable()
export class ActivityService {
  private readonly baseurl = 'https://ttt.bjlxkjyxgs.cn';
  private readonly headers = {
    'host': 'ttt.bjlxkjyxgs.cn',
    'access-control-allow-origin': '*',
    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36 MicroMessenger/7.0.20.1781(0x6700143B) NetType/WIFI MiniProgramEnv/Mac MacWechat/WMPF MacWechat/3.8.7(0x13080712) UnifiedPCMacWechat(0xf264151c) XWEB/17078',
    'xweb_xhr': '1',
    'content-type': 'application/x-www-form-urlencoded',
    'accept': '*/*',
    'sec-fetch-site': 'cross-site',
    'sec-fetch-mode': 'cors',
    'sec-fetch-dest': 'empty',
    'referer': 'https://servicewechat.com/wx454addfc6819a2ac/119/page-frame.html',
    'accept-encoding': 'gzip, br',
    'accept-language': 'zh-CN,zh;q=0.9',
    'priority': 'u=1, i',
  };

  private client = axios.create({
    baseURL: this.baseurl,
    headers: this.headers,
    timeout: 10000,
  });

  async getActivityList(params: {
    cate_id?: string;
    cate2_id?: string;
    area?: string;
    street?: string;
    page?: string;
    count?: string;
    lon?: string;
    lat?: string;
    city?: string;
  }) {
    const reqData = {
      cate_id: params.cate_id || '14',
      cate2_id: params.cate2_id || '0',
      area: params.area || '',
      street: params.street || '',
      page: params.page || '1',
      count: params.count || '10',
      lon: params.lon || '113.26679992675781',
      lat: params.lat || '23.129009246826172',
      city: params.city || '广州市',
    };

    const reqToken = genRqToken('/api/shop/activity', reqData);
    Object.assign(reqData, {
      rqtoken: reqToken,
    });

    const response = await this.client.post('/api/shop/activity', reqData);
    return response.data;
  }

  async queryActivity(params: {
    searchKey: string;
    page?: string;
    count?: string;
    lon?: string;
    lat?: string;
    city?: string;
  }) {
    const reqData = {
      page: params.page || '1',
      count: params.count || '10',
      title: params.searchKey,
      lon: params.lon || '113.26679992675781',
      lat: params.lat || '23.129009246826172',
      city: params.city || '广州市',
    };

    const reqToken = genRqToken('/api/shop/activity', reqData);
    Object.assign(reqData, {
      rqtoken: reqToken,
    });

    const response = await this.client.post('/api/shop/activity', reqData);
    return response.data;
  }

  async getActivityDetail(activityId: string, params?: {
    lon?: string;
    lat?: string;
  }) {
    const reqData = {
      activitygoods_id: activityId,
      lon: params?.lon || '113.26679992675781',
      lat: params?.lat || '23.129009246826172',
    };

    const reqToken = genRqToken('/api/shop/activity_detail', reqData);
    Object.assign(reqData, {
      rqtoken: reqToken,
    });

    const response = await this.client.post('/api/shop/activity_detail', reqData);
    return response.data;
  }
}
