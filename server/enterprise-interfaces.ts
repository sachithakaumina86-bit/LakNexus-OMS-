import { 
  Warehouse, ProductStock, InventoryTransaction, Courier, Shipment, 
  CodCollection, ReturnOrder, ReturnItem, OrderTimelineEvent, SystemNotification, AuditLog 
} from "../src/db/schema";

export interface CreateShipmentPayload {
  orderId: string;
  courierId: string;
  trackingNumber?: string;
  shippingCost?: number;
}

export interface RemitCodPayload {
  orderId: string;
  amountCollected: number;
  courierReferenceNo?: string;
  reconciliationNotes?: string;
}

export interface ReturnRequestPayload {
  orderId: string;
  returnReason: string;
  refundAmount?: number;
  items: Array<{
    productId: string;
    quantity: number;
    restockWarehouseId?: string;
  }>;
}

export interface AdjustStockPayload {
  productId: string;
  warehouseId: string;
  adjustmentQty: number; // positive or negative
  transactionType: "RESTOCK" | "MANUAL_ADJUSTMENT" | "DEDUCTION" | "RESTORATION";
  notes?: string;
  userId: string;
}

export interface UserRolePayload {
  userId: string;
  email: string;
  roleId: number;
}
