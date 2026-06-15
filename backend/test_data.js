const http = require('http');

function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : null;
    const options = {
      hostname: 'localhost',
      port: 3002,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };
    if (token) {
      options.headers['Authorization'] = 'Bearer ' + token;
    }
    if (postData) {
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve(body);
        }
      });
    });
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function main() {
  const adminLogin = await makeRequest('POST', '/api/login', {
    username: 'admin',
    password: 'admin123'
  });
  console.log('管理员登录:', adminLogin.user ? '成功' : '失败');
  const adminToken = adminLogin.token;

  await makeRequest('POST', '/api/register', {
    username: 'user1',
    password: '123456',
    nickname: '小明'
  }).catch(() => {});
  
  const user1Login = await makeRequest('POST', '/api/login', {
    username: 'user1',
    password: '123456'
  });
  console.log('用户1登录:', user1Login.user ? '成功' : '失败');
  const user1Token = user1Login.token;

  await makeRequest('POST', '/api/register', {
    username: 'user2',
    password: '123456',
    nickname: '小红'
  }).catch(() => {});
  
  const user2Login = await makeRequest('POST', '/api/login', {
    username: 'user2',
    password: '123456'
  });
  console.log('用户2登录:', user2Login.user ? '成功' : '失败');
  const user2Token = user2Login.token;

  const sampleImages = [
    '/uploads/sample1.jpg',
    '/uploads/sample2.jpg',
    '/uploads/sample3.jpg'
  ];

  const c1 = await makeRequest('POST', '/api/clothes', {
    title: '优衣库白色纯棉T恤 M码',
    description: '九成新，只穿过两次，纯棉面料很舒服，百搭款',
    brand: '优衣库',
    category: '上衣',
    size: 'M',
    condition: '九成新',
    wanted_types: '想换L码卫衣或者牛仔外套',
    images: sampleImages
  }, user1Token);
  console.log('用户1发布衣物1:', c1.id ? '成功 id:' + c1.id : c1.error || '失败');

  const c2 = await makeRequest('POST', '/api/clothes', {
    title: '李维斯蓝色牛仔裤 30码',
    description: '八成新，经典款直筒牛仔裤，版型很好，略有穿着痕迹',
    brand: 'Levis',
    category: '裤子',
    size: '30',
    condition: '八成新',
    wanted_types: '想换休闲裤或者短裤',
    images: sampleImages
  }, user1Token);
  console.log('用户1发布衣物2:', c2.id ? '成功 id:' + c2.id : c2.error || '失败');

  const c3 = await makeRequest('POST', '/api/clothes', {
    title: 'ZARA黑色连衣裙 S码',
    description: '全新吊牌还在，收腰版型很显身材，适合约会穿',
    brand: 'ZARA',
    category: '裙子',
    size: 'S',
    condition: '全新',
    wanted_types: '想换半身裙或者上衣',
    images: sampleImages
  }, user2Token);
  console.log('用户2发布衣物1:', c3.id ? '成功 id:' + c3.id : c3.error || '失败');

  const c4 = await makeRequest('POST', '/api/clothes', {
    title: '复古棕色皮夹克 L码',
    description: '七成新，真皮材质，复古风必备，有岁月的质感',
    brand: '定制',
    category: '外套',
    size: 'L',
    condition: '七成新',
    wanted_types: '想换风衣或者西装外套',
    images: sampleImages
  }, user2Token);
  console.log('用户2发布衣物2:', c4.id ? '成功 id:' + c4.id : c4.error || '失败');

  const c5 = await makeRequest('POST', '/api/clothes', {
    title: 'Nike白色运动鞋 42码',
    description: '八成新，穿着舒适，百搭款，适合日常穿搭',
    brand: 'Nike',
    category: '鞋子',
    size: '42',
    condition: '八成新',
    wanted_types: '想换跑鞋或者板鞋',
    images: sampleImages
  }, user2Token);
  console.log('用户2发布衣物3:', c5.id ? '成功 id:' + c5.id : c5.error || '失败');

  const pending = await makeRequest('GET', '/api/admin/clothes?status=pending&limit=50', null, adminToken);
  console.log('待审核衣物数量:', pending.list ? pending.list.length : 0);
  
  if (pending.list) {
    for (const item of pending.list) {
      await makeRequest('POST', `/api/admin/clothes/${item.id}/approve`, null, adminToken);
    }
    console.log('已审核通过所有衣物');
  }

  const clothesList = await makeRequest('GET', '/api/clothes?limit=20');
  console.log('首页已上架衣物数量:', clothesList.total);
  
  console.log('\n=== 测试数据创建完成 ===');
  console.log('管理员账号: admin / admin123');
  console.log('测试用户1: user1 / 123456 (小明)');
  console.log('测试用户2: user2 / 123456 (小红)');
}

main().catch(console.error);
