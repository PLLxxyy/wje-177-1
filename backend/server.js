const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { db, initDatabase } = require('./database');

const app = express();
const PORT = 3002;
const JWT_SECRET = 'clothes_swap_secret_key';

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage, limits: { fileSize: 10 * 1024 * 1024 } });

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: '未授权' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (e) {
    res.status(401).json({ error: '无效的token' });
  }
}

function adminMiddleware(req, res, next) {
  authMiddleware(req, res, () => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: '需要管理员权限' });
    next();
  });
}

app.post('/api/upload', upload.array('images', 9), (req, res) => {
  const files = req.files.map(f => '/uploads/' + f.filename);
  res.json({ urls: files });
});

app.post('/api/register', (req, res) => {
  const { username, password, nickname } = req.body;
  if (!username || !password) return res.status(400).json({ error: '用户名和密码不能为空' });
  try {
    const hashedPassword = bcrypt.hashSync(password, 10);
    const stmt = db.prepare('INSERT INTO users (username, password, nickname) VALUES (?, ?, ?)');
    const result = stmt.run(username, hashedPassword, nickname || username);
    const token = jwt.sign({ id: result.lastInsertRowid, username, role: 'user' }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: result.lastInsertRowid, username, nickname: nickname || username, role: 'user' } });
  } catch (e) {
    res.status(400).json({ error: '用户名已存在' });
  }
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }
  const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, username: user.username, nickname: user.nickname, avatar: user.avatar, role: user.role } });
});

app.get('/api/user/profile', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT id, username, nickname, avatar, bio, role FROM users WHERE id = ?').get(req.user.id);
  res.json(user);
});

app.put('/api/user/profile', authMiddleware, (req, res) => {
  const { nickname, avatar, bio } = req.body;
  db.prepare('UPDATE users SET nickname = ?, avatar = ?, bio = ? WHERE id = ?').run(nickname, avatar, bio, req.user.id);
  res.json({ success: true });
});

app.get('/api/clothes', (req, res) => {
  const { category, size, brand, keyword, page = 1, limit = 20, user_id, status } = req.query;
  let sql = 'SELECT c.*, u.nickname as seller_nickname, u.avatar as seller_avatar FROM clothes c LEFT JOIN users u ON c.user_id = u.id WHERE 1=1';
  const params = [];
  
  if (status) { sql += ' AND c.status = ?'; params.push(status); }
  else { sql += ' AND c.status = ?'; params.push('approved'); }
  
  if (category) { sql += ' AND c.category = ?'; params.push(category); }
  if (size) { sql += ' AND c.size = ?'; params.push(size); }
  if (brand) { sql += ' AND c.brand LIKE ?'; params.push('%' + brand + '%'); }
  if (keyword) { sql += ' AND (c.title LIKE ? OR c.description LIKE ? OR c.brand LIKE ?'; params.push('%' + keyword + '%', '%' + keyword + '%', '%' + keyword + '%'); }
  if (user_id) { sql += ' AND c.user_id = ?'; params.push(user_id); }
  
  sql += ' ORDER BY c.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));
  
  const clothes = db.prepare(sql).all(...params);
  clothes.forEach(item => {
    if (item.images) item.images = JSON.parse(item.images);
  });
  
  let countSql = 'SELECT COUNT(*) as total FROM clothes c WHERE 1=1';
  const countParams = [];
  if (status) { countSql += ' AND c.status = ?'; countParams.push(status); }
  else { countSql += ' AND c.status = ?'; countParams.push('approved'); }
  if (category) { countSql += ' AND c.category = ?'; countParams.push(category); }
  if (size) { countSql += ' AND c.size = ?'; countParams.push(size); }
  if (brand) { countSql += ' AND c.brand LIKE ?'; countParams.push('%' + brand + '%'); }
  if (keyword) { countSql += ' AND (c.title LIKE ? OR c.description LIKE ? OR c.brand LIKE ?)'; countParams.push('%' + keyword + '%', '%' + keyword + '%', '%' + keyword + '%'); }
  if (user_id) { countSql += ' AND c.user_id = ?'; countParams.push(user_id); }
  
  const { total } = db.prepare(countSql).get(...countParams);
  
  res.json({ list: clothes, total, page: parseInt(page), limit: parseInt(limit) });
});

app.get('/api/clothes/:id', (req, res) => {
  const clothes = db.prepare(`
    SELECT c.*, u.nickname as seller_nickname, u.avatar as seller_avatar, u.bio as seller_bio
    FROM clothes c LEFT JOIN users u ON c.user_id = u.id
    WHERE c.id = ?
  `).get(req.params.id);
  if (!clothes) return res.status(404).json({ error: '衣物不存在' });
  if (clothes.images) clothes.images = JSON.parse(clothes.images);
  res.json(clothes);
});

app.post('/api/clothes', authMiddleware, (req, res) => {
  const { title, description, brand, category, size, condition, wanted_types, images } = req.body;
  if (!title || !category || !size || !condition) {
    return res.status(400).json({ error: '请填写必要信息' });
  }
  const stmt = db.prepare(`
    INSERT INTO clothes (user_id, title, description, brand, category, size, condition, wanted_types, images, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    req.user.id, title, description || '', brand || '',
    category, size, condition, wanted_types || '',
    JSON.stringify(images || []), 'pending'
  );
  res.json({ id: result.lastInsertRowid, message: '发布成功，等待审核' });
});

app.put('/api/clothes/:id', authMiddleware, (req, res) => {
  const { title, description, brand, category, size, condition, wanted_types, images } = req.body;
  const clothes = db.prepare('SELECT * FROM clothes WHERE id = ?').get(req.params.id);
  if (!clothes) return res.status(404).json({ error: '衣物不存在' });
  if (clothes.user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: '无权限修改' });
  }
  db.prepare(`
    UPDATE clothes SET title = ?, description = ?, brand = ?, category = ?, size = ?,
    condition = ?, wanted_types = ?, images = ? WHERE id = ?
  `).run(title, description, brand, category, size, condition, wanted_types, JSON.stringify(images || []), req.params.id);
  res.json({ success: true });
});

app.delete('/api/clothes/:id', authMiddleware, (req, res) => {
  const clothes = db.prepare('SELECT * FROM clothes WHERE id = ?').get(req.params.id);
  if (!clothes) return res.status(404).json({ error: '衣物不存在' });
  if (clothes.user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: '无权限删除' });
  }
  db.prepare('DELETE FROM clothes WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

app.post('/api/swap-requests', authMiddleware, (req, res) => {
  const { target_clothes_id, offered_clothes_id, message } = req.body;
  const targetClothes = db.prepare('SELECT * FROM clothes WHERE id = ?').get(target_clothes_id);
  const offeredClothes = db.prepare('SELECT * FROM clothes WHERE id = ?').get(offered_clothes_id);
  
  if (!targetClothes || !offeredClothes) return res.status(404).json({ error: '衣物不存在' });
  if (offeredClothes.user_id !== req.user.id) return res.status(403).json({ error: '只能用自己的衣物交换' });
  if (targetClothes.user_id === req.user.id) return res.status(400).json({ error: '不能和自己交换' });
  
  const existing = db.prepare(`
    SELECT * FROM swap_requests WHERE from_user_id = ? AND target_clothes_id = ? AND status = 'pending'
  `).get(req.user.id, target_clothes_id);
  if (existing) return res.status(400).json({ error: '已发送过申请了' });
  
  const stmt = db.prepare(`
    INSERT INTO swap_requests (from_user_id, to_user_id, target_clothes_id, offered_clothes_id, message)
    VALUES (?, ?, ?, ?, ?)
  `);
  const result = stmt.run(req.user.id, targetClothes.user_id, target_clothes_id, offered_clothes_id, message || '');
  res.json({ id: result.lastInsertRowid });
});

app.get('/api/swap-requests/received', authMiddleware, (req, res) => {
  const requests = db.prepare(`
    SELECT sr.*, 
      tc.title as target_title, tc.images as target_images,
      oc.title as offered_title, oc.images as offered_images,
      u.nickname as from_nickname, u.avatar as from_avatar
    FROM swap_requests sr
    LEFT JOIN clothes tc ON sr.target_clothes_id = tc.id
    LEFT JOIN clothes oc ON sr.offered_clothes_id = oc.id
    LEFT JOIN users u ON sr.from_user_id = u.id
    WHERE sr.to_user_id = ?
    ORDER BY sr.created_at DESC
  `).all(req.user.id);
  requests.forEach(r => {
    if (r.target_images) r.target_images = JSON.parse(r.target_images);
    if (r.offered_images) r.offered_images = JSON.parse(r.offered_images);
  });
  res.json(requests);
});

app.get('/api/swap-requests/sent', authMiddleware, (req, res) => {
  const requests = db.prepare(`
    SELECT sr.*, 
      tc.title as target_title, tc.images as target_images,
      oc.title as offered_title, oc.images as offered_images,
      u.nickname as to_nickname, u.avatar as to_avatar
    FROM swap_requests sr
    LEFT JOIN clothes tc ON sr.target_clothes_id = tc.id
    LEFT JOIN clothes oc ON sr.offered_clothes_id = oc.id
    LEFT JOIN users u ON sr.to_user_id = u.id
    WHERE sr.from_user_id = ?
    ORDER BY sr.created_at DESC
  `).all(req.user.id);
  requests.forEach(r => {
    if (r.target_images) r.target_images = JSON.parse(r.target_images);
    if (r.offered_images) r.offered_images = JSON.parse(r.offered_images);
  });
  res.json(requests);
});

app.post('/api/swap-requests/:id/accept', authMiddleware, (req, res) => {
  const request = db.prepare('SELECT * FROM swap_requests WHERE id = ?').get(req.params.id);
  if (!request) return res.status(404).json({ error: '申请不存在' });
  if (request.to_user_id !== req.user.id) return res.status(403).json({ error: '无权限操作' });
  if (request.status !== 'pending') return res.status(400).json({ error: '申请已处理' });
  
  db.prepare('UPDATE swap_requests SET status = ? WHERE id = ?').run('accepted', req.params.id);
  db.prepare(`
    INSERT INTO swap_completions (swap_request_id, user1_confirmed, user2_confirmed)
    VALUES (?, 0, 0)
  `).run(req.params.id);
  
  res.json({ success: true });
});

app.post('/api/swap-requests/:id/reject', authMiddleware, (req, res) => {
  const request = db.prepare('SELECT * FROM swap_requests WHERE id = ?').get(req.params.id);
  if (!request) return res.status(404).json({ error: '申请不存在' });
  if (request.to_user_id !== req.user.id) return res.status(403).json({ error: '无权限操作' });
  if (request.status !== 'pending') return res.status(400).json({ error: '申请已处理' });
  
  db.prepare('UPDATE swap_requests SET status = ? WHERE id = ?').run('rejected', req.params.id);
  res.json({ success: true });
});

app.post('/api/swap-requests/:id/confirm', authMiddleware, (req, res) => {
  const request = db.prepare('SELECT * FROM swap_requests WHERE id = ?').get(req.params.id);
  if (!request) return res.status(404).json({ error: '申请不存在' });
  if (request.status !== 'accepted') return res.status(400).json({ error: '申请未通过' });
  
  const completion = db.prepare('SELECT * FROM swap_completions WHERE swap_request_id = ?').get(req.params.id);
  if (!completion) return res.status(404).json({ error: '交换记录不存在' });
  
  const isFromUser = request.from_user_id === req.user.id;
  const isToUser = request.to_user_id === req.user.id;
  
  if (!isFromUser && !isToUser) return res.status(403).json({ error: '无权限操作' });
  
  if (isFromUser) {
    db.prepare('UPDATE swap_completions SET user1_confirmed = 1 WHERE swap_request_id = ?').run(req.params.id);
  } else {
    db.prepare('UPDATE swap_completions SET user2_confirmed = 1 WHERE swap_request_id = ?').run(req.params.id);
  }
  
  const updated = db.prepare('SELECT * FROM swap_completions WHERE swap_request_id = ?').get(req.params.id);
  if (updated.user1_confirmed && updated.user2_confirmed) {
    db.prepare('UPDATE swap_requests SET status = ? WHERE id = ?').run('completed', req.params.id);
    db.prepare('UPDATE swap_completions SET completed_at = CURRENT_TIMESTAMP WHERE swap_request_id = ?').run(req.params.id);
  }
  
  res.json({ success: true, completed: updated.user1_confirmed && updated.user2_confirmed });
});

app.get('/api/swap-records', authMiddleware, (req, res) => {
  const records = db.prepare(`
    SELECT sr.*, sc.completed_at,
      tc.title as target_title, tc.images as target_images,
      oc.title as offered_title, oc.images as offered_images,
      fu.nickname as from_nickname, tu.nickname as to_nickname
    FROM swap_requests sr
    LEFT JOIN swap_completions sc ON sr.id = sc.swap_request_id
    LEFT JOIN clothes tc ON sr.target_clothes_id = tc.id
    LEFT JOIN clothes oc ON sr.offered_clothes_id = oc.id
    LEFT JOIN users fu ON sr.from_user_id = fu.id
    LEFT JOIN users tu ON sr.to_user_id = tu.id
    WHERE sr.status IN ('accepted', 'completed')
    AND (sr.from_user_id = ? OR sr.to_user_id = ?)
    ORDER BY sr.created_at DESC
  `).all(req.user.id, req.user.id);
  records.forEach(r => {
    if (r.target_images) r.target_images = JSON.parse(r.target_images);
    if (r.offered_images) r.offered_images = JSON.parse(r.offered_images);
  });
  res.json(records);
});

app.post('/api/reviews', authMiddleware, (req, res) => {
  const { swap_request_id, rating, content } = req.body;
  const request = db.prepare('SELECT * FROM swap_requests WHERE id = ?').get(swap_request_id);
  if (!request) return res.status(404).json({ error: '申请不存在' });
  if (request.status !== 'completed') return res.status(400).json({ error: '交换未完成' });
  
  const revieweeId = request.from_user_id === req.user.id ? request.to_user_id : request.from_user_id;
  
  const existing = db.prepare('SELECT * FROM reviews WHERE swap_request_id = ? AND reviewer_id = ?').get(swap_request_id, req.user.id);
  if (existing) return res.status(400).json({ error: '已评价过' });
  
  db.prepare('INSERT INTO reviews (swap_request_id, reviewer_id, reviewee_id, rating, content) VALUES (?, ?, ?, ?, ?)')
    .run(swap_request_id, req.user.id, revieweeId, rating, content || '');
  
  res.json({ success: true });
});

app.get('/api/users/:id/reviews', (req, res) => {
  const reviews = db.prepare(`
    SELECT r.*, u.nickname as reviewer_nickname, u.avatar as reviewer_avatar
    FROM reviews r LEFT JOIN users u ON r.reviewer_id = u.id
    WHERE r.reviewee_id = ?
    ORDER BY r.created_at DESC
  `).all(req.params.id);
  res.json(reviews);
});

app.get('/api/wishlist', authMiddleware, (req, res) => {
  const wishlist = db.prepare('SELECT * FROM wishlist WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
  res.json(wishlist);
});

app.post('/api/wishlist', authMiddleware, (req, res) => {
  const { category, brand, size, keyword } = req.body;
  const stmt = db.prepare('INSERT INTO wishlist (user_id, category, brand, size, keyword) VALUES (?, ?, ?, ?, ?)');
  const result = stmt.run(req.user.id, category || '', brand || '', size || '', keyword || '');
  res.json({ id: result.lastInsertRowid });
});

app.delete('/api/wishlist/:id', authMiddleware, (req, res) => {
  const item = db.prepare('SELECT * FROM wishlist WHERE id = ?').get(req.params.id);
  if (!item) return res.status(404).json({ error: '心愿单项目不存在' });
  if (item.user_id !== req.user.id) return res.status(403).json({ error: '无权限删除' });
  db.prepare('DELETE FROM wishlist WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

app.get('/api/wishlist/matches', authMiddleware, (req, res) => {
  const wishlist = db.prepare('SELECT * FROM wishlist WHERE user_id = ?').all(req.user.id);
  if (wishlist.length === 0) return res.json([]);
  
  let matches = [];
  wishlist.forEach(wish => {
    let sql = `SELECT c.*, u.nickname as seller_nickname FROM clothes c 
               LEFT JOIN users u ON c.user_id = u.id 
               WHERE c.status = 'approved' AND c.user_id != ?`;
    let params = [req.user.id];
    
    if (wish.category) { sql += ' AND c.category = ?'; params.push(wish.category); }
    if (wish.brand) { sql += ' AND c.brand LIKE ?'; params.push('%' + wish.brand + '%'); }
    if (wish.size) { sql += ' AND c.size = ?'; params.push(wish.size); }
    if (wish.keyword) { sql += ' AND (c.title LIKE ? OR c.description LIKE ?)'; params.push('%' + wish.keyword + '%', '%' + wish.keyword + '%'); }
    
    sql += ' ORDER BY c.created_at DESC LIMIT 5';
    const items = db.prepare(sql).all(...params);
    items.forEach(item => {
      if (item.images) item.images = JSON.parse(item.images);
      item.wish_id = wish.id;
      matches.push(item);
    });
  });
  
  const unique = [...new Map(matches.map(m => m.id)).values()];
  res.json(unique.slice(0, 10));
});

app.get('/api/admin/clothes', adminMiddleware, (req, res) => {
  const { status = 'pending', page = 1, limit = 20 } = req.query;
  const clothes = db.prepare(`
    SELECT c.*, u.nickname as seller_nickname FROM clothes c
    LEFT JOIN users u ON c.user_id = u.id
    WHERE c.status = ?
    ORDER BY c.created_at DESC LIMIT ? OFFSET ?
  `).all(status, parseInt(limit), (parseInt(page) - 1) * parseInt(limit));
  clothes.forEach(item => {
    if (item.images) item.images = JSON.parse(item.images);
  });
  
  const { total } = db.prepare('SELECT COUNT(*) as total FROM clothes WHERE status = ?').get(status);
  res.json({ list: clothes, total });
});

app.post('/api/admin/clothes/:id/approve', adminMiddleware, (req, res) => {
  db.prepare('UPDATE clothes SET status = ? WHERE id = ?').run('approved', req.params.id);
  res.json({ success: true });
});

app.post('/api/admin/clothes/:id/reject', adminMiddleware, (req, res) => {
  db.prepare('UPDATE clothes SET status = ? WHERE id = ?').run('rejected', req.params.id);
  res.json({ success: true });
});

app.get('/api/admin/stats', adminMiddleware, (req, res) => {
  const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ?').get('user').count;
  const totalClothes = db.prepare('SELECT COUNT(*) as count FROM clothes WHERE status = ?').get('approved').count;
  const totalSwaps = db.prepare('SELECT COUNT(*) as count FROM swap_requests WHERE status = ?').get('completed').count;
  const pendingClothes = db.prepare('SELECT COUNT(*) as count FROM clothes WHERE status = ?').get('pending').count;
  
  const categoryStats = db.prepare(`
    SELECT category, COUNT(*) as count FROM clothes 
    WHERE status = 'approved'
    GROUP BY category ORDER BY count DESC LIMIT 10
  `).all();
  
  const brandStats = db.prepare(`
    SELECT brand, COUNT(*) as count FROM clothes 
    WHERE status = 'approved' AND brand != ''
    GROUP BY brand ORDER BY count DESC LIMIT 10
  `).all();
  
  const dailySwaps = db.prepare(`
    SELECT DATE(completed_at) as date, COUNT(*) as count
    FROM swap_completions WHERE completed_at IS NOT NULL
    GROUP BY DATE(completed_at)
    ORDER BY date DESC LIMIT 30
  `).all();
  
  res.json({
    totalUsers,
    totalClothes,
    totalSwaps,
    pendingClothes,
    categoryStats,
    brandStats,
    dailySwaps
  });
});

app.get('/api/categories', (req, res) => {
  res.json([
    { value: '上衣', label: '上衣' },
    { value: '裤子', label: '裤子' },
    { value: '裙子', label: '裙子' },
    { value: '外套', label: '外套' },
    { value: '鞋子', label: '鞋子' },
    { value: '配饰', label: '配饰' },
    { value: '其他', label: '其他' }
  ]);
});

app.get('/api/sizes', (req, res) => {
  res.json(['XS', 'S', 'M', 'L', 'XL', 'XXL', '均码', '26', '27', '28', '29', '30', '31', '32', '33', '34', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44']);
});

app.get('/api/conditions', (req, res) => {
  res.json([
    { value: '全新', label: '全新' },
    { value: '九成新', label: '九成新' },
    { value: '八成新', label: '八成新' },
    { value: '七成新', label: '七成新' },
    { value: '六成新及以下', label: '六成新及以下' }
  ]);
});

initDatabase();

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
