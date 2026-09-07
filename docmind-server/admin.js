// ============================================================
// ADVANCED ADMIN MODULE – Full routes
// ============================================================
const express = require('express');
const router = express.Router();
const User = require('./models/User');
const Document = require('./models/Document');
const Chunk = require('./models/Chunk');
const Conversation = require('./models/Conversation');
const ActivityLog = require('./models/ActivityLog');
const Settings = require('./models/Settings');
const { protect } = require('./middleware/authMiddleware');

// ---------- Admin middleware ----------
const isAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    next();
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

router.use(protect, isAdmin);

// ---------- Helper: log activity ----------
const logActivity = async (userId, action, details, req) => {
  try {
    await ActivityLog.create({
      userId,
      action,
      details,
      ip: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
    });
  } catch (err) { console.error('Activity log error:', err); }
};

// ================================================================
// USER MANAGEMENT
// ================================================================

router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', sortBy = 'createdAt', order = -1, role, isActive } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const query = {};
    if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    const sort = { [sortBy]: parseInt(order) };
    const users = await User.find(query)
      .select('-password -__v -emailVerificationToken -resetPasswordToken')
      .skip(skip)
      .limit(parseInt(limit))
      .sort(sort);
    const total = await User.countDocuments(query);
    res.json({ success: true, users, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error('Admin users list error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
});

router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -__v -emailVerificationToken -resetPasswordToken');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const docCount = await Document.countDocuments({ userId: user._id });
    const convCount = await Conversation.countDocuments({ userId: user._id });
    const chunkCount = await Chunk.countDocuments({ userId: user._id });
    res.json({ success: true, user: { ...user.toObject(), docCount, convCount, chunkCount } });
  } catch (error) {
    console.error('Admin user detail error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user' });
  }
});

router.post('/users', async (req, res) => {
  try {
    const { name, email, password, role = 'user', isActive = true, isEmailVerified = false } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ success: false, message: 'Email already exists' });
    const user = new User({ name, email, password, role, isActive, isEmailVerified });
    await user.save();
    await logActivity(req.userId, 'admin_create_user', { targetUserId: user._id, email }, req);
    res.status(201).json({ success: true, user: user.getPublicProfile() });
  } catch (error) {
    console.error('Admin create user error:', error);
    res.status(500).json({ success: false, message: 'Failed to create user' });
  }
});

router.put('/users/:id', async (req, res) => {
  try {
    const { name, email, role, isActive, settings, password } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (req.params.id === req.userId && role === 'user') {
      return res.status(400).json({ success: false, message: 'You cannot demote yourself' });
    }
    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (typeof isActive === 'boolean') user.isActive = isActive;
    if (settings) user.settings = { ...user.settings, ...settings };
    if (password) user.password = password;
    await user.save();
    await logActivity(req.userId, 'admin_update_user', { targetUserId: user._id, updates: req.body }, req);
    res.json({ success: true, user: user.getPublicProfile() });
  } catch (error) {
    console.error('Admin update user error:', error);
    res.status(500).json({ success: false, message: 'Failed to update user' });
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    if (userId === req.userId) return res.status(400).json({ success: false, message: 'You cannot delete your own account' });
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    await Document.deleteMany({ userId });
    await Chunk.deleteMany({ userId });
    await Conversation.deleteMany({ userId });
    await ActivityLog.deleteMany({ userId });
    await User.findByIdAndDelete(userId);
    await logActivity(req.userId, 'admin_delete_user', { targetUserId: userId, email: user.email }, req);
    res.json({ success: true, message: 'User and all data deleted' });
  } catch (error) {
    console.error('Admin delete user error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete user' });
  }
});

router.delete('/users', async (req, res) => {
  try {
    const { userIds } = req.body;
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Provide an array of user IDs' });
    }
    if (userIds.includes(req.userId)) return res.status(400).json({ success: false, message: 'You cannot delete yourself' });
    const users = await User.find({ _id: { $in: userIds } });
    const emails = users.map(u => u.email);
    await Document.deleteMany({ userId: { $in: userIds } });
    await Chunk.deleteMany({ userId: { $in: userIds } });
    await Conversation.deleteMany({ userId: { $in: userIds } });
    await ActivityLog.deleteMany({ userId: { $in: userIds } });
    await User.deleteMany({ _id: { $in: userIds } });
    await logActivity(req.userId, 'admin_bulk_delete_users', { count: userIds.length, emails }, req);
    res.json({ success: true, message: `${userIds.length} users deleted` });
  } catch (error) {
    console.error('Admin bulk delete users error:', error);
    res.status(500).json({ success: false, message: 'Bulk delete failed' });
  }
});

// ================================================================
// DOCUMENT MANAGEMENT
// ================================================================

router.get('/documents', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search, userId, sortBy = 'createdAt', order = -1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const query = {};
    if (status) query.status = status;
    if (userId) query.userId = userId;
    if (search) query.$text = { $search: search };
    const sort = { [sortBy]: parseInt(order) };
    const docs = await Document.find(query)
      .populate('userId', 'name email')
      .skip(skip)
      .limit(parseInt(limit))
      .sort(sort);
    const total = await Document.countDocuments(query);
    res.json({ success: true, documents: docs, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error('Admin documents list error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch documents' });
  }
});

router.get('/documents/:id', async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id)
      .populate('userId', 'name email');
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });
    const chunks = await Chunk.find({ documentId: doc._id }).select('content pageNumber');
    res.json({ success: true, document: doc, chunks });
  } catch (error) {
    console.error('Admin document detail error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch document' });
  }
});

router.put('/documents/:id', async (req, res) => {
  try {
    const { title, tags, isFavorite, status } = req.body;
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });
    if (title) doc.title = title;
    if (tags) doc.tags = tags;
    if (isFavorite !== undefined) doc.isFavorite = isFavorite;
    if (status) doc.status = status;
    await doc.save();
    await logActivity(req.userId, 'admin_update_document', { documentId: doc._id, updates: req.body }, req);
    res.json({ success: true, document: doc });
  } catch (error) {
    console.error('Admin update document error:', error);
    res.status(500).json({ success: false, message: 'Failed to update document' });
  }
});

router.delete('/documents/:id', async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });
    await Chunk.deleteMany({ documentId: doc._id });
    await Document.findByIdAndDelete(doc._id);
    await logActivity(req.userId, 'admin_delete_document', { documentId: doc._id, title: doc.title }, req);
    res.json({ success: true, message: 'Document deleted' });
  } catch (error) {
    console.error('Admin delete document error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete document' });
  }
});

router.delete('/documents', async (req, res) => {
  try {
    const { documentIds } = req.body;
    if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Provide an array of document IDs' });
    }
    const docs = await Document.find({ _id: { $in: documentIds } });
    const titles = docs.map(d => d.title);
    await Chunk.deleteMany({ documentId: { $in: documentIds } });
    await Document.deleteMany({ _id: { $in: documentIds } });
    await logActivity(req.userId, 'admin_bulk_delete_documents', { count: documentIds.length, titles }, req);
    res.json({ success: true, message: `${documentIds.length} documents deleted` });
  } catch (error) {
    console.error('Admin bulk delete documents error:', error);
    res.status(500).json({ success: false, message: 'Bulk delete failed' });
  }
});

// ================================================================
// SYSTEM STATISTICS (Advanced)
// ================================================================

router.get('/stats', async (req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const [
      totalUsers,
      activeToday,
      totalDocuments,
      totalChunks,
      totalConversations,
      processingDocs,
      failedDocs,
      verifiedUsers,
      totalMessages,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ lastLogin: { $gte: todayStart } }),
      Document.countDocuments(),
      Chunk.countDocuments(),
      Conversation.countDocuments(),
      Document.countDocuments({ status: 'processing' }),
      Document.countDocuments({ status: 'failed' }),
      User.countDocuments({ isEmailVerified: true }),
      Conversation.aggregate([{ $unwind: '$messages' }, { $count: 'count' }]),
    ]);
    const topUsers = await Document.aggregate([
      { $group: { _id: '$userId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: { 'user.name': 1, 'user.email': 1, count: 1 } },
    ]);
    const storageUsed = await Document.aggregate([
      { $group: { _id: null, total: { $sum: '$fileSize' } } },
    ]);
    const activities = await ActivityLog.aggregate([
      { $match: { timestamp: { $gte: weekAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
    res.json({
      success: true,
      stats: {
        totalUsers,
        activeToday,
        verifiedUsers,
        totalDocuments,
        totalChunks,
        totalConversations,
        totalMessages: totalMessages[0]?.count || 0,
        processingDocs,
        failedDocs,
        storageUsed: storageUsed[0]?.total || 0,
        topUsers,
        last7DaysActivity: activities,
      },
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
});

// ================================================================
// ACTIVITY LOGS
// ================================================================

router.get('/logs', async (req, res) => {
  try {
    const { page = 1, limit = 50, userId, action, startDate, endDate } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const query = {};
    if (userId) query.userId = userId;
    if (action) query.action = action;
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }
    const logs = await ActivityLog.find(query)
      .populate('userId', 'name email')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    const total = await ActivityLog.countDocuments(query);
    res.json({
      success: true,
      logs,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Admin logs error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch logs' });
  }
});

// ================================================================
// SYSTEM SETTINGS
// ================================================================

router.get('/settings', async (req, res) => {
  try {
    const settings = await Settings.find();
    res.json({ success: true, settings });
  } catch (error) {
    console.error('Admin settings error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch settings' });
  }
});

router.put('/settings/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { value, description } = req.body;
    let setting = await Settings.findOne({ key });
    if (!setting) {
      setting = new Settings({ key, value, description, updatedBy: req.userId });
    } else {
      setting.value = value;
      if (description) setting.description = description;
      setting.updatedBy = req.userId;
      setting.updatedAt = new Date();
    }
    await setting.save();
    await logActivity(req.userId, 'admin_update_setting', { key, value }, req);
    res.json({ success: true, setting });
  } catch (error) {
    console.error('Admin update setting error:', error);
    res.status(500).json({ success: false, message: 'Failed to update setting' });
  }
});

// ================================================================
// EXPORT FUNCTIONALITY
// ================================================================

router.get('/export/users', async (req, res) => {
  try {
    const users = await User.find().select('name email role isActive isEmailVerified createdAt lastLogin');
    let csv = 'Name,Email,Role,Active,Verified,Created,LastLogin\n';
    users.forEach(u => {
      csv += `"${u.name}","${u.email}","${u.role}","${u.isActive}","${u.isEmailVerified}","${u.createdAt}","${u.lastLogin || ''}"\n`;
    });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=users_export.csv');
    res.send(csv);
  } catch (error) {
    console.error('Export users error:', error);
    res.status(500).json({ success: false, message: 'Export failed' });
  }
});

router.get('/export/documents', async (req, res) => {
  try {
    const docs = await Document.find().populate('userId', 'email');
    let csv = 'Title,User Email,Pages,Status,Size (KB),Created\n';
    docs.forEach(d => {
      csv += `"${d.title}","${d.userId?.email || ''}","${d.pageCount}","${d.status}","${d.fileSizeKB}","${d.createdAt}"\n`;
    });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=documents_export.csv');
    res.send(csv);
  } catch (error) {
    console.error('Export documents error:', error);
    res.status(500).json({ success: false, message: 'Export failed' });
  }
});

module.exports = {
  router,
  isAdmin,
};
