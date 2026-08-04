/**
 * OPROX Real Estate Phase 1 — Express REST Router
 * Authoritative REST endpoints for Portfolios, Properties, Asset Hierarchy, Owners, and Operational Dashboard.
 */

import { Router } from 'express';
import { requireAuth, AuthRequest } from './auth';
import { logSecurityAudit } from './audit';
import {
  listPortfolios,
  getPortfolio,
  createPortfolio,
  updatePortfolio,
  deletePortfolio,
  listProperties,
  getProperty,
  createProperty,
  updateProperty,
  deleteProperty,
  listBuildings,
  createBuilding,
  deleteBuilding,
  listFloors,
  createFloor,
  deleteFloor,
  listUnits,
  getUnit,
  createUnit,
  updateUnit,
  deleteUnit,
  listOwners,
  createOwner,
  associateOwnerWithProperty,
  listPropertyOwners,
  getRealEstateDashboardMetrics,
} from '../src/lib/realestate/realEstateStore';

const router = Router();

// ── DASHBOARD ──────────────────────────────────────────────────────────────

router.get('/api/real-estate/dashboard', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const metrics = await getRealEstateDashboardMetrics(tenantId);
    res.json({ success: true, metrics });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch Real Estate dashboard metrics.' });
  }
});

// ── PORTFOLIOS ─────────────────────────────────────────────────────────────

router.get('/api/real-estate/portfolios', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const portfolios = await listPortfolios(tenantId);
    res.json({ success: true, portfolios });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to list portfolios.' });
  }
});

router.post('/api/real-estate/portfolios', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const userId = req.user!.id;
    const { name, code, description } = req.body;

    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Field "name" is required and must be a string.' });
    }

    const portfolio = await createPortfolio({
      tenantId,
      name,
      code,
      description,
      createdBy: userId,
    });

    logSecurityAudit('PRIVILEGED_ADMIN_ACTION', req, { action: 'CREATE_RE_PORTFOLIO', portfolioId: portfolio.id });
    res.json({ success: true, portfolio });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to create portfolio.' });
  }
});

router.get('/api/real-estate/portfolios/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const portfolio = await getPortfolio(tenantId, req.params.id);
    if (!portfolio) {
      return res.status(404).json({ error: 'Portfolio not found or access denied.' });
    }
    res.json({ success: true, portfolio });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch portfolio.' });
  }
});

router.put('/api/real-estate/portfolios/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const existing = await getPortfolio(tenantId, req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Portfolio not found or access denied.' });
    }

    const updated = await updatePortfolio(tenantId, req.params.id, req.body);
    res.json({ success: true, portfolio: updated });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to update portfolio.' });
  }
});

router.delete('/api/real-estate/portfolios/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const success = await deletePortfolio(tenantId, req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Portfolio not found or access denied.' });
    }
    logSecurityAudit('PRIVILEGED_ADMIN_ACTION', req, { action: 'DELETE_RE_PORTFOLIO', portfolioId: req.params.id });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to delete portfolio.' });
  }
});

// ── PROPERTIES ─────────────────────────────────────────────────────────────

router.get('/api/real-estate/properties', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const { portfolioId, type, status, city, search } = req.query;

    const properties = await listProperties(tenantId, {
      portfolioId: portfolioId as string,
      type: type as string,
      status: status as string,
      city: city as string,
      search: search as string,
    });

    res.json({ success: true, properties });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to list properties.' });
  }
});

router.post('/api/real-estate/properties', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const userId = req.user!.id;
    const {
      name,
      type,
      portfolioId,
      status,
      description,
      addressRegion,
      addressCity,
      addressDistrict,
      addressStreet,
      postalCode,
      buildingNumber,
      additionalNumber,
      latitude,
      longitude,
      totalAreaSqm,
      builtUpAreaSqm,
      yearBuilt,
    } = req.body;

    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Field "name" is required and must be a string.' });
    }
    if (!type || typeof type !== 'string') {
      return res.status(400).json({ error: 'Field "type" is required and must be a string.' });
    }

    const property = await createProperty({
      tenantId,
      portfolioId,
      name,
      type,
      status,
      description,
      addressRegion,
      addressCity,
      addressDistrict,
      addressStreet,
      postalCode,
      buildingNumber,
      additionalNumber,
      latitude: latitude ? String(latitude) : undefined,
      longitude: longitude ? String(longitude) : undefined,
      totalAreaSqm: totalAreaSqm ? String(totalAreaSqm) : undefined,
      builtUpAreaSqm: builtUpAreaSqm ? String(builtUpAreaSqm) : undefined,
      yearBuilt: yearBuilt ? Number(yearBuilt) : undefined,
      createdBy: userId,
    });

    logSecurityAudit('PRIVILEGED_ADMIN_ACTION', req, { action: 'CREATE_RE_PROPERTY', propertyId: property.id });
    res.json({ success: true, property });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to create property.' });
  }
});

router.get('/api/real-estate/properties/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const property = await getProperty(tenantId, req.params.id);
    if (!property) {
      return res.status(404).json({ error: 'Property not found or access denied.' });
    }
    res.json({ success: true, property });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch property.' });
  }
});

router.put('/api/real-estate/properties/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const existing = await getProperty(tenantId, req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Property not found or access denied.' });
    }

    const updated = await updateProperty(tenantId, req.params.id, req.body);
    res.json({ success: true, property: updated });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to update property.' });
  }
});

router.delete('/api/real-estate/properties/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const success = await deleteProperty(tenantId, req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Property not found or access denied.' });
    }
    logSecurityAudit('PRIVILEGED_ADMIN_ACTION', req, { action: 'DELETE_RE_PROPERTY', propertyId: req.params.id });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to delete property.' });
  }
});

// ── BUILDINGS & FLOORS ─────────────────────────────────────────────────────

router.get('/api/real-estate/properties/:propertyId/buildings', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const buildings = await listBuildings(tenantId, req.params.propertyId);
    res.json({ success: true, buildings });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to list buildings.' });
  }
});

router.post('/api/real-estate/properties/:propertyId/buildings', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const property = await getProperty(tenantId, req.params.propertyId);
    if (!property) {
      return res.status(404).json({ error: 'Parent property not found or access denied.' });
    }

    const { name, code, totalFloors } = req.body;
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Field "name" is required.' });
    }

    const building = await createBuilding({
      tenantId,
      propertyId: req.params.propertyId,
      name,
      code,
      totalFloors: totalFloors ? Number(totalFloors) : 1,
    });

    res.json({ success: true, building });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to create building.' });
  }
});

router.delete('/api/real-estate/buildings/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const success = await deleteBuilding(tenantId, req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Building not found or access denied.' });
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to delete building.' });
  }
});

router.get('/api/real-estate/buildings/:buildingId/floors', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const floors = await listFloors(tenantId, req.params.buildingId);
    res.json({ success: true, floors });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to list floors.' });
  }
});

router.post('/api/real-estate/buildings/:buildingId/floors', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const { floorNumber, name } = req.body;

    if (floorNumber === undefined || !name) {
      return res.status(400).json({ error: 'Fields "floorNumber" and "name" are required.' });
    }

    const floor = await createFloor({
      tenantId,
      buildingId: req.params.buildingId,
      floorNumber: Number(floorNumber),
      name: String(name),
    });

    res.json({ success: true, floor });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to create floor.' });
  }
});

router.delete('/api/real-estate/floors/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const success = await deleteFloor(tenantId, req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Floor not found or access denied.' });
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to delete floor.' });
  }
});

// ── UNITS ──────────────────────────────────────────────────────────────────

router.get('/api/real-estate/units', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const { propertyId } = req.query;
    const units = await listUnits(tenantId, propertyId as string);
    res.json({ success: true, units });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to list units.' });
  }
});

router.post('/api/real-estate/units', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const {
      propertyId,
      buildingId,
      floorId,
      unitNumber,
      unitType,
      status,
      areaSqm,
      bedrooms,
      bathrooms,
      rentPriceSar,
      salePriceSar,
      description,
    } = req.body;

    if (!propertyId || !unitNumber) {
      return res.status(400).json({ error: 'Fields "propertyId" and "unitNumber" are required.' });
    }

    const unit = await createUnit({
      tenantId,
      propertyId,
      buildingId,
      floorId,
      unitNumber,
      unitType,
      status,
      areaSqm: areaSqm ? String(areaSqm) : undefined,
      bedrooms: bedrooms ? Number(bedrooms) : undefined,
      bathrooms: bathrooms ? Number(bathrooms) : undefined,
      rentPriceSar: rentPriceSar ? String(rentPriceSar) : undefined,
      salePriceSar: salePriceSar ? String(salePriceSar) : undefined,
      description,
    });

    res.json({ success: true, unit });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to create unit.' });
  }
});

router.get('/api/real-estate/units/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const unit = await getUnit(tenantId, req.params.id);
    if (!unit) {
      return res.status(404).json({ error: 'Unit not found or access denied.' });
    }
    res.json({ success: true, unit });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch unit.' });
  }
});

router.put('/api/real-estate/units/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const existing = await getUnit(tenantId, req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Unit not found or access denied.' });
    }

    const updated = await updateUnit(tenantId, req.params.id, req.body);
    res.json({ success: true, unit: updated });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to update unit.' });
  }
});

router.delete('/api/real-estate/units/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const success = await deleteUnit(tenantId, req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Unit not found or access denied.' });
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to delete unit.' });
  }
});

// ── OWNERS ─────────────────────────────────────────────────────────────────

router.get('/api/real-estate/owners', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const owners = await listOwners(tenantId);
    res.json({ success: true, owners });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to list owners.' });
  }
});

router.post('/api/real-estate/owners', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const { fullName, ownerType, nationalIdOrCr, email, phone } = req.body;

    if (!fullName || typeof fullName !== 'string') {
      return res.status(400).json({ error: 'Field "fullName" is required.' });
    }

    const owner = await createOwner({
      tenantId,
      fullName,
      ownerType,
      nationalIdOrCr,
      email,
      phone,
    });

    logSecurityAudit('PRIVILEGED_ADMIN_ACTION', req, { action: 'CREATE_RE_OWNER', ownerId: owner.id });
    res.json({ success: true, owner });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to create owner.' });
  }
});

router.post('/api/real-estate/property-owners', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const { propertyId, ownerId, ownershipPercentage, isPrimaryOwner } = req.body;

    if (!propertyId || !ownerId) {
      return res.status(400).json({ error: 'Fields "propertyId" and "ownerId" are required.' });
    }

    const association = await associateOwnerWithProperty({
      tenantId,
      propertyId,
      ownerId,
      ownershipPercentage: ownershipPercentage ? String(ownershipPercentage) : '100',
      isPrimaryOwner,
    });

    res.json({ success: true, association });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to link property owner.' });
  }
});

router.get('/api/real-estate/properties/:propertyId/owners', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const owners = await listPropertyOwners(tenantId, req.params.propertyId);
    res.json({ success: true, owners });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to list property owners.' });
  }
});

export default router;
