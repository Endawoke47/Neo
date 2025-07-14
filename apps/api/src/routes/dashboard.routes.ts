// Dashboard Routes
// Comprehensive dashboard data aggregation and insights

import { Router } from 'express';
import { DashboardService } from '../services/dashboard.service';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.middleware';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// GET /api/v1/dashboard/overview - Get comprehensive dashboard overview
router.get('/overview', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const overview = await DashboardService.getDashboardOverview(userId);
    
    res.json({
      success: true,
      data: overview,
      message: 'Dashboard overview retrieved successfully'
    });
  } catch (error) {
    console.error('Error in GET /dashboard/overview:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch dashboard overview'
    });
  }
});

// GET /api/v1/dashboard/analytics - Get detailed analytics
router.get('/analytics', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const analytics = await DashboardService.getDetailedAnalytics(userId);
    
    res.json({
      success: true,
      data: analytics,
      message: 'Detailed analytics retrieved successfully'
    });
  } catch (error) {
    console.error('Error in GET /dashboard/analytics:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch analytics'
    });
  }
});

// GET /api/v1/dashboard/alerts - Get alerts and notifications
router.get('/alerts', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const alerts = await DashboardService.getAlerts(userId);
    
    res.json({
      success: true,
      data: alerts,
      message: 'Alerts retrieved successfully'
    });
  } catch (error) {
    console.error('Error in GET /dashboard/alerts:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch alerts'
    });
  }
});

// GET /api/v1/dashboard/activity - Get recent activity
router.get('/activity', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const activity = await DashboardService.getRecentActivity(userId, limit);
    
    res.json({
      success: true,
      data: activity,
      message: 'Recent activity retrieved successfully'
    });
  } catch (error) {
    console.error('Error in GET /dashboard/activity:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch recent activity'
    });
  }
});

// GET /api/v1/dashboard/deadlines - Get upcoming deadlines
router.get('/deadlines', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const deadlines = await DashboardService.getUpcomingDeadlines(userId, limit);
    
    res.json({
      success: true,
      data: deadlines,
      message: 'Upcoming deadlines retrieved successfully'
    });
  } catch (error) {
    console.error('Error in GET /dashboard/deadlines:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch upcoming deadlines'
    });
  }
});

export default router;