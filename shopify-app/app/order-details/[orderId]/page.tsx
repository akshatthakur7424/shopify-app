"use client";

import axios from "axios";
import { useEffect, useState, use } from "react";
import Cookies from "js-cookie";


interface FormattedOrder {
  id: string;
  email: string | null;
  totalAmount: number;
  shippingAddress: string | null;
  lineItems: LineItem[];
  fulfillments: Fulfillment[];
}

interface LineItem {
  id: string;
  name: string;
  quantity: number;
  title: string;
  variantTitle: string | null;
  imageUrl: string | null;
}

interface Fulfillment {
  id: string;
  status: string;
}

export default function OrderDetails({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = use(params);;
  const id = decodeURIComponent(orderId);
  const shopDomain = Cookies.get("shop");
  const [isLoading, setIsLoading] = useState(true);
  const [order, setOrder] = useState<FormattedOrder | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await axios.get("http://localhost:8080/get-order", {
          params: { orderId: id },
          headers: { "x-shopify-shop-domain": shopDomain }
        });


        console.log("API response:", response.data);

        if (response.data?.data) {
          setOrder(response.data.data); // Expecting a single order object
        } else {
          console.error("Unexpected order format:", response.data);
        }
      } catch (error) {
        console.error("Error fetching order:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  if (isLoading) {
    return <div className="text-sky-900" >Loading Orders........</div>;
  }

  if (!order) {
    return <div className="text-center text-red-600">Order not found</div>;
  }

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white rounded-2xl shadow-lg space-y-6">
      {/* Order Header */}
      <div className="flex items-center justify-between border-b pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Order ID: {order?.fulfillments[0]?.id} </h1>
        <span className="px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-full">
          {order.fulfillments.length > 0
            ? order.fulfillments[0].status
            : "Pending"}
        </span>
      </div>

      {/* Customer Info */}
      <div className="grid grid-cols-2 gap-4 border-b pb-4">
        <div>
          <p className="text-sm text-gray-500">Customer Email</p>
          <p className="text-lg font-medium">{order.email || "N/A"}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Shipping Address</p>
          <p className="text-lg font-medium">
            {order.shippingAddress || "N/A"}
          </p>
        </div>
      </div>

      {/* Order Items */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          Line Items
        </h2>
        <div className="divide-y">
          {order.lineItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between py-3"
            >
              <div className="flex items-center gap-4">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-14 h-14 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                    No Image
                  </div>
                )}
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-gray-500">
                    Variant: {item.variantTitle || "Default"}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold">Qty: {item.quantity}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Total Amount */}
      <div className="flex justify-end border-t pt-4">
        <p className="text-lg font-bold text-gray-900">
          Total: ${order.totalAmount.toFixed(2)}
        </p>
      </div>
    </div>
  );
}
