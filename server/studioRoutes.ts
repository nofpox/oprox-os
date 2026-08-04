/**
 * OPROX Studio Phase 1 — Express REST Router
 * Authoritative Studio routes for visual application building, canvas updates, OCC revisions,
 * AI copilot, code compilation, and Code / AI promotion.
 */

import { Router } from 'express';
import { requireAuth, AuthRequest } from './auth';
import { aiGovernanceGate } from './aiGovernance';
import { logSecurityAudit } from './audit';
import {
  createStudioProject,
  getStudioProjectIr,
  listStudioProjects,
  saveStudioProjectIr,
  promoteStudioProjectToWorkspace,
} from '../src/lib/studio/studioStore';
import { processStudioCopilotRequest } from '../src/lib/studio/studioCopilot';
import { compileStudioIr } from '../src/lib/studio/studioCompiler';
import { generateDrizzleSchemaCode } from '../src/lib/studio/studioDrizzleGenerator';
import { importCodeToStudioSubset } from '../src/lib/studio/studioImporter';
import { simulateFlowExecution, validateStudioFlowGraph } from '../src/lib/studio/studioFlowEngine';
import { validateStudioSchemaModel } from '../src/lib/studio/studioSchemaEngine';

const router = Router();

// 1. List Studio Projects
router.get('/api/studio/projects', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const projects = await listStudioProjects(tenantId);
    res.json({ success: true, projects });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to list Studio projects.' });
  }
});

// 2. Create Studio Project
router.post('/api/studio/projects', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const orgId = req.user?.orgId || 'org_default';
    const userId = req.user!.id;
    const { name, description } = req.body;

    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Field "name" string is required.' });
    }

    const meta = await createStudioProject({
      tenantId,
      orgId,
      name,
      description,
      createdBy: userId,
    });

    logSecurityAudit('PRIVILEGED_ADMIN_ACTION', req, { action: 'CREATE_STUDIO_PROJECT', projectId: meta.id });
    res.json({ success: true, project: meta });
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to create Studio project.' });
  }
});

// 3. Get Studio Project Meta + IR
router.get('/api/studio/projects/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const result = await getStudioProjectIr(req.params.id, tenantId);

    if (!result) {
      return res.status(404).json({ error: 'Studio project not found or access denied.' });
    }

    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to load Studio project.' });
  }
});

// 4. Save Studio Project IR (With Optimistic Concurrency Control OCC)
router.put('/api/studio/projects/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const userId = req.user!.id;
    const { baseRevisionNumber, updatedIr, changeSummary } = req.body;

    if (typeof baseRevisionNumber !== 'number' || !updatedIr) {
      return res.status(400).json({
        error: 'Fields "baseRevisionNumber" (number) and "updatedIr" (object) are required.',
      });
    }

    const saveResult = await saveStudioProjectIr({
      projectId: req.params.id,
      tenantId,
      authorId: userId,
      baseRevisionNumber,
      updatedIr,
      changeSummary: changeSummary || 'Visual canvas edit',
    });

    if (saveResult.conflict) {
      return res.status(409).json({
        error: 'CONCURRENCY_CONFLICT: Base revision is stale. Project was modified by another session.',
        activeRevisionNumber: saveResult.newRevisionNumber,
      });
    }

    res.json({ success: true, ...saveResult });
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to save Studio project.' });
  }
});

// 5. Studio AI Copilot (Protected by AI Governance Gate)
router.post('/api/studio/projects/:id/copilot', aiGovernanceGate, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const { prompt, scope, currentIr } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Field "prompt" is required.' });
    }

    const copilotRes = await processStudioCopilotRequest({
      projectId: req.params.id,
      tenantId,
      prompt,
      scope: scope || 'ALL',
      currentIr,
    });

    res.json({ success: true, ...copilotRes });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Studio Copilot execution failed.' });
  }
});

// 6. Compile Studio IR to Code
router.post('/api/studio/projects/:id/compile', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const projectData = await getStudioProjectIr(req.params.id, tenantId);

    if (!projectData) {
      return res.status(404).json({ error: 'Studio project not found.' });
    }

    const compiled = compileStudioIr(projectData.ir);
    const drizzleCode = generateDrizzleSchemaCode(projectData.ir.schema);
    const schemaValidation = validateStudioSchemaModel(projectData.ir.schema);
    const flowValidation = validateStudioFlowGraph(projectData.ir.flows);

    res.json({
      success: true,
      compiled,
      drizzleCode,
      schemaValidation,
      flowValidation,
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Studio compilation failed.' });
  }
});

// 7. Promote Studio Project to Code / AI Workspace
router.post('/api/studio/projects/:id/promote', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const userId = req.user!.id;
    const { targetBranch } = req.body;

    const promoResult = await promoteStudioProjectToWorkspace({
      projectId: req.params.id,
      tenantId,
      promotedBy: userId,
      targetBranch,
    });

    logSecurityAudit('PRIVILEGED_ADMIN_ACTION', req, {
      action: 'PROMOTE_STUDIO_PROJECT',
      projectId: req.params.id,
      workspaceProjectId: promoResult.workspaceProjectId,
    });

    res.json({ success: true, ...promoResult });
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Studio promotion failed.' });
  }
});

// 8. Bounded Code Importer
router.post('/api/studio/projects/:id/import', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const { code } = req.body;

    const importRes = importCodeToStudioSubset(code, req.params.id, tenantId);
    res.json({ success: true, ...importRes });
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Studio code import failed.' });
  }
});

// 9. Simulate Flow Execution
router.post('/api/studio/projects/:id/simulate-flow', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { flowGraph, initialInput } = req.body;
    const simRes = simulateFlowExecution(flowGraph, initialInput);
    res.json({ success: true, ...simRes });
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Flow simulation failed.' });
  }
});

export default router;
