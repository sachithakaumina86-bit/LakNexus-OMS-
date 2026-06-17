// ====================================================================
// LAKNEXUS ENTERPRISE OMS - DRIZZLE SCHEMA & TYPESCRIPT REPRESENTATION
// ====================================================================

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  address: string;
  phone: string;
  isActive: boolean;
  createdAt: string;
}

export interface Permission {
  id: number;
  moduleName: string;
  canCreate: boolean;
  canRead: boolean;
  canEdit: boolean;
  canDelete: boolean;
  roleId: number;
}

export interface Role {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  permissions?: Permission[];
}

export interface ProductStock {
  id: string;
  productId: string;
  warehouseId: string;
  stockQuantity: number;
  lowStockThreshold: number;
  lastUpdatedAt: string;
}

export interface InventoryTransaction {
  id: string;
  productId: string;
  warehouseId: string;
  transactionType: "DEDUCTION" | "RESTORATION" | "RESTOCK" | "MANUAL_ADJUSTMENT";
  quantity: number;
  balanceAfter: number;
  notes: string;
  createdByUserId: string;
  createdAt: string;
}

export interface Courier {
  id: string;
  name: string;
  code: string;
  contactPhone: string;
  baseWpRate: number;
  baseOutstationRate: number;
  isActive: boolean;
  createdAt: string;
}

export interface Shipment {
  id: string;
  orderId: string;
  courierId: string;
  trackingNumber: string;
  shippingCost: number;
  shippingStatus: "PENDING" | "DISPATCHED" | "IN_TRANSIT" | "DELIVERED" | "RETURNED";
  dispatchDate?: string;
  deliveryDate?: string;
  createdAt: string;
}

export interface CodCollection {
  id: string;
  orderId: string;
  codAmount: number;
  amountCollected: number;
  remittanceStatus: "PENDING_REMITTANCE" | "PARTIALLY_REMITTED" | "FULLY_REMITTED";
  courierReferenceNo?: string;
  remittedAt?: string;
  reconciliationNotes?: string;
  createdAt: string;
}

export interface ReturnOrder {
  id: string;
  orderId: string;
  returnReason: string;
  returnStatus: "REQUESTED" | "APPROVED" | "RECEIVED_AND_RESTOCKED" | "REJECTED";
  refundStatus: "NOT_REFUNDED" | "PENDING_APPROVAL" | "REFUNDED";
  refundAmount: number;
  createdByUserId: string;
  createdAt: string;
}

export interface ReturnItem {
  id: string;
  returnId: string;
  productId: string;
  quantity: number;
  isRestocked: boolean;
  restockedWarehouseId?: string;
}

export interface OrderTimelineEvent {
  id: string;
  orderId: string;
  eventType: "CREATED" | "CONFIRMED" | "PACKED" | "SHIPPED" | "DELIVERED" | "RETURN_REQUESTED" | "RETURNED" | "CANCELED";
  eventDescription: string;
  loggedBy: string;
  createdAt: string;
}

export interface SystemNotification {
  id: string;
  type: "NEW_ORDER" | "LOW_STOCK" | "PAYMENT_RECEIVED" | "DELAYED_ORDER" | "RETURN_REQUEST";
  title: string;
  description: string;
  resolved: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userEmail: string;
  userRole: string;
  actionType: string;
  moduleName: string;
  actionDetails: string;
  ipAddress?: string;
  createdAt: string;
}
