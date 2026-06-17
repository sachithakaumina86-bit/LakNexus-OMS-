import { Router, Request, Response } from "express";
import { EnterpriseServices } from "./enterprise-services";

export const enterpriseRouter = Router();

// Setup stocks bootstrapping
enterpriseRouter.post("/setup", (req: Request, res: Response) => {
  const { products } = req.body;
  if (Array.isArray(products)) {
    EnterpriseServices.ensureStockSetup(products);
  }
  return res.json({ success: true, message: "Bootstrap setup completed." });
});

// FEATURE 01: Warehouses & Stock adjustments
enterpriseRouter.get("/warehouses", (req: Request, res: Response) => {
  return res.json(EnterpriseServices.getWarehouses());
});

enterpriseRouter.get("/stocks", (req: Request, res: Response) => {
  return res.json({
    stocks: EnterpriseServices.getStocks(),
    transactions: EnterpriseServices.getTransactions()
  });
});

enterpriseRouter.post("/stock/adjust", (req: Request, res: Response) => {
  const { productId, warehouseId, adjustmentQty, transactionType, notes } = req.body;
  if (!productId || !warehouseId || typeof adjustmentQty !== 'number') {
    return res.status(400).json({ error: "Missing required stock fields" });
  }

  const result = EnterpriseServices.adjustStock({
    productId,
    warehouseId,
    adjustmentQty,
    transactionType: transactionType || "MANUAL_ADJUSTMENT",
    notes,
    userId: "sachithakaumina0@gmail.com"
  });

  return res.json(result);
});

// FEATURE 02: Courier and Logistics Management
enterpriseRouter.get("/couriers", (req: Request, res: Response) => {
  return res.json(EnterpriseServices.getCouriers());
});

enterpriseRouter.get("/shipments", (req: Request, res: Response) => {
  return res.json(EnterpriseServices.getShipments());
});

enterpriseRouter.post("/shipment/register", (req: Request, res: Response) => {
  const { orderId, courierId, trackingNumber, shippingCost } = req.body;
  if (!orderId || !courierId) {
    return res.status(400).json({ error: "orderId and courierId are required." });
  }

  const result = EnterpriseServices.registerShipment({
    orderId,
    courierId,
    trackingNumber,
    shippingCost
  });

  return res.json({ success: true, shipment: result });
});

// FEATURE 03: Cash-On-Delivery
enterpriseRouter.get("/cod", (req: Request, res: Response) => {
  return res.json(EnterpriseServices.getCodCollections());
});

enterpriseRouter.post("/cod/remit", (req: Request, res: Response) => {
  const { orderId, amountCollected, courierReferenceNo, reconciliationNotes } = req.body;
  if (!orderId || typeof amountCollected !== 'number') {
    return res.status(400).json({ error: "orderId and amountCollected (number) are required." });
  }

  const result = EnterpriseServices.remitCod({
    orderId,
    amountCollected,
    courierReferenceNo,
    reconciliationNotes
  });

  return res.json({ success: true, cod: result });
});

// FEATURE 04: Returns & RTO Management
enterpriseRouter.get("/returns", (req: Request, res: Response) => {
  return res.json(EnterpriseServices.getReturns());
});

enterpriseRouter.post("/returns/create", (req: Request, res: Response) => {
  const { orderId, returnReason, refundAmount, items } = req.body;
  if (!orderId || !returnReason || !Array.isArray(items)) {
    return res.status(400).json({ error: "Missing return fields" });
  }

  const result = EnterpriseServices.createReturn({
    orderId,
    returnReason,
    refundAmount,
    items
  });

  return res.json({ success: true, returnOrder: result });
});

// FEATURE 06: Audit logs
enterpriseRouter.get("/audit-logs", (req: Request, res: Response) => {
  return res.json(EnterpriseServices.getAuditLogs());
});

// FEATURE 07: Notifications Resolver
enterpriseRouter.get("/notifications", (req: Request, res: Response) => {
  return res.json(EnterpriseServices.getNotifications());
});

enterpriseRouter.post("/notifications/resolve", (req: Request, res: Response) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: "Notification ID needed." });
  EnterpriseServices.resolveNotification(id);
  return res.json({ success: true });
});

// FEATURE 09: Cron events / timeline history
enterpriseRouter.get("/timeline/:orderId", (req: Request, res: Response) => {
  const orderId = req.params.orderId;
  return res.json(EnterpriseServices.getTimeline(orderId));
});
