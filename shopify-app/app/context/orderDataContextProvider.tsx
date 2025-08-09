"use client";

import { ReactNode, createContext, useState, Dispatch, SetStateAction } from "react";

// Order-related interfaces
export interface FormattedOrder {
  id: string;
  email: string | null;
  totalAmount: number;
  shippingAddress: string | null;
  lineItems: LineItem[];
  fulfillments: Fulfillment[];
}

export interface LineItem {
  id: string;
  name: string;
  quantity: number;
  title: string;
  variantTitle: string | null;
  imageUrl: string | null;
}

export interface Fulfillment {
  id: string;
  status: string;
}

// Context type
interface OrdersContextType {
  orders: FormattedOrder[];
  setOrders: Dispatch<SetStateAction<FormattedOrder[]>>;
}

// Create context
export const OrdersContext = createContext<OrdersContextType | undefined>(undefined);

// Provider component
export const OrdersContextProvider = ({ children }: { children: ReactNode }) => {
  const [orders, setOrders] = useState<FormattedOrder[]>([]);

  return (
    <OrdersContext.Provider value={{ orders, setOrders }}>
      {children}
    </OrdersContext.Provider>
  );
};
