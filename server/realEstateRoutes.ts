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
import {
  listContacts,
  getContact,
  createContact,
  updateContact,
  deleteContact,
  listTenants,
  getTenant,
  createTenant,
  updateTenant,
  listLeases,
  getLease,
  createLease,
  transitionLeaseStatus,
  renewLease,
  generateRentSchedules,
  listLeaseSchedules,
  listLeaseCharges,
  createLeaseCharge,
  createPayment,
  listPayments,
  getPayment,
  autoAllocatePayment,
  createSecurityDeposit,
  listSecurityDeposits,
  processSecurityDepositRefund,
  listLeaseEvents,
  uploadLeaseDocument,
  listLeaseDocuments,
  getLeaseFinancialSummary,
  getPhase2DashboardMetrics,
} from '../src/lib/realestate/realEstatePhase2Store';

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

// ── PHASE 2: CONTACTS ──────────────────────────────────────────────────────

router.get('/api/real-estate/contacts', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const contacts = await listContacts(tenantId);
    res.json({ success: true, contacts });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to list contacts.' });
  }
});

router.post('/api/real-estate/contacts', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const contact = await createContact({ ...req.body, tenantId });
    logSecurityAudit('PRIVILEGED_ADMIN_ACTION', req, { action: 'CREATE_RE_CONTACT', contactId: contact.id });
    res.json({ success: true, contact });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to create contact.' });
  }
});

router.get('/api/real-estate/contacts/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const contact = await getContact(tenantId, req.params.id);
    if (!contact) return res.status(404).json({ error: 'Contact not found.' });
    res.json({ success: true, contact });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch contact.' });
  }
});

router.put('/api/real-estate/contacts/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const contact = await updateContact(tenantId, req.params.id, req.body);
    if (!contact) return res.status(404).json({ error: 'Contact not found.' });
    res.json({ success: true, contact });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to update contact.' });
  }
});

router.delete('/api/real-estate/contacts/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const deleted = await deleteContact(tenantId, req.params.id);
    res.json({ success: true, deleted });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to delete contact.' });
  }
});

// ── PHASE 2: TENANTS ───────────────────────────────────────────────────────

router.get('/api/real-estate/tenants', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const tenants = await listTenants(tenantId);
    res.json({ success: true, tenants });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to list real estate tenants.' });
  }
});

router.post('/api/real-estate/tenants', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const tenantRecord = await createTenant({ ...req.body, tenantId });
    logSecurityAudit('PRIVILEGED_ADMIN_ACTION', req, { action: 'CREATE_RE_TENANT', tenantRecordId: tenantRecord.id });
    res.json({ success: true, tenant: tenantRecord });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to create real estate tenant.' });
  }
});

router.get('/api/real-estate/tenants/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const tenantRecord = await getTenant(tenantId, req.params.id);
    if (!tenantRecord) return res.status(404).json({ error: 'Tenant record not found.' });
    res.json({ success: true, tenant: tenantRecord });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch tenant.' });
  }
});

router.put('/api/real-estate/tenants/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const tenantRecord = await updateTenant(tenantId, req.params.id, req.body);
    if (!tenantRecord) return res.status(404).json({ error: 'Tenant record not found.' });
    res.json({ success: true, tenant: tenantRecord });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to update tenant.' });
  }
});

// ── PHASE 2: LEASES ────────────────────────────────────────────────────────

router.get('/api/real-estate/leases', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const { propertyId, reTenantId, status } = req.query;
    const leases = await listLeases(tenantId, {
      propertyId: propertyId ? String(propertyId) : undefined,
      reTenantId: reTenantId ? String(reTenantId) : undefined,
      status: status ? String(status) : undefined,
    });
    res.json({ success: true, leases });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to list leases.' });
  }
});

router.post('/api/real-estate/leases', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const userId = req.user!.id;
    const lease = await createLease({ ...req.body, tenantId, createdBy: userId });
    logSecurityAudit('PRIVILEGED_ADMIN_ACTION', req, { action: 'CREATE_RE_LEASE', leaseId: lease.id });
    res.json({ success: true, lease });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to create lease.' });
  }
});

router.get('/api/real-estate/leases/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const lease = await getLease(tenantId, req.params.id);
    if (!lease) return res.status(404).json({ error: 'Lease not found.' });
    res.json({ success: true, lease });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch lease.' });
  }
});

router.put('/api/real-estate/leases/:id/status', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const userId = req.user!.id;
    const { status, notes, terminationReason } = req.body;

    if (!status) return res.status(400).json({ error: 'Field "status" is required.' });

    const lease = await transitionLeaseStatus(tenantId, req.params.id, status, userId, {
      notes,
      terminationReason,
    });

    logSecurityAudit('PRIVILEGED_ADMIN_ACTION', req, { action: 'TRANSITION_RE_LEASE', leaseId: lease.id, status });
    res.json({ success: true, lease });
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Lease status transition failed.' });
  }
});

router.post('/api/real-estate/leases/:id/renew', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const userId = req.user!.id;
    const { startDate, endDate, contractValueSar, paymentFrequency } = req.body;

    const childLease = await renewLease(tenantId, req.params.id, {
      startDate,
      endDate,
      contractValueSar,
      paymentFrequency,
      actorId: userId,
    });

    logSecurityAudit('PRIVILEGED_ADMIN_ACTION', req, { action: 'RENEW_RE_LEASE', parentLeaseId: req.params.id, childLeaseId: childLease.id });
    res.json({ success: true, lease: childLease });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to renew lease.' });
  }
});

router.post('/api/real-estate/leases/:id/schedules/generate', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const schedules = await generateRentSchedules(tenantId, req.params.id);
    res.json({ success: true, schedules });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to generate rent schedules.' });
  }
});

router.get('/api/real-estate/leases/:id/schedules', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const schedules = await listLeaseSchedules(tenantId, req.params.id);
    res.json({ success: true, schedules });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to list lease schedules.' });
  }
});

router.get('/api/real-estate/leases/:id/charges', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const charges = await listLeaseCharges(tenantId, req.params.id);
    res.json({ success: true, charges });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to list lease charges.' });
  }
});

router.post('/api/real-estate/leases/:id/charges', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const charge = await createLeaseCharge({ ...req.body, tenantId, leaseId: req.params.id });
    res.json({ success: true, charge });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to create lease charge.' });
  }
});

router.get('/api/real-estate/leases/:id/events', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const events = await listLeaseEvents(tenantId, req.params.id);
    res.json({ success: true, events });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to list lease events.' });
  }
});

router.get('/api/real-estate/leases/:id/documents', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const documents = await listLeaseDocuments(tenantId, req.params.id);
    res.json({ success: true, documents });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to list lease documents.' });
  }
});

router.post('/api/real-estate/leases/:id/documents', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const userId = req.user!.id;
    const document = await uploadLeaseDocument({ ...req.body, tenantId, leaseId: req.params.id, uploadedBy: userId });
    res.json({ success: true, document });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to upload lease document.' });
  }
});

router.get('/api/real-estate/leases/:id/financials', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const summary = await getLeaseFinancialSummary(tenantId, req.params.id);
    res.json({ success: true, summary });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch lease financial summary.' });
  }
});

// ── PHASE 2: PAYMENTS ──────────────────────────────────────────────────────

router.get('/api/real-estate/payments', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const { leaseId } = req.query;
    const payments = await listPayments(tenantId, leaseId ? String(leaseId) : undefined);
    res.json({ success: true, payments });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to list payments.' });
  }
});

router.post('/api/real-estate/payments', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const userId = req.user!.id;
    const payment = await createPayment({ ...req.body, tenantId, createdBy: userId });
    logSecurityAudit('PRIVILEGED_ADMIN_ACTION', req, { action: 'CREATE_RE_PAYMENT', paymentId: payment.id });
    res.json({ success: true, payment });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to record payment.' });
  }
});

router.get('/api/real-estate/payments/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const payment = await getPayment(tenantId, req.params.id);
    if (!payment) return res.status(404).json({ error: 'Payment not found.' });
    res.json({ success: true, payment });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch payment.' });
  }
});

router.post('/api/real-estate/payments/:id/allocate', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const { leaseId } = req.body;
    if (!leaseId) return res.status(400).json({ error: 'Field "leaseId" is required.' });
    const allocatedAmount = await autoAllocatePayment(tenantId, req.params.id, leaseId);
    res.json({ success: true, allocatedAmount });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to allocate payment.' });
  }
});

// ── PHASE 2: SECURITY DEPOSITS ──────────────────────────────────────────────

router.get('/api/real-estate/security-deposits', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const { leaseId } = req.query;
    const deposits = await listSecurityDeposits(tenantId, leaseId ? String(leaseId) : undefined);
    res.json({ success: true, deposits });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to list security deposits.' });
  }
});

router.post('/api/real-estate/security-deposits', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const deposit = await createSecurityDeposit({ ...req.body, tenantId });
    res.json({ success: true, deposit });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to create security deposit.' });
  }
});

router.post('/api/real-estate/security-deposits/:id/refund', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const { deductionsSar, notes } = req.body;
    const deposit = await processSecurityDepositRefund(tenantId, req.params.id, Number(deductionsSar || 0), notes);
    logSecurityAudit('PRIVILEGED_ADMIN_ACTION', req, { action: 'REFUND_RE_SECURITY_DEPOSIT', depositId: deposit.id });
    res.json({ success: true, deposit });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to process deposit refund.' });
  }
});

// ── PHASE 2 DASHBOARD METRICS ──────────────────────────────────────────────

router.get('/api/real-estate/phase2-dashboard', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const metrics = await getPhase2DashboardMetrics(tenantId);
    res.json({ success: true, metrics });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch Phase 2 dashboard metrics.' });
  }
});

export default router;
