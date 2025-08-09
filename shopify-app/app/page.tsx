"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Cookies from "js-cookie";
import axios from "axios";
import { DataTable } from "@/components/data-table";
import { columns } from "@/components/columns";

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

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [isRendered, setIsRendered] = useState(false);
  const [orders, setOrders] = useState<FormattedOrder[]>([]);
  const searchParams = useSearchParams();

  useEffect(() => {
    setIsRendered(true);
  }, []);

  useEffect(() => {
    const fetchOrders = async (shopDomain: string) => {
      try {
        const response = await axios.get("http://localhost:8080/fetch-orders", {
          headers: { "x-shopify-shop-domain": shopDomain },
        });

        console.log("API response:", response.data);

        if (Array.isArray(response.data.data)) {
          setOrders(response.data.data);
        } else {
          console.error("Unexpected orders format:", response.data);
          setOrders([]);
        }
      } catch (error) {
        console.error("Error fetching orders:", error);
        setOrders([]);
      } finally {
        setIsLoading(false);
      }
    };

    const shopFromCookie = Cookies.get("shop");
    const shopFromParams = searchParams.get("shop");

    if (shopFromCookie) {
      fetchOrders(shopFromCookie);
    } else if (shopFromParams) {
      Cookies.set("shop", shopFromParams);
      fetchOrders(shopFromParams);
    } else {
      setIsLoading(false);
    }
  }, [searchParams]);

  if (!isRendered) return null;

  if (isLoading) {
    return <div>Loading Orders........</div>;
  }

  return (
    <div>
      <DataTable data={orders} columns={columns} />
    </div>
  );
}



// "use client"

// import { useEffect, useState } from "react";
// import { useSearchParams } from "next/navigation";
// import Cookies from "js-cookie";
// import axios from "axios";

// // Order-related interfaces
// interface FormattedOrder {
//   id: string;
//   email: string | null;
//   totalAmount: number;
//   shippingAddress: string | null;
//   lineItems: LineItem[];
//   fulfillments: Fulfillment[];
// }

// interface LineItem {
//   id: string;
//   name: string;
//   quantity: number;
//   title: string;
//   variantTitle: string | null;
//   imageUrl: string | null;
// }

// interface Fulfillment {
//   id: string;
//   status: string;
// }


// export default function Home() {
//   const [isLoading, setIsLoading] = useState(true);
//   const [isRendered, setIsRendered] = useState(false);
//   const [orders, setOrders] = useState<FormattedOrder[]>([]);
//   const searchParams = useSearchParams();

//   useEffect(() => {
//     setIsRendered(true);
//   }, [])


//   useEffect(() => {
//     const fetchOrders = async (shopDomain: string) => {
//       try {
//         const response = await axios.get("http://localhost:8080/fetch-orders", {
//           headers: {
//             "x-shopify-shop-domain": shopDomain,
//           },
//         });
//         if (response?.data) {
//           console.log(response.data)
//           setOrders(response.data);
//         } else {
//           console.log("Order fetching failed");
//         }
//       } catch (error) {
//         console.error("Error fetching orders:", error);
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     let shopFromCookie = Cookies.get("shop");
//     let shopFromParams = searchParams.get("shop");

//     if (shopFromCookie) {
//       fetchOrders(shopFromCookie);
//     } else if (shopFromParams) {
//       Cookies.set("shop", shopFromParams);
//       fetchOrders(shopFromParams);
//     }
//   }, []);

//   if (!isRendered) {
//     return null;
//   }

//   if (isRendered && isLoading) {
//     return (
//       <div>Loading Orders........</div>
//     )
//   }

//   return (
//     <div>
//       Orders ID's:
//       {
//         orders.map(order => order.id)
//       }
//     </div>
//   );
// }
