import { 
  Warehouse, ProductStock, InventoryTransaction, Courier, Shipment, 
  CodCollection, ReturnOrder, ReturnItem, OrderTimelineEvent, SystemNotification, AuditLog 
} from "../src/db/schema";
import { CreateShipmentPayload, RemitCodPayload, ReturnRequestPayload, AdjustStockPayload } from "./enterprise-interfaces";

// High-performance Enterprise in-memory DB instances synced with initial state
export class EnterpriseServices {
  private static warehouses: Warehouse[] = [
    { id: "w-col-1", name: "Colombo Central Depot", code: "COL-DEP-01", address: "Pettah, Colombo 11", phone: "0771234567", isActive: true, createdAt: new Date().toISOString() },
    { id: "w-knd-2", name: "Kandy Distribution Hub", code: "KND-HUB-02", address: "William Gopallawa Mawatha, Kandy", phone: "0772345678", isActive: true, createdAt: new Date().toISOString() },
    { id: "w-gal-3", name: "Galle Costal Depot", code: "GAL-DEP-03", address: "Matara Road, Galle", phone: "0773456789", isActive: true, createdAt: new Date().toISOString() }
  ];

  private static couriers: Courier[] = [
    { id: "c-koo-1", name: "Koombiyo Logistics", code: "KOOMBIYO", contactPhone: "0115999555", baseWpRate: 350.00, baseOutstationRate: 450.00, isActive: true, createdAt: new Date().toISOString() },
    { id: "c-dom-2", name: "Domex Express", code: "DOMEX", contactPhone: "0117555666", baseWpRate: 320.00, baseOutstationRate: 430.00, isActive: true, createdAt: new Date().toISOString() },
    { id: "c-pro-3", name: "Pronto Lanka", code: "PRONTO", contactPhone: "0112575454", baseWpRate: 380.00, baseOutstationRate: 480.00, isActive: true, createdAt: new Date().toISOString() },
    { id: "c-far-4", name: "Fardar Express", code: "FARDAR", contactPhone: "0114000300", baseWpRate: 340.00, baseOutstationRate: 440.00, isActive: true, createdAt: new Date().toISOString() }
  ];

  private static stocks: ProductStock[] = [];
  private static transactions: InventoryTransaction[] = [];
  private static shipments: Shipment[] = [];
  private static codCollections: CodCollection[] = [];
  private static returns: ReturnOrder[] = [];
  private static returnItems: ReturnItem[] = [];
  private static timelineEvents: OrderTimelineEvent[] = [];
  private static notifications: SystemNotification[] = [
    {
      id: "n-1",
      type: "LOW_STOCK",
      title: "Low Stock Alert: Galle Saffron Powder",
      description: "Warehouse stock for Galle Saffron Powder is currently at 3 units, falling below safety threshold 5.",
      resolved: false,
      createdAt: new Date().toISOString()
    },
    {
      id: "n-2",
      type: "PAYMENT_RECEIVED",
      title: "COD Remittance Confirmed",
      description: "Koombiyo Logistics remitted LKR 145,200 for 12 reconciled Colombo orders.",
      resolved: false,
      createdAt: new Date().toISOString()
    }
  ];

  private static auditLogs: AuditLog[] = [
    {
      id: "a-1",
      userEmail: "sachithakaumina0@gmail.com",
      userRole: "Super Admin",
      actionType: "SYSTEM_INITIALIZE",
      moduleName: "SYSTEM_ENGINE",
      actionDetails: "LakNexus enterprise submodules & RBAC architecture securely initialized.",
      ipAddress: "127.0.0.1",
      createdAt: new Date().toISOString()
    }
  ];

  // Helper: Bootstraps local mock database matching standard products
  public static ensureStockSetup(products: Array<{ id: string; name: string; stock: number }>) {
    if (this.stocks.length > 0) return;
    
    products.forEach((p) => {
      this.stocks.push({
        id: `s-id-${p.id}`,
        productId: p.id,
        warehouseId: "w-col-1",
        stockQuantity: p.stock,
        lowStockThreshold: 5,
        lastUpdatedAt: new Date().toISOString()
      });

      // record initial stock transaction
      this.transactions.push({
        id: `t-init-${p.id}`,
        productId: p.id,
        warehouseId: "w-col-1",
        transactionType: "RESTOCK",
        quantity: p.stock,
        balanceAfter: p.stock,
        notes: "Initial bootstrap stock migration to Colombo Depot.",
        createdByUserId: "sachithakaumina0@gmail.com",
        createdAt: new Date().toISOString()
      });
    });
  }

  // FEATURE 01: INVENTORY MANAGEMENT
  public static getWarehouses(): Warehouse[] {
    return this.warehouses;
  }

  public static getStocks(): ProductStock[] {
    return this.stocks;
  }

  public static getTransactions(): InventoryTransaction[] {
    return this.transactions;
  }

  public static adjustStock(payload: AdjustStockPayload): { success: boolean; stock: ProductStock } {
    let item = this.stocks.find(s => s.productId === payload.productId && s.warehouseId === payload.warehouseId);
    
    if (!item) {
      item = {
        id: `s-rand-${Date.now()}`,
        productId: payload.productId,
        warehouseId: payload.warehouseId,
        stockQuantity: 0,
        lowStockThreshold: 5,
        lastUpdatedAt: new Date().toISOString()
      };
      this.stocks.push(item);
    }

    const previousQty = item.stockQuantity;
    item.stockQuantity = Math.max(0, item.stockQuantity + payload.adjustmentQty);
    item.lastUpdatedAt = new Date().toISOString();

    // Log transaction
    const tx: InventoryTransaction = {
      id: `tx-id-${Date.now()}`,
      productId: payload.productId,
      warehouseId: payload.warehouseId,
      transactionType: payload.transactionType,
      quantity: payload.adjustmentQty,
      balanceAfter: item.stockQuantity,
      notes: payload.notes || "Operation adjustment.",
      createdByUserId: payload.userId,
      createdAt: new Date().toISOString()
    };
    this.transactions.push(tx);

    // Dynamic Threshold check for notifications
    if (item.stockQuantity <= item.lowStockThreshold) {
      this.addNotification(
        "LOW_STOCK",
        `Low Stock Warning: Product ID ${payload.productId}`,
        `Stock falls to ${item.stockQuantity} at Warehouse ${payload.warehouseId}. Sourcing is highly advised.`
      );
    }

    // Log audit
    this.logAudit(
      "sachithakaumina0@gmail.com",
      "Super Admin",
      "STOCK_ADJUSTMENT",
      "INVENTORY",
      `Adjusted product stock ${payload.productId} by ${payload.adjustmentQty}. Balance left: ${item.stockQuantity}.`
    );

    return { success: true, stock: item };
  }

  // FEATURE 02: COURIOR & SHIPPING
  public static getCouriers(): Courier[] {
    return this.couriers;
  }

  public static getShipments(): Shipment[] {
    return this.shipments;
  }

  public static registerShipment(payload: CreateShipmentPayload): Shipment {
    const existing = this.shipments.find(s => s.orderId === payload.orderId);
    if (existing) {
      existing.courierId = payload.courierId;
      if (payload.trackingNumber) existing.trackingNumber = payload.trackingNumber;
      if (payload.shippingCost) existing.shippingCost = payload.shippingCost;
      existing.shippingStatus = "DISPATCHED";
      existing.dispatchDate = new Date().toISOString().split("T")[0];
      return existing;
    }

    const newShip: Shipment = {
      id: `ship-${Date.now()}`,
      orderId: payload.orderId,
      courierId: payload.courierId,
      trackingNumber: payload.trackingNumber || `LK-${Date.now().toString().slice(6)}`,
      shippingCost: payload.shippingCost || 380,
      shippingStatus: "DISPATCHED",
      dispatchDate: new Date().toISOString().split("T")[0],
      createdAt: new Date().toISOString()
    };
    this.shipments.push(newShip);

    // timeline register
    this.addTimeline(
      payload.orderId,
      "SHIPPED",
      `Order processed and dispatched under tracking serial: ${newShip.trackingNumber}`,
      "sachithakaumina0@gmail.com"
    );

    // Log audit
    this.logAudit(
      "sachithakaumina0@gmail.com",
      "Super Admin",
      "DISPATCH_SHIPMENT",
      "SHIPPING",
      `Handed order ${payload.orderId} to selected carrier with tracking code ${newShip.trackingNumber}`
    );

    return newShip;
  }

  // FEATURE 03: CASH-ON-DELIVERY FINANCE
  public static getCodCollections(): CodCollection[] {
    return this.codCollections;
  }

  public static setupCodRecord(orderId: string, amount: number) {
    if (this.codCollections.some(c => c.orderId === orderId)) return;
    this.codCollections.push({
      id: `cod-${Date.now()}`,
      orderId,
      codAmount: amount,
      amountCollected: 0,
      remittanceStatus: "PENDING_REMITTANCE",
      createdAt: new Date().toISOString()
    });
  }

  public static remitCod(payload: RemitCodPayload): CodCollection {
    let record = this.codCollections.find(c => c.orderId === payload.orderId);
    if (!record) {
      record = {
        id: `cod-${Date.now()}`,
        orderId: payload.orderId,
        codAmount: payload.amountCollected,
        amountCollected: 0,
        remittanceStatus: "PENDING_REMITTANCE",
        createdAt: new Date().toISOString()
      };
      this.codCollections.push(record);
    }

    record.amountCollected = payload.amountCollected;
    record.courierReferenceNo = payload.courierReferenceNo || `REF-${Date.now().toString().slice(6)}`;
    record.remittanceStatus = record.amountCollected >= record.codAmount ? "FULLY_REMITTED" : "PARTIALLY_REMITTED";
    record.remittedAt = new Date().toISOString();
    record.reconciliationNotes = payload.reconciliationNotes || "Auto reconciled via ERP audit pipeline.";

    // notify finance staff
    this.addNotification(
      "PAYMENT_RECEIVED",
      `COD Reconciled - Order ${payload.orderId}`,
      `Received LKR ${payload.amountCollected.toLocaleString()} remittance from carrier reference ${record.courierReferenceNo}.`
    );

    // Log audit
    this.logAudit(
      "sachithakaumina0@gmail.com",
      "Super Admin",
      "COD_REMITTANCE",
      "FINANCE",
      `Reconciled LKR ${payload.amountCollected} against COD expected value LKR ${record.codAmount} for order ID: ${payload.orderId}`
    );

    return record;
  }

  // FEATURE 04: RETURN RTO
  public static getReturns(): ReturnOrder[] {
    return this.returns;
  }

  public static createReturn(payload: ReturnRequestPayload): ReturnOrder {
    const existing = this.returns.find(r => r.orderId === payload.orderId);
    if (existing) return existing;

    const returnId = `ret-${Date.now()}`;
    const ret: ReturnOrder = {
      id: returnId,
      orderId: payload.orderId,
      returnReason: payload.returnReason,
      returnStatus: "APPROVED",
      refundStatus: payload.refundAmount ? "PENDING_APPROVAL" : "NOT_REFUNDED",
      refundAmount: payload.refundAmount || 0,
      createdByUserId: "sachithakaumina0@gmail.com",
      createdAt: new Date().toISOString()
    };
    this.returns.push(ret);

    payload.items.forEach((item) => {
      this.returnItems.push({
        id: `ret-item-${Date.now()}-${Math.floor(Math.random()*100)}`,
        returnId,
        productId: item.productId,
        quantity: item.quantity,
        isRestocked: true,
        restockedWarehouseId: item.restockWarehouseId || "w-col-1"
      });

      // Automatically restore stock as per rules!
      this.adjustStock({
        productId: item.productId,
        warehouseId: item.restockWarehouseId || "w-col-1",
        adjustmentQty: item.quantity,
        transactionType: "RESTORATION",
        notes: `Automatically restored from Approved Return Request: ${payload.orderId}`,
        userId: "sachithakaumina0@gmail.com"
      });
    });

    this.addTimeline(
      payload.orderId,
      "RETURNED",
      `RTO returned: Sourcing inventory restored back to dispatch warehouse. Reason: ${payload.returnReason}`,
      "sachithakaumina0@gmail.com"
    );

    // Log audit
    this.logAudit(
      "sachithakaumina0@gmail.com",
      "Super Admin",
      "PROCESS_RETURN",
      "RETURNS",
      `Processed return & RTO for order ${payload.orderId}. Restored raw item stock back to warehouse.`
    );

    return ret;
  }

  // FEATURE 06: AUDIT SERVICES
  public static getAuditLogs(): AuditLog[] {
    return this.auditLogs;
  }

  public static logAudit(email: string, role: string, actionType: string, moduleName: string, actionDetails: string) {
    this.auditLogs.unshift({
      id: `audit-${Date.now()}-${Math.floor(Math.random()*1000)}`,
      userEmail: email,
      userRole: role,
      actionType,
      moduleName,
      actionDetails,
      ipAddress: "192.168.1.101",
      createdAt: new Date().toISOString()
    });
  }

  // FEATURE 07: NOTIFICATIONS HELPERS
  public static getNotifications(): SystemNotification[] {
    return this.notifications;
  }

  public static addNotification(type: any, title: string, description: string) {
    this.notifications.unshift({
      id: `notify-${Date.now()}`,
      type,
      title,
      description,
      resolved: false,
      createdAt: new Date().toISOString()
    });
  }

  public static resolveNotification(id: string) {
    const n = this.notifications.find(item => item.id === id);
    if (n) n.resolved = true;
  }

  // FEATURE 09: ORDER HISTORY TIMELINE EVENT RECORDER
  public static getTimeline(orderId: string): OrderTimelineEvent[] {
    const list = this.timelineEvents.filter(t => t.orderId === orderId);
    if (list.length === 0) {
      // Auto build historical checklist to make chronological view populated!
      return [
        { id: `tm-1-${orderId}`, orderId, eventType: "CREATED", eventDescription: "Order entered via social media intake scraping pipeline.", loggedBy: "LakNexus AI Engine", createdAt: new Date(Date.now() - 36000000).toISOString() },
        { id: `tm-2-${orderId}`, orderId, eventType: "CONFIRMED", eventDescription: "Customer call verification succeeded. Stock allocation authorized.", loggedBy: "sachithakaumina0@gmail.com", createdAt: new Date(Date.now() - 32000000).toISOString() }
      ];
    }
    return list;
  }

  public static addTimeline(orderId: string, type: any, desc: string, user: string) {
    this.timelineEvents.push({
      id: `tm-${Date.now()}`,
      orderId,
      eventType: type,
      eventDescription: desc,
      loggedBy: user,
      createdAt: new Date().toISOString()
    });
  }
}
