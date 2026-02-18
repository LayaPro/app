import { nanoid } from 'nanoid';
import Project from '../models/project';
import ClientEvent from '../models/clientEvent';
import Team from '../models/team';
import TeamFinance from '../models/teamFinance';
import { createModuleLogger } from './logger';

const logger = createModuleLogger('TeamFinanceUtils');

/**
 * Recalculates and updates totalPayable for a team member across all their projects
 */
export async function recalculateTeamMemberPayable(memberId: string, tenantId: string): Promise<void> {
  const requestId = nanoid(8);
  logger.info(`[${requestId}] Recalculating payable for member`, { memberId, tenantId });

  try {
    // Get team member details for salary and payment type
    const teamMember = await Team.findOne({ memberId, tenantId });
    
    if (!teamMember || !teamMember.salary) {
      logger.info(`[${requestId}] Team member not found or no salary set`, { memberId });
      // If no salary set, ensure totalPayable is 0
      const existingFinance = await TeamFinance.findOne({ memberId, tenantId });
      if (existingFinance) {
        existingFinance.totalPayable = 0;
        await existingFinance.save();
      }
      return;
    }

    const salary = parseFloat(teamMember.salary);
    let totalPayable = 0;

    if (teamMember.paymentType === 'per-month') {
      // For per-month: Count unique projects where member is assigned
      const projectsWithMember = await ClientEvent.distinct('projectId', {
        tenantId,
        teamMembersAssigned: memberId
      });
      
      totalPayable = salary * projectsWithMember.length;
      logger.info(`[${requestId}] Per-month calculation`, { 
        memberId, 
        salary, 
        projectCount: projectsWithMember.length,
        totalPayable 
      });
    } else if (teamMember.paymentType === 'per-event') {
      // For per-event: Count all events where member is assigned
      const eventsCount = await ClientEvent.countDocuments({
        tenantId,
        teamMembersAssigned: memberId
      });
      
      totalPayable = salary * eventsCount;
      logger.info(`[${requestId}] Per-event calculation`, { 
        memberId, 
        salary, 
        eventsCount,
        totalPayable 
      });
    }

    logger.info(`[${requestId}] Calculated totalPayable`, { memberId, totalPayable });

    // Update or create TeamFinance record
    const existingFinance = await TeamFinance.findOne({ memberId, tenantId });

    if (existingFinance) {
      existingFinance.totalPayable = totalPayable;
      await existingFinance.save();
      logger.info(`[${requestId}] Updated existing TeamFinance`, { memberId, totalPayable });
    } else {
      // Create new TeamFinance record
      const financeId = `fin_${nanoid()}`;
      await TeamFinance.create({
        financeId,
        tenantId,
        memberId,
        totalPayable,
        paidAmount: 0,
        totalPaid: 0,
        pendingAmount: 0
      });
      logger.info(`[${requestId}] Created new TeamFinance`, { memberId, totalPayable });
    }
  } catch (error: any) {
    logger.error(`[${requestId}] Error recalculating payable`, { memberId, error: error.message });
    throw error;
  }
}

/**
 * Recalculates payables for all team members on a project
 */
export async function recalculateProjectTeamPayables(projectId: string, tenantId: string): Promise<void> {
  const requestId = nanoid(8);
  logger.info(`[${requestId}] Recalculating payables for project team`, { projectId, tenantId });

  try {
    // Find all events for this project
    const projectEvents = await ClientEvent.find({ projectId, tenantId }).lean();
    
    if (!projectEvents || projectEvents.length === 0) {
      logger.info(`[${requestId}] No events found for project`, { projectId });
      return;
    }

    // Get unique member IDs from all events
    const memberIds = new Set<string>();
    projectEvents.forEach(event => {
      if (event.teamMembersAssigned && Array.isArray(event.teamMembersAssigned)) {
        event.teamMembersAssigned.forEach(memberId => memberIds.add(memberId as string));
      }
    });

    if (memberIds.size === 0) {
      logger.info(`[${requestId}] No team members assigned to project events`, { projectId });
      return;
    }

    // Recalculate for each member
    for (const memberId of Array.from(memberIds)) {
      await recalculateTeamMemberPayable(memberId, tenantId);
    }

    logger.info(`[${requestId}] Recalculated payables for all project team members`, { 
      projectId, 
      memberCount: memberIds.size
    });
  } catch (error: any) {
    logger.error(`[${requestId}] Error recalculating project team payables`, { 
      projectId, 
      error: error.message 
    });
    throw error;
  }
}

/**
 * Updates paidAmount when a salary expense is recorded
 */
export async function updateTeamMemberPaidAmount(memberId: string, tenantId: string, amount: number, session?: any): Promise<void> {
  const requestId = nanoid(8);
  logger.info(`[${requestId}] Updating paid amount for member`, { memberId, amount });

  try {
    const query = { memberId, tenantId };
    const teamFinance = session 
      ? await TeamFinance.findOne(query).session(session)
      : await TeamFinance.findOne(query);

    if (!teamFinance) {
      logger.warn(`[${requestId}] TeamFinance not found, creating new record`, { memberId });
      const financeId = `fin_${nanoid()}`;
      const financeData = {
        financeId,
        tenantId,
        memberId,
        totalPayable: 0,
        paidAmount: amount,
        totalPaid: 0, // totalPaid is for manual transactions only
        pendingAmount: -amount // Negative means overpaid
      };
      
      if (session) {
        await TeamFinance.create([financeData], { session });
      } else {
        await TeamFinance.create(financeData);
      }
      logger.info(`[${requestId}] Created new TeamFinance with paidAmount`, { memberId, paidAmount: amount });
    } else {
      const oldPaidAmount = teamFinance.paidAmount || 0;
      
      teamFinance.paidAmount = oldPaidAmount + amount;
      // Do NOT update totalPaid - that's only for manual transactions
      
      logger.info(`[${requestId}] Before save`, { 
        memberId, 
        oldPaidAmount,
        newPaidAmount: teamFinance.paidAmount,
        amount,
        totalPayable: teamFinance.totalPayable
      });
      
      await teamFinance.save({ session });
      
      logger.info(`[${requestId}] After save - Updated paid amount`, { 
        memberId, 
        paidAmount: teamFinance.paidAmount,
        totalPayable: teamFinance.totalPayable,
        pending: (teamFinance.totalPayable || 0) - teamFinance.paidAmount
      });
    }
  } catch (error: any) {
    logger.error(`[${requestId}] Error updating paid amount`, { memberId, error: error.message });
    throw error;
  }
}
