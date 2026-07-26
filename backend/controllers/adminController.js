const User = require('../models/User');
const Report = require('../models/Report');
const AdminAuditLog = require('../models/AdminAuditLog');
const Listing = require('../models/Listing');
const TransactionRequest = require('../models/TransactionRequest');

// GET /api/admin/verifications/pending
async function getPendingVerifications(req, res, next) {
  try {
    const users = await User.find({ 'verification.status': 'pending' }).select(
      'name email phone role verification createdAt'
    );
    res.json({ users });
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/reports
async function getReports(req, res, next) {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const reports = await Report.find(filter).sort({ createdAt: -1 }).populate('reportedBy', 'name');
    res.json({ reports });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/admin/reports/:id
async function updateReport(req, res, next) {
  try {
    const { status, adminNote } = req.body; // status: 'reviewed' | 'actioned' | 'dismissed'
    if (!['reviewed', 'actioned', 'dismissed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ error: 'Report not found' });

    report.status = status;
    report.adminNote = adminNote || '';
    report.reviewedBy = req.user._id;
    report.reviewedAt = new Date();
    await report.save();

    await AdminAuditLog.create({
      admin: req.user._id,
      action: `report_${status}`,
      targetType: report.targetType,
      targetId: report.targetId,
      reason: adminNote || '',
    });

    res.json({ report });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/admin/users/:id/suspend
async function suspendUser(req, res, next) {
  try {
    const { suspend, reason } = req.body; // suspend: boolean
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.isSuspended = !!suspend;
    user.suspensionReason = suspend ? reason || 'Policy violation' : null;
    await user.save();

    await AdminAuditLog.create({
      admin: req.user._id,
      action: suspend ? 'user_suspend' : 'user_reinstate',
      targetType: 'user',
      targetId: user._id,
      reason: reason || '',
    });

    res.json({ user: { _id: user._id, isSuspended: user.isSuspended, suspensionReason: user.suspensionReason } });
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/users?search=&role=&status=
async function listUsers(req, res, next) {
  try {
    const { search, role, suspended } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (suspended !== undefined) filter.isSuspended = suspended === 'true';
    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { phone: new RegExp(search, 'i') },
      ];
    }
    const users = await User.find(filter)
      .select('name email phone role verification.status rating isSuspended suspensionReason createdAt')
      .sort({ createdAt: -1 })
      .limit(100);
    res.json({ users });
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/users/:id/detail - detailed user profile for admin modal
async function getUserDetail(req, res, next) {
  try {
    const user = await User.findById(req.params.id)
      .select('name email phone role verification rating isSuspended suspensionReason location.areaLabel guardianContact createdAt');

    if (!user) return res.status(404).json({ error: 'User not found' });

    const [listingCount, transactionCount] = await Promise.all([
      Listing.countDocuments({ owner: user._id }),
      TransactionRequest.countDocuments({
        $or: [{ requester: user._id }, { owner: user._id }],
      }),
    ]);

    const userObj = user.toObject();
    userObj.listingCount = listingCount;
    userObj.transactionCount = transactionCount;

    res.json({ user: userObj });
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/audit-log
async function getAuditLog(req, res, next) {
  try {
    const logs = await AdminAuditLog.find().sort({ createdAt: -1 }).limit(200).populate('admin', 'name');
    res.json({ logs });
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/stats
async function getStats(req, res, next) {
  try {
    const [activeListings, completedTxns, verifiedUsers, flaggedAccounts, totalUsers, openReports] =
      await Promise.all([
        Listing.countDocuments({ status: 'active' }),
        TransactionRequest.countDocuments({ status: 'completed' }),
        User.countDocuments({ 'verification.status': 'approved' }),
        User.countDocuments({ isSuspended: true }),
        User.countDocuments(),
        Report.countDocuments({ status: 'open' }),
      ]);

    // simple weekly breakdown of completed transactions for the admin chart
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentCompleted = await TransactionRequest.countDocuments({
      status: 'completed',
      completedAt: { $gte: since },
    });

    // Role distribution for donut chart
    const roleAgg = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
    ]);
    const roleDistribution = roleAgg.map((r) => ({
      name: r._id.charAt(0).toUpperCase() + r._id.slice(1),
      value: r.count,
    }));

    res.json({
      activeListings,
      completedTransactions: completedTxns,
      verifiedUsers,
      flaggedAccounts,
      totalUsers,
      openReports,
      completedLast7Days: recentCompleted,
      roleDistribution,
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/stats/trends - weekly trends for the last 30 days
async function getStatsTrends(req, res, next) {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Aggregate transactions by week
    const txnTrends = await TransactionRequest.aggregate([
      {
        $match: {
          status: 'completed',
          completedAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$completedAt' },
            week: { $isoWeek: '$completedAt' },
          },
          transactions: { $sum: 1 },
          firstDate: { $min: '$completedAt' },
        },
      },
      { $sort: { '_id.year': 1, '_id.week': 1 } },
    ]);

    const trends = txnTrends.map((t) => ({
      label: new Date(t.firstDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      transactions: t.transactions,
      week: `W${t._id.week}`,
    }));

    // Also get user registration trends
    const userTrends = await User.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            week: { $isoWeek: '$createdAt' },
          },
          registrations: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.week': 1 } },
    ]);

    // Merge user registration data into trends
    for (const ut of userTrends) {
      const key = `W${ut._id.week}`;
      const existing = trends.find((t) => t.week === key);
      if (existing) {
        existing.registrations = ut.registrations;
      }
    }

    res.json({ trends });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getPendingVerifications, getReports, updateReport, suspendUser, getAuditLog, getStats,
  listUsers, getUserDetail, getStatsTrends,
};
