export interface OrderDetail {
  orderDetailId: number;
  itemId: number;
  id: number;
  itemName: string;
  price: number;
  modifierTotal: number;
  quantity: number;
  itemTotal: number;
  createdAt: string;
}

export interface FoodOrder {
  orderId: number;
  qNumber: string;
  tableName: string;
  waiterOrDriver: string;
  guests: number;
  orderType: number;
  status: number;
  customerName: string;
  phone: string;
  email: string;
  address: string;
  subTotal: number;
  taxTotal: number;
  discountTotal: number;
  chargeTotal: number;
  invoiceTotal: number;
  paymentMethod: string;
  paidAmount: number;
  dueAmount: number;
  note: string;
  createdBy: string;
  createdAt: string;
  printStatus: string;
  sentAt: string;
  receivedAt: string | null;
  printedAt: string | null;
  responseMessage: string;
  orderDetails: OrderDetail[];
}
