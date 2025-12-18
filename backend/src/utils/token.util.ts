import md5 from 'md5';

const SECRET_CHAR_CODES = [126, 142, 106, 131, 148, 196, 180, 154, 168, 252, 278, 284, 310, 241, 259, 334, 294, 309, 414, 430];

function buildSecret(): string {
  const chars = SECRET_CHAR_CODES.map((code, index) => String.fromCharCode(code - 16 * index));
  return chars.join('');
}

const paramSign = (path: string, params: Record<string, any>): string => {
  const keys = Object.keys(params).sort();
  const canonical = keys.map((k) => `${k}=${params[k]}`).join('&');
  const now = new Date();
  const month = now.getMonth() + 1;
  const mm = month > 9 ? String(month) : '0' + month;
  const dd = now.getDate() > 9 ? String(now.getDate()) : '0' + now.getDate();
  const dateStr = `${now.getFullYear()}${mm}${dd}`;
  const payload = [buildSecret(), '#', path, '-', canonical, '~', dateStr].join('');
  return md5(payload);
};

const getRTP = (url: string, data: Record<string, any>) => {
  const out = { ...data };
  switch (url) {
    case '/api/shop/activity':
      return { p: out.page, c: out.city === undefined ? 'bj' : out.city };
    case '/api/user/thirds':
      return { code: out.code };
    default:
      return out;
  }
};

export const genRqToken = (url: string, data: Record<string, any>) => {
  return paramSign(url, getRTP(url, data));
};
