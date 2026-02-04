import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Project from '../models/project';
import ClientEvent from '../models/clientEvent';
import ProjectFinance from '../models/projectFinance';
import Proposal from '../models/proposal';
import Team from '../models/team';
import Event from '../models/event';
import EventDeliveryStatus from '../models/eventDeliveryStatus';

interface StatsComparison {
  current: number;
  previous: number;
  change: number;
  changePercent: number;
}

const calculateComparison = (current: number, previous: number): StatsComparison => {
  const change = current - previous;
  const changePercent = previous > 0 ? ((change / previous) * 100) : (current > 0 ? 100 : 0);
  return {
    current,
    previous,
    change,
    changePercent: Math.round(changePercent * 10) / 10, // Round to 1 decimal
  };
};

export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    // Calculate date ranges
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    // Projects Stats
    const currentMonthProjects = await Project.countDocuments({
      tenantId,
      createdAt: { $gte: currentMonthStart }
    });

    const lastMonthProjects = await Project.countDocuments({
      tenantId,
      createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd }
    });

    const totalProjects = await Project.countDocuments({ tenantId });
    const activeProjects = await Project.countDocuments({ tenantId, isCompleted: { $ne: true } });

    // Revenue Stats
    const currentMonthFinances = await ProjectFinance.find({
      tenantId,
      'transactions.datetime': { $gte: currentMonthStart }
    }).lean();

    const lastMonthFinances = await ProjectFinance.find({
      tenantId,
      'transactions.datetime': { $gte: lastMonthStart, $lte: lastMonthEnd }
    }).lean();

    const currentMonthRevenue = currentMonthFinances.reduce((sum, finance) => {
      const monthTransactions = (finance.transactions || []).filter(
        (t: any) => new Date(t.datetime) >= currentMonthStart && t.nature === 'received'
      );
      return sum + monthTransactions.reduce((tSum, t: any) => tSum + t.amount, 0);
    }, 0);

    const lastMonthRevenue = lastMonthFinances.reduce((sum, finance) => {
      const monthTransactions = (finance.transactions || []).filter(
        (t: any) => new Date(t.datetime) >= lastMonthStart && 
                   new Date(t.datetime) <= lastMonthEnd && 
                   t.nature === 'received'
      );
      return sum + monthTransactions.reduce((tSum, t: any) => tSum + t.amount, 0);
    }, 0);

    const allFinances = await ProjectFinance.find({ tenantId }).lean();
    const totalRevenue = allFinances.reduce((sum, f) => sum + (f.receivedAmount || 0), 0);
    const pendingReceivable = allFinances.reduce((sum, f) => {
      const pending = (f.totalBudget || 0) - (f.receivedAmount || 0);
      return sum + (pending > 0 ? pending : 0);
    }, 0);

    // Proposals Stats
    const currentMonthProposals = await Proposal.countDocuments({
      tenantId,
      createdAt: { $gte: currentMonthStart }
    });

    const lastMonthProposals = await Proposal.countDocuments({
      tenantId,
      createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd }
    });

    const totalProposals = await Proposal.countDocuments({ tenantId });
    const pendingProposals = await Proposal.countDocuments({
      tenantId,
      status: { $in: ['draft', 'sent'] }
    });

    // Events Stats - Compare current month events with last month
    // Count events where fromDatetime falls within the month
    const currentMonthEvents = await ClientEvent.countDocuments({
      tenantId,
      fromDatetime: { 
        $gte: currentMonthStart, 
        $lt: new Date(now.getFullYear(), now.getMonth() + 1, 1) // First day of next month
      }
    });

    const lastMonthEvents = await ClientEvent.countDocuments({
      tenantId,
      fromDatetime: { 
        $gte: lastMonthStart, 
        $lt: currentMonthStart // First day of current month
      }
    });

    // Calculate comparisons
    const projectsComparison = calculateComparison(currentMonthProjects, lastMonthProjects);
    const revenueComparison = calculateComparison(currentMonthRevenue, lastMonthRevenue);
    const proposalsComparison = calculateComparison(currentMonthProposals, lastMonthProposals);
    const eventsComparison = calculateComparison(currentMonthEvents, lastMonthEvents);

    return res.status(200).json({
      message: 'Dashboard stats retrieved successfully',
      stats: {
        totalProjects,
        activeProjects,
        totalRevenue,
        pendingReceivable,
        totalProposals,
        pendingProposals,
        upcomingEvents: currentMonthEvents,
        comparisons: {
          projects: projectsComparison,
          revenue: revenueComparison,
          proposals: proposalsComparison,
          events: eventsComparison,
        }
      }
    });
  } catch (err: any) {
    console.error('Get dashboard stats error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getUpcomingEvents = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    // Get current date and 30 days from now
    const now = new Date();
    const next30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Fetch statuses first to identify relevant status codes (include global statuses)
    const statuses = await EventDeliveryStatus.find({ tenantId: { $in: [tenantId, -1] } }).select('statusId statusCode statusDescription').lean();
    const scheduledStatusId = statuses.find(s => s.statusCode === 'SCHEDULED')?.statusId;
    const ongoingStatusId = statuses.find(s => s.statusCode === 'SHOOT_IN_PROGRESS')?.statusId;

    // Fetch all data in parallel
    const [scheduledEvents, ongoingEvents, projects, teamMembers, events] = await Promise.all([
      // Fetch all scheduled events (filter by date later)
      scheduledStatusId ? ClientEvent.find({
        tenantId,
        eventDeliveryStatusId: scheduledStatusId
      }).sort({ fromDatetime: 1 }).lean() : [],
      // Fetch ongoing events (shoot in progress status)
      ongoingStatusId ? ClientEvent.find({
        tenantId,
        eventDeliveryStatusId: ongoingStatusId
      }).lean() : [],
      Project.find({ tenantId }).select('projectId projectName displayPic').lean(),
      Team.find({ tenantId }).select('memberId firstName lastName profileIds').lean(),
      Event.find({ tenantId: { $in: [tenantId, -1] } }).select('eventId eventCode eventDesc eventAlias').lean()
    ]);

    // Filter scheduled events to only show those within next 30 days
    const filteredScheduledEvents = scheduledEvents.filter(event => {
      if (!event.fromDatetime) return false;
      const eventDate = new Date(event.fromDatetime);
      return eventDate <= next30Days;
    });

    // Combine ongoing and filtered scheduled events
    const allEvents = [...ongoingEvents, ...filteredScheduledEvents];

    // Create lookup maps
    const projectMap = new Map(projects.map(p => [p.projectId, p]));
    const teamMap = new Map(teamMembers.map(t => [t.memberId, t]));
    const eventTypeMap = new Map(events.map(e => [e.eventId, e]));
    const statusMap = new Map(statuses.map(s => [s.statusId, s]));

    // Enrich events with related data
    const enrichedEvents = allEvents.map(event => {
      const status = statusMap.get(event.eventDeliveryStatusId || '');
      const isOngoing = status?.statusCode === 'SHOOT_IN_PROGRESS';
      
      return {
        ...event,
        projectName: projectMap.get(event.projectId)?.projectName,
        eventType: eventTypeMap.get(event.eventId)?.eventDesc,
        statusDesc: status?.statusDescription,
        statusCode: status?.statusCode,
        isOngoing,
        teamMembers: event.teamMembersAssigned?.map((id: string) => teamMap.get(id)).filter(Boolean) || []
      };
    });

    // Sort: ongoing events first, then upcoming events
    enrichedEvents.sort((a, b) => {
      if (a.isOngoing && !b.isOngoing) return -1;
      if (!a.isOngoing && b.isOngoing) return 1;
      const aTime = a.fromDatetime ? new Date(a.fromDatetime).getTime() : 0;
      const bTime = b.fromDatetime ? new Date(b.fromDatetime).getTime() : 0;
      return aTime - bTime;
    });

    // Limit to 10 events
    const limitedEvents = enrichedEvents.slice(0, 10);

    return res.status(200).json({
      message: 'Upcoming events retrieved successfully',
      upcomingEvents: limitedEvents
    });
  } catch (err: any) {
    console.error('Get upcoming events error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getTeamAssignments = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    // Fetch all team members and events
    const [teamMembers, clientEvents, projects] = await Promise.all([
      Team.find({ tenantId }).select('memberId firstName lastName profileIds').lean(),
      ClientEvent.find({ tenantId }).select('clientEventId projectId teamMembersAssigned').lean(),
      Project.find({ tenantId }).select('projectId projectName').lean()
    ]);

    // Create project map for quick lookup
    const projectMap = new Map(projects.map(p => [p.projectId, p.projectName]));

    // Calculate assignments for each team member
    const teamWithAssignments = teamMembers.map(member => {
      // Find all events assigned to this member
      const assignedEvents = clientEvents.filter(event => 
        event.teamMembersAssigned?.includes(member.memberId)
      );

      // Get unique projects from assigned events
      const uniqueProjects = new Set(assignedEvents.map(e => e.projectId));

      return {
        memberId: member.memberId,
        firstName: member.firstName,
        lastName: member.lastName,
        profileIds: member.profileIds,
        eventsCount: assignedEvents.length,
        projectsCount: uniqueProjects.size,
        projects: Array.from(uniqueProjects).map(projectId => ({
          projectId,
          projectName: projectMap.get(projectId) || 'Unknown Project'
        }))
      };
    });

    // Sort by events count (most assigned on top)
    teamWithAssignments.sort((a, b) => b.eventsCount - a.eventsCount);

    return res.status(200).json({
      message: 'Team assignments retrieved successfully',
      teamMembers: teamWithAssignments
    });
  } catch (err: any) {
    console.error('Get team assignments error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getMonthlySales = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    const { year } = req.query;
    const selectedYear = year ? parseInt(year as string) : new Date().getFullYear();

    console.log(`[Monthly Sales] Fetching sales for year ${selectedYear}, tenant: ${tenantId}`);

    // Get all finance records with transactions
    const finances = await ProjectFinance.find({ tenantId }).lean();
    console.log(`[Monthly Sales] Found ${finances.length} finance records`);

    // Initialize monthly sales array
    const monthlySales = Array(12).fill(0).map((_, index) => ({
      month: new Date(selectedYear, index).toLocaleString('default', { month: 'short' }),
      revenue: 0,
      projects: new Set<string>()
    }));

    let totalTransactionsProcessed = 0;

    // Aggregate data by month from transactions
    finances.forEach(finance => {
      if (finance.transactions && finance.transactions.length > 0) {
        console.log(`[Monthly Sales] Finance ${finance.financeId} has ${finance.transactions.length} transactions`);
        finance.transactions.forEach(transaction => {
          if (transaction.nature === 'received') {
            totalTransactionsProcessed++;
            const transactionDate = new Date(transaction.datetime);
            const transactionYear = transactionDate.getFullYear();
            
            console.log(`[Monthly Sales] Transaction: ${transaction.transactionId}, amount: ${transaction.amount}, date: ${transactionDate.toISOString()}, year: ${transactionYear}`);
            
            if (transactionYear === selectedYear) {
              const month = transactionDate.getMonth();
              console.log(`[Monthly Sales] Adding ${transaction.amount} to month ${month} (${monthlySales[month].month})`);
              monthlySales[month].revenue += transaction.amount || 0;
              monthlySales[month].projects.add(finance.projectId);
            }
          }
        });
      }
    });

    console.log(`[Monthly Sales] Processed ${totalTransactionsProcessed} received transactions`);

    // Convert project sets to counts
    const finalMonthlySales = monthlySales.map(month => ({
      month: month.month,
      revenue: month.revenue,
      projects: month.projects.size
    }));

    console.log('[Monthly Sales] Final monthly sales:', JSON.stringify(finalMonthlySales, null, 2));

    // Calculate totals
    const totalRevenue = finalMonthlySales.reduce((sum, m) => sum + m.revenue, 0);
    const totalProjects = finalMonthlySales.reduce((sum, m) => sum + m.projects, 0);

    console.log(`[Monthly Sales] Total revenue: ${totalRevenue}, Total projects: ${totalProjects}`);

    return res.status(200).json({
      year: selectedYear,
      monthlySales: finalMonthlySales,
      totalRevenue,
      totalProjects
    });
  } catch (err: any) {
    console.error('Get monthly sales error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export default {
  getDashboardStats,
  getUpcomingEvents,
  getTeamAssignments,
  getMonthlySales
};
