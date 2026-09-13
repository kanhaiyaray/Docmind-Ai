// docmind-server/admin.js
const express = require('express');
const router = express.Router();
const os = require('os');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');

const User = require('./models/User');
const Document = require('./models/Document');
const Chunk = require('./models/Chunk');
const Conversation = require('./models/Conversation');
const ActivityLog = require('./models/ActivityLog');
const Settings = require('./models/Settings');
const RefreshToken = require('./models/RefreshToken');

const { protect } = require('./middleware/authMiddleware');
const { toCSV, sendCSV } = require('./lib/csv');
const { processDocument } = require('./controllers/documentController');
const { Resend } = require('resend');

const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
};

router.use(protect, isAdmin);

const logActivity = async (userId, action, details, req) => {
  try {
    await ActivityLog.create({
      userId,
      action,
      details,
      ip: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
    });
  } catch (err) {
    console.error('Activity log error:', err);
  }
};

// ============================================================
// USERS
// ============================================================

router.get('/users', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      sortBy = 'createdAt',
      order = -1,
      role,
      isActive,
      isEmailVerified,
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const query = {};
    if (search)
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    if (role) query.role = role;
    if (isActive !== undefined && isActive !== '') query.isActive = isActive === 'true';
    if (isEmailVerified !== undefined && isEmailVerified !== '')
      query.isEmailVerified = isEmailVerified === 'true';

    const sort = { [sortBy]: parseInt(order) };

    const users = await User.find(query)
      .select('-password -__v -emailVerificationToken -resetPasswordToken')
      .skip(skip)
      .limit(parseInt(limit))
      .sort(sort);

    const userIds = users.map((u) => u._id);
    const [docCounts, convCounts] = await Promise.all([
      Document.aggregate([
        { $match: { userId: { $in: userIds } } },
        { $group: { _id: '$userId', count: { $sum: 1 } } },
      ]),
      Conversation.aggregate([
        { $match: { userId: { $in: userIds } } },
        { $group: { _id: '$userId', count: { $sum: 1 } } },
      ]),
    ]);
    const docMap = Object.fromEntries(docCounts.map((d) => [String(d._id), d.count]));
    const convMap = Object.fromEntries(convCounts.map((d) => [String(d._id), d.count]));

    const enriched = users.map((u) => ({
      ...u.toObject(),
      docCount: docMap[String(u._id)] || 0,
      convCount: convMap[String(u._id)] || 0,
    }));

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      users: enriched,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Admin users list error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
});

router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      '-password -__v -emailVerificationToken -resetPasswordToken'
    );
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const [docCount, convCount, chunkCount, sessionCount, recentDocs, recentConvs] =
      await Promise.all([
        Document.countDocuments({ userId: user._id }),
        Conversation.countDocuments({ userId: user._id }),
        Chunk.countDocuments({ userId: user._id }),
        RefreshToken.countDocuments({ userId: user._id, isRevoked: false, expiresAt: { $gt: new Date() } }),
        Document.find({ userId: user._id }).select('title status pageCount fileSize createdAt').sort({ createdAt: -1 }).limit(5),
        Conversation.find({ userId: user._id }).select('title documentId messages updatedAt').sort({ updatedAt: -1 }).limit(5).populate('documentId', 'title'),
      ]);

    const storageAgg = await Document.aggregate([
      { $match: { userId: user._id } },
      { $group: { _id: null, total: { $sum: '$fileSize' } } },
    ]);

    res.json({
      success: true,
      user: {
        ...user.toObject(),
        docCount, convCount, chunkCount, sessionCount,
        storageUsed: storageAgg[0]?.total || 0,
        recentDocs, recentConvs,
      },
    });
  } catch (error) {
    console.error('Admin user detail error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user' });
  }
});

router.get('/users/:id/activity', async (req, res) => {
  try {
    const { limit = 50, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [logs, total] = await Promise.all([
      ActivityLog.find({ userId: req.params.id }).sort({ timestamp: -1 }).skip(skip).limit(parseInt(limit)),
      ActivityLog.countDocuments({ userId: req.params.id }),
    ]);
    res.json({ success: true, logs, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error('Admin user activity error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch activity' });
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
    const { name, email, role, isActive, settings, password, isEmailVerified } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (req.params.id === req.userId && role === 'user') return res.status(400).json({ success: false, message: 'You cannot demote yourself' });
    if (req.params.id === req.userId && isActive === false) return res.status(400).json({ success: false, message: 'You cannot deactivate your own account' });
    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (typeof isActive === 'boolean') user.isActive = isActive;
    if (typeof isEmailVerified === 'boolean') user.isEmailVerified = isEmailVerified;
    if (settings) user.settings = { ...user.settings, ...settings };
    if (password) user.password = password;
    await user.save();
    await logActivity(req.userId, 'admin_update_user', { targetUserId: user._id, updates: { ...req.body, password: password ? '***' : undefined } }, req);
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
    await Promise.all([
      Document.deleteMany({ userId }),
      Chunk.deleteMany({ userId }),
      Conversation.deleteMany({ userId }),
      ActivityLog.deleteMany({ userId }),
      RefreshToken.deleteMany({ userId }),
    ]);
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
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) return res.status(400).json({ success: false, message: 'Provide an array of user IDs' });
    if (userIds.includes(req.userId)) return res.status(400).json({ success: false, message: 'You cannot delete yourself' });
    const users = await User.find({ _id: { $in: userIds } });
    const emails = users.map((u) => u.email);
    await Promise.all([
      Document.deleteMany({ userId: { $in: userIds } }),
      Chunk.deleteMany({ userId: { $in: userIds } }),
      Conversation.deleteMany({ userId: { $in: userIds } }),
      ActivityLog.deleteMany({ userId: { $in: userIds } }),
      RefreshToken.deleteMany({ userId: { $in: userIds } }),
      User.deleteMany({ _id: { $in: userIds } }),
    ]);
    await logActivity(req.userId, 'admin_bulk_delete_users', { count: userIds.length, emails }, req);
    res.json({ success: true, message: `${userIds.length} users deleted` });
  } catch (error) {
    console.error('Admin bulk delete users error:', error);
    res.status(500).json({ success: false, message: 'Bulk delete failed' });
  }
});

router.post('/users/bulk-role', async (req, res) => {
  try {
    const { userIds, role } = req.body;
    if (!Array.isArray(userIds) || userIds.length === 0) return res.status(400).json({ success: false, message: 'userIds required' });
    if (!['user', 'admin'].includes(role)) return res.status(400).json({ success: false, message: 'Invalid role' });
    if (userIds.includes(req.userId) && role === 'user') return res.status(400).json({ success: false, message: 'You cannot demote yourself' });
    const result = await User.updateMany({ _id: { $in: userIds } }, { role });
    await logActivity(req.userId, 'admin_bulk_role_change', { count: result.modifiedCount, role }, req);
    res.json({ success: true, modified: result.modifiedCount, role });
  } catch (error) {
    console.error('Admin bulk role error:', error);
    res.status(500).json({ success: false, message: 'Bulk role change failed' });
  }
});

router.post('/users/bulk-status', async (req, res) => {
  try {
    const { userIds, isActive } = req.body;
    if (!Array.isArray(userIds) || userIds.length === 0) return res.status(400).json({ success: false, message: 'userIds required' });
    if (typeof isActive !== 'boolean') return res.status(400).json({ success: false, message: 'isActive must be boolean' });
    if (userIds.includes(req.userId) && isActive === false) return res.status(400).json({ success: false, message: 'You cannot deactivate yourself' });
    const result = await User.updateMany({ _id: { $in: userIds } }, { isActive });
    if (isActive === false) await RefreshToken.updateMany({ userId: { $in: userIds } }, { isRevoked: true });
    await logActivity(req.userId, 'admin_bulk_status_change', { count: result.modifiedCount, isActive }, req);
    res.json({ success: true, modified: result.modifiedCount, isActive });
  } catch (error) {
    console.error('Admin bulk status error:', error);
    res.status(500).json({ success: false, message: 'Bulk status change failed' });
  }
});

router.post('/users/:id/force-logout', async (req, res) => {
  try {
    const result = await RefreshToken.updateMany({ userId: req.params.id, isRevoked: false }, { isRevoked: true });
    await logActivity(req.userId, 'admin_force_logout', { targetUserId: req.params.id, sessionsRevoked: result.modifiedCount }, req);
    res.json({ success: true, revoked: result.modifiedCount });
  } catch (error) {
    console.error('Admin force logout error:', error);
    res.status(500).json({ success: false, message: 'Force logout failed' });
  }
});

// ============================================================
// DOCUMENTS
// ============================================================

router.get('/documents', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search, userId, sortBy = 'createdAt', order = -1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const query = {};
    if (status) query.status = status;
    if (userId) query.userId = userId;
    if (search) query.title = { $regex: search, $options: 'i' };
    const sort = { [sortBy]: parseInt(order) };
    const [docs, total] = await Promise.all([
      Document.find(query).populate('userId', 'name email').skip(skip).limit(parseInt(limit)).sort(sort),
      Document.countDocuments(query),
    ]);
    const docIds = docs.map((d) => d._id);
    const chunkCounts = await Chunk.aggregate([
      { $match: { documentId: { $in: docIds } } },
      { $group: { _id: '$documentId', count: { $sum: 1 } } },
    ]);
    const chunkMap = Object.fromEntries(chunkCounts.map((c) => [String(c._id), c.count]));
    res.json({
      success: true,
      documents: docs.map((d) => ({ ...d.toObject(), chunkCount: chunkMap[String(d._id)] || 0 })),
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Admin documents list error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch documents' });
  }
});

router.delete('/documents/:id', async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });
    await Promise.all([
      Chunk.deleteMany({ documentId: doc._id }),
      Conversation.deleteMany({ documentId: doc._id }),
      Document.findByIdAndDelete(doc._id),
    ]);
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
    if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) return res.status(400).json({ success: false, message: 'Provide an array of document IDs' });
    const docs = await Document.find({ _id: { $in: documentIds } });
    const titles = docs.map((d) => d.title);
    await Promise.all([
      Chunk.deleteMany({ documentId: { $in: documentIds } }),
      Conversation.deleteMany({ documentId: { $in: documentIds } }),
      Document.deleteMany({ _id: { $in: documentIds } }),
    ]);
    await logActivity(req.userId, 'admin_bulk_delete_documents', { count: documentIds.length, titles }, req);
    res.json({ success: true, message: `${documentIds.length} documents deleted` });
  } catch (error) {
    console.error('Admin bulk delete documents error:', error);
    res.status(500).json({ success: false, message: 'Bulk delete failed' });
  }
});

router.post('/documents/:id/reprocess', async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });
    const path = require('path');
    const fs = require('fs');
    const filePath = path.join(__dirname, doc.fileUrl.replace(/^\//, ''));
    if (!fs.existsSync(filePath)) return res.status(400).json({ success: false, message: 'Original file not found on disk. Cannot reprocess.' });
    await Chunk.deleteMany({ documentId: doc._id });
    doc.status = 'processing';
    doc.processingError = null;
    await doc.save();
    processDocument(doc._id, filePath, doc.userId).catch((err) => console.error(`Reprocess failed for ${doc._id}:`, err));
    await logActivity(req.userId, 'admin_reprocess_document', { documentId: doc._id, title: doc.title }, req);
    res.json({ success: true, message: 'Reprocessing started', document: doc });
  } catch (error) {
    console.error('Admin reprocess error:', error);
    res.status(500).json({ success: false, message: 'Reprocess failed' });
  }
});

router.post('/documents/bulk-reprocess', async (req, res) => {
  try {
    const { documentIds } = req.body;
    if (!Array.isArray(documentIds) || documentIds.length === 0) return res.status(400).json({ success: false, message: 'documentIds required' });
    const path = require('path');
    const fs = require('fs');
    const docs = await Document.find({ _id: { $in: documentIds } });
    let queued = 0;
    let skipped = 0;
    for (const doc of docs) {
      const filePath = path.join(__dirname, doc.fileUrl.replace(/^\//, ''));
      if (!fs.existsSync(filePath)) { skipped++; continue; }
      await Chunk.deleteMany({ documentId: doc._id });
      doc.status = 'processing';
      doc.processingError = null;
      await doc.save();
      processDocument(doc._id, filePath, doc.userId).catch((err) => console.error(`Reprocess failed for ${doc._id}:`, err));
      queued++;
    }
    await logActivity(req.userId, 'admin_bulk_reprocess', { queued, skipped, total: docs.length }, req);
    res.json({ success: true, queued, skipped, total: docs.length });
  } catch (error) {
    console.error('Admin bulk reprocess error:', error);
    res.status(500).json({ success: false, message: 'Bulk reprocess failed' });
  }
});

// ============================================================
// STATS & ANALYTICS
// ============================================================

router.get('/stats', async (req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const [totalUsers, activeToday, totalDocuments, totalChunks, totalConversations, processingDocs, failedDocs, verifiedUsers, totalMessages] = await Promise.all([
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
      { $sort: { count: -1 } }, { $limit: 5 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: { 'user.name': 1, 'user.email': 1, count: 1 } },
    ]);
    const storageUsed = await Document.aggregate([{ $group: { _id: null, total: { $sum: '$fileSize' } } }]);
    const activities = await ActivityLog.aggregate([
      { $match: { timestamp: { $gte: weekAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
    res.json({
      success: true,
      stats: {
        totalUsers, activeToday, verifiedUsers, totalDocuments, totalChunks, totalConversations,
        totalMessages: totalMessages[0]?.count || 0,
        processingDocs, failedDocs,
        storageUsed: storageUsed[0]?.total || 0,
        topUsers, last7DaysActivity: activities,
      },
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
});

router.get('/analytics', async (req, res) => {
  try {
    const range = Math.min(365, Math.max(1, parseInt(req.query.range) || 30));
    const since = new Date();
    since.setDate(since.getDate() - range);
    const [userRegistrations, docUploads, convStarts] = await Promise.all([
      User.aggregate([{ $match: { createdAt: { $gte: since } } }, { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
      Document.aggregate([{ $match: { createdAt: { $gte: since } } }, { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
      Conversation.aggregate([{ $match: { createdAt: { $gte: since } } }, { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
    ]);
    const totalUsers = await User.countDocuments();
    const totalDocs = await Document.countDocuments();
    const avgDocsPerUser = totalUsers ? +(totalDocs / totalUsers).toFixed(2) : 0;
    const [quizGenerations, flashcardGenerations, comparisonCount, summaryCount] = await Promise.all([
      ActivityLog.countDocuments({ action: 'generate_quiz' }),
      ActivityLog.countDocuments({ action: 'generate_flashcards' }),
      ActivityLog.countDocuments({ action: 'compare_documents' }),
      ActivityLog.countDocuments({ action: 'generate_summary' }),
    ]);
    const statusBreakdown = await Document.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
    const storageByUser = await Document.aggregate([
      { $group: { _id: '$userId', total: { $sum: '$fileSize' } } },
      { $sort: { total: -1 } }, { $limit: 10 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: { 'user.name': 1, 'user.email': 1, total: 1 } },
    ]);
    res.json({
      success: true,
      analytics: {
        range, userRegistrations, docUploads, convStarts, avgDocsPerUser,
        quizGenerations, flashcardGenerations, comparisonCount, summaryCount,
        totalUsers, totalDocs, statusBreakdown, storageByUser,
      },
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch analytics' });
  }
});

// ============================================================
// LOGS
// ============================================================

router.get('/logs', async (req, res) => {
  try {
    const { page = 1, limit = 50, userId, action, startDate, endDate } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const query = {};
    if (userId) query.userId = userId;
    if (action) query.action = { $regex: action, $options: 'i' };
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }
    const [logs, total] = await Promise.all([
      ActivityLog.find(query).populate('userId', 'name email').sort({ timestamp: -1 }).skip(skip).limit(parseInt(limit)),
      ActivityLog.countDocuments(query),
    ]);
    res.json({ success: true, logs, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error('Admin logs error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch logs' });
  }
});

router.get('/logs/actions', async (req, res) => {
  try {
    const actions = await ActivityLog.distinct('action');
    res.json({ success: true, actions: actions.sort() });
  } catch (error) {
    console.error('Admin log actions error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch actions' });
  }
});

// ============================================================
// SETTINGS
// ============================================================

router.get('/settings', async (req, res) => {
  try {
    const settings = await Settings.find();
    res.json({ success: true, settings });
  } catch (error) {
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
    res.status(500).json({ success: false, message: 'Failed to update setting' });
  }
});

router.delete('/settings/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const result = await Settings.findOneAndDelete({ key });
    if (!result) return res.status(404).json({ success: false, message: 'Setting not found' });
    await logActivity(req.userId, 'admin_delete_setting', { key }, req);
    res.json({ success: true, message: 'Setting deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete setting' });
  }
});

// ============================================================
// SYSTEM HEALTH
// ============================================================

router.get('/system/health', async (req, res) => {
  try {
    const mem = process.memoryUsage();
    const dbState = ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState] || 'unknown';
    let dbStats = null;
    try { dbStats = await mongoose.connection.db.stats(); } catch (_) {}
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const [recentErrors, activeSessions, recentUploads] = await Promise.all([
      ActivityLog.countDocuments({ timestamp: { $gte: oneHourAgo }, action: { $regex: 'failed', $options: 'i' } }),
      RefreshToken.countDocuments({ isRevoked: false, expiresAt: { $gt: new Date() } }),
      Document.countDocuments({ createdAt: { $gte: oneHourAgo } }),
    ]);
    res.json({
      success: true,
      health: {
        server: {
          uptime: Math.floor(process.uptime()),
          nodeVersion: process.version,
          platform: os.platform(),
          arch: os.arch(),
          hostname: os.hostname(),
          loadAvg: os.loadavg(),
          cpuCount: os.cpus().length,
        },
        memory: {
          process: { rss: mem.rss, heapTotal: mem.heapTotal, heapUsed: mem.heapUsed, external: mem.external },
          system: { total: os.totalmem(), free: os.freemem(), used: os.totalmem() - os.freemem() },
        },
        database: {
          state: dbState,
          collections: dbStats?.collections || 0,
          objects: dbStats?.objects || 0,
          dataSize: dbStats?.dataSize || 0,
          storageSize: dbStats?.storageSize || 0,
          indexes: dbStats?.indexes || 0,
        },
        metrics: { activeSessions, recentUploads, recentErrors },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Admin system health error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch health' });
  }
});

// ============================================================
// CSV EXPORTS
// ============================================================

router.get('/export/users', async (req, res) => {
  try {
    const users = await User.find().select('name email role isActive isEmailVerified lastLogin createdAt').sort({ createdAt: -1 });
    const csv = toCSV(users.map((u) => u.toObject()), [
      { label: 'ID', key: '_id' },
      { label: 'Name', key: 'name' },
      { label: 'Email', key: 'email' },
      { label: 'Role', key: 'role' },
      { label: 'Active', value: (u) => (u.isActive ? 'yes' : 'no') },
      { label: 'Email Verified', value: (u) => (u.isEmailVerified ? 'yes' : 'no') },
      { label: 'Last Login', key: 'lastLogin' },
      { label: 'Created At', key: 'createdAt' },
    ]);
    await logActivity(req.userId, 'admin_export_users', { count: users.length }, req);
    sendCSV(res, 'docmind-users', csv);
  } catch (error) {
    console.error('Admin export users error:', error);
    res.status(500).json({ success: false, message: 'Export failed' });
  }
});

router.get('/export/documents', async (req, res) => {
  try {
    const docs = await Document.find().populate('userId', 'name email').sort({ createdAt: -1 });
    const csv = toCSV(docs.map((d) => d.toObject()), [
      { label: 'ID', key: '_id' },
      { label: 'Title', key: 'title' },
      { label: 'Owner', value: (d) => d.userId?.email || '' },
      { label: 'Owner Name', value: (d) => d.userId?.name || '' },
      { label: 'Status', key: 'status' },
      { label: 'Pages', key: 'pageCount' },
      { label: 'Size (bytes)', key: 'fileSize' },
      { label: 'Error', value: (d) => d.processingError || '' },
      { label: 'Created At', key: 'createdAt' },
    ]);
    await logActivity(req.userId, 'admin_export_documents', { count: docs.length }, req);
    sendCSV(res, 'docmind-documents', csv);
  } catch (error) {
    console.error('Admin export documents error:', error);
    res.status(500).json({ success: false, message: 'Export failed' });
  }
});

router.get('/export/logs', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = {};
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }
    const logs = await ActivityLog.find(query).populate('userId', 'name email').sort({ timestamp: -1 }).limit(10000);
    const csv = toCSV(logs.map((l) => l.toObject()), [
      { label: 'Timestamp', key: 'timestamp' },
      { label: 'User Email', value: (l) => l.userId?.email || '' },
      { label: 'User Name', value: (l) => l.userId?.name || '' },
      { label: 'Action', key: 'action' },
      { label: 'Details', value: (l) => (l.details ? JSON.stringify(l.details) : '') },
      { label: 'IP', key: 'ip' },
      { label: 'User Agent', key: 'userAgent' },
    ]);
    await logActivity(req.userId, 'admin_export_logs', { count: logs.length }, req);
    sendCSV(res, 'docmind-logs', csv);
  } catch (error) {
    console.error('Admin export logs error:', error);
    res.status(500).json({ success: false, message: 'Export failed' });
  }
});

// ============================================================
// TEST EMAIL
// ============================================================

const testEmailLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 3,
  message: { success: false, message: 'Too many test emails. Wait 5 minutes.' },
});

router.post('/test-email', testEmailLimiter, async (req, res) => {
  try {
    const { to } = req.body;
    if (!to || !/^\S+@\S+\.\S+$/.test(to)) return res.status(400).json({ success: false, message: 'Valid email required' });
    if (!process.env.RESEND_API_KEY) return res.status(400).json({ success: false, message: 'RESEND_API_KEY not configured on the server.' });
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'noreply@docmind.ai',
      to: [to],
      subject: 'DocMind - Test Email',
      html: `<h2>DocMind Email Configuration Works</h2><p>Test email from admin panel.</p><p>Sent at: ${new Date().toISOString()}</p>`,
    });
    if (error) throw new Error(error.message);
    await logActivity(req.userId, 'admin_test_email', { to }, req);
    res.json({ success: true, message: `Test email sent to ${to}`, id: data?.id });
  } catch (error) {
    console.error('Admin test email error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to send test email' });
  }
});

module.exports = { router, isAdmin };
