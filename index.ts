import axios from "axios";
import { genRqToken } from "./getToken";

const baseurl = 'https://ttt.bjlxkjyxgs.cn'
const headers = {
  "host": "ttt.bjlxkjyxgs.cn",
  "content-length": "169",
  "access-control-allow-origin": "*",
  "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36 MicroMessenger/7.0.20.1781(0x6700143B) NetType/WIFI MiniProgramEnv/Mac MacWechat/WMPF MacWechat/3.8.7(0x13080712) UnifiedPCMacWechat(0xf264151c) XWEB/17078",
  "xweb_xhr": "1",
  "content-type": "application/x-www-form-urlencoded",
  "accept": "*/*",
  "sec-fetch-site": "cross-site",
  "sec-fetch-mode": "cors",
  "sec-fetch-dest": "empty",
  "referer": "https://servicewechat.com/wx454addfc6819a2ac/119/page-frame.html",
  "accept-encoding": "gzip, br",
  "accept-language": "zh-CN,zh;q=0.9",
  "priority": "u=1, i"
}
const client = axios.create({
    baseURL: baseurl,
    headers,
    timeout: 10000,
});

const getActivityList = () => {
    const reqData = {
  "cate_id": "14",
  "cate2_id": "15",
  "area": "",
  "street": "",
  "page": "1",
  "count": "10",
  "lon": "113.26679992675781",
  "lat": "23.129009246826172",
  "city": "广州市",
}
    const reqToken = genRqToken("/api/shop/activity", reqData)
    Object.assign(reqData, {
        "rqtoken": reqToken
    })
    return client.post("/api/shop/activity", reqData)
}
getActivityList().then(res => console.log(res.data.data.data.map(item => item.title)))