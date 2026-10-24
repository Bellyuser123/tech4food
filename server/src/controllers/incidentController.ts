import { Response } from 'express';
import { Repository } from '../db/repository.js';
import { AuthenticatedRequest } from '../types/auth.js';

export class IncidentController {
  public static async createIncident(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    const restaurantId = req.activeRestaurantId!;
    const branchId = req.body.branchId || req.activeBranchId || 'branch-default';
    const { title, severity, correctiveActionDescription, assignedToId } = req.body;

    if (!title || !severity || !correctiveActionDescription) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Title, severity, and correctiveActionDescription are required.',
        },
      });
      return;
    }

    // Atomic transaction creating incident, corrective action, and initial audit event
    const result = await Repository.createIncidentWithAudit(
      {
        restaurant_id: restaurantId,
        branch_id: branchId,
        title,
        severity,
        status: 'action_assigned',
        reported_by: req.user?.id,
      },
      correctiveActionDescription,
      assignedToId
    );

    res.status(201).json({
      success: true,
      data: {
        incident: result.incident,
        correctiveAction: result.action,
        transactionStatus: 'COMMITTED_WITH_AUDIT_TRAIL',
      },
    });
  }

  public static async performCorrectiveAction(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    const actionId = String(req.params.actionId);
    const { evidenceNotes } = req.body;
    const performedByUserId = req.user!.id;

    const action = await Repository.performCorrectiveAction(
      actionId,
      performedByUserId,
      evidenceNotes || 'Action executed by kitchen staff'
    );

    res.status(200).json({
      success: true,
      data: {
        correctiveAction: action,
        message: 'Action completed and submitted for supervisor verification.',
      },
    });
  }

  public static async verifyCorrectiveAction(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    const actionId = String(req.params.actionId);
    const { decision, comments } = req.body;
    const supervisorId = req.user!.id;

    if (!decision || !['approved', 'rejected'].includes(decision)) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: "Decision must be 'approved' or 'rejected'." },
      });
      return;
    }

    try {
      // DUAL-CONTROL VERIFICATION CHECK:
      // A supervisor cannot verify an action they performed themselves!
      const updated = await Repository.verifyCorrectiveAction(
        actionId,
        supervisorId,
        decision,
        comments || 'Supervisor verified'
      );

      res.status(200).json({
        success: true,
        data: {
          correctiveAction: updated,
          verification: {
            verifiedBy: supervisorId,
            decision,
            verifiedAt: new Date().toISOString(),
            dualControlEnforced: true,
          },
        },
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Verification failed';
      const isDualControlViolation = message.includes('Dual-Control Violation');
      res.status(isDualControlViolation ? 403 : 400).json({
        success: false,
        error: {
          code: isDualControlViolation ? 'DUAL_CONTROL_VIOLATION' : 'VERIFICATION_ERROR',
          message,
        },
      });
    }
  }
}
