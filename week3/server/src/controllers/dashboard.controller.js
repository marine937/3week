const { pool } = require('../config/db');

async function getDashboardStats(req, res, next) {
  try {
    const userId = req.user.id;

    const [[projectStats]] = await pool.execute(
      `SELECT
         COUNT(*) AS total,
         SUM(status = 'active') AS active,
         SUM(status = 'completed') AS completed,
         SUM(status = 'planning') AS planning,
         SUM(status = 'on_hold') AS on_hold
       FROM projects WHERE user_id = ?`,
      [userId]
    );

    const [tasksByStatus] = await pool.execute(
      `SELECT status, COUNT(*) AS count
       FROM tasks WHERE user_id = ?
       GROUP BY status`,
      [userId]
    );

    const [tasksByPriority] = await pool.execute(
      `SELECT priority, COUNT(*) AS count
       FROM tasks WHERE user_id = ?
       GROUP BY priority`,
      [userId]
    );

    const [commentsOverTime] = await pool.execute(
      `SELECT DATE(created_at) AS date, COUNT(*) AS count
       FROM comments WHERE user_id = ?
         AND created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
       GROUP BY DATE(created_at)
       ORDER BY date ASC`,
      [userId]
    );

    const [[totals]] = await pool.execute(
      `SELECT
         (SELECT COUNT(*) FROM projects WHERE user_id = ?) AS projects,
         (SELECT COUNT(*) FROM tasks WHERE user_id = ?) AS tasks,
         (SELECT COUNT(*) FROM comments WHERE user_id = ?) AS comments`,
      [userId, userId, userId]
    );

    const [recentTasks] = await pool.execute(
      `SELECT t.id, t.title, t.status, t.priority, t.due_date, p.name AS project_name
       FROM tasks t
       JOIN projects p ON p.id = t.project_id
       WHERE t.user_id = ?
       ORDER BY t.updated_at DESC
       LIMIT 5`,
      [userId]
    );

    res.json({
      success: true,
      data: {
        totals,
        projectStats,
        tasksByStatus,
        tasksByPriority,
        commentsOverTime,
        recentTasks,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getDashboardStats };
