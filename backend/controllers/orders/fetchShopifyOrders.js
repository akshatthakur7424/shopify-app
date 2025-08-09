import { prisma } from "../../lib/PrimsaClient.js";
import axios from "axios";

export const fetchShopifyOrders = async (req, res) => {
  const shop = req.headers["x-shopify-shop-domain"];
  if (!shop) {
    return res.status(400).json({ success: false, message: "Missing shop header" });
  }

  try {
    const store = await prisma.store.findUnique({ where: { shop } });
    if (!store) {
      return res.status(404).json({ success: false, message: "Store not found" });
    }

    const accessToken = store.accessToken;
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    // Shopify query
    const query = `
      {
        orders(first: 50, query: "created_at:>=${sixtyDaysAgo.toISOString()}") {
          nodes {
            id
            email
            totalPriceSet { shopMoney { amount } }
            shippingAddress { address1 }
            lineItems(first: 50) {
              edges {
                node {
                  id
                  name
                  quantity
                  title
                  variantTitle
                  variant { image { originalSrc } }
                }
              }
            }
            fulfillments { id status }
          }
        }
      }`;

    const response = await axios.post(
      `https://${shop}/admin/api/2024-07/graphql.json`,
      { query },
      {
        headers: {
          "X-Shopify-Access-Token": accessToken,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data.errors) {
      return res.status(500).json({
        success: false,
        message: "Shopify API returned GraphQL errors",
        errors: response.data.errors,
      });
    }

    const orders = response.data?.data?.orders?.nodes || [];

    const formattedOrders = [];

    for (const order of orders) {
      const orderId = String(order.id);
      const email = order.email || null;
      const totalAmount = parseFloat(order.totalPriceSet.shopMoney.amount);
      const shippingAddress = order.shippingAddress?.address1 || null;

      // ✅ Upsert order in DB
      const savedOrder = await prisma.order.upsert({
        where: { storeId_orderId: { storeId: store.id, orderId } },
        update: { email, totalAmount, shippingAddress },
        create: {
          storeId: store.id,
          orderId,
          email,
          totalAmount,
          shippingAddress,
        },
      });

      // ❌ Delete old line items
      await prisma.lineItem.deleteMany({ where: { orderId: savedOrder.id } });

      // ✅ Create new line items
      const lineItemsData = order.lineItems.edges.map(({ node }) => ({
        lineItemId: node.id,
        name: node.name,
        quantity: node.quantity,
        title: node.title,
        variant: node.variantTitle || null,
        imageUrl: node.variant?.image?.originalSrc || null,
        orderId: savedOrder.id,
      }));
      if (lineItemsData.length > 0) {
        await prisma.lineItem.createMany({ data: lineItemsData });
      }

      // ❌ Delete old fulfillments
      await prisma.fulfillment.deleteMany({ where: { orderId: savedOrder.id } });

      // ✅ Create new fulfillments
      if (order.fulfillments.length > 0) {
        for (const fulfillment of order.fulfillments) {
          await prisma.fulfillment.create({
            data: {
              shopifyFulfillmentId: fulfillment.id,
              status: fulfillment.status,
              orderId: savedOrder.id,
            },
          });
        }
      }

      // ✅ Add to response array
      formattedOrders.push({
        id: order.id,
        email,
        totalAmount,
        shippingAddress,
        lineItems: lineItemsData,
        fulfillments: order.fulfillments.map(f => ({
          id: f.id,
          status: f.status,
        })),
      });
    }

    return res.status(200).json({
      success: true,
      message: "Orders fetched & saved successfully",
      data: formattedOrders,
    });

  } catch (error) {
    console.error("Error:", error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch or save orders",
      error: error.response?.data || error.message,
    });
  }
};


// import { prisma } from "../../lib/PrimsaClient.js";
// import axios from "axios";

// export const fetchShopifyOrders = async (req, res) => {
//   const shop = req.headers["x-shopify-shop-domain"];
//   if (!shop) {
//     return res.status(400).json({ success: false, message: "Missing shop header" });
//   }

//   try {
//     const store = await prisma.store.findUnique({ where: { shop } });
//     if (!store) {
//       return res.status(404).json({ success: false, message: "Store not found" });
//     }

//     const accessToken = store.accessToken;
//     const sixtyDaysAgo = new Date();
//     sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

//     // Shopify query
//     const query = `
//       {
//         orders(first: 50, query: "created_at:>=${sixtyDaysAgo.toISOString()}") {
//           nodes {
//             id
//             email
//             totalPriceSet { shopMoney { amount } }
//             shippingAddress { address1 }
//             lineItems(first: 50) {
//               edges {
//                 node {
//                   id
//                   name
//                   quantity
//                   title
//                   variantTitle
//                   variant { image { originalSrc } }
//                 }
//               }
//             }
//             fulfillments { id status }
//           }
//         }
//       }`;

//     const response = await axios.post(
//       `https://${shop}/admin/api/2024-07/graphql.json`,
//       { query },
//       {
//         headers: {
//           "X-Shopify-Access-Token": accessToken,
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     const orders = response.data?.data?.orders?.nodes || [];

//     console.log("orders: ", orders)

//     // 🔄 Transform into flat structure for frontend
//     const formattedOrders = orders.map(order => ({
//       id: order.id,
//       email: order.email,
//       totalAmount: parseFloat(order.totalPriceSet.shopMoney.amount),
//       shippingAddress: order.shippingAddress?.address1 || null,
//       lineItems: order.lineItems.edges.map(({ node }) => ({
//         id: node.id,
//         name: node.name,
//         quantity: node.quantity,
//         title: node.title,
//         variantTitle: node.variantTitle,
//         imageUrl: node.variant?.image?.originalSrc || null,
//       })),
//       fulfillments: order.fulfillments.map(f => ({
//         id: f.id,
//         status: f.status,
//       })),
//     }));

//     return res.status(200).json({
//       success: true,
//       message: "Orders fetched successfully",
//       data: formattedOrders,
//     });

//   } catch (error) {
//     console.error("Error:", error.response?.data || error.message);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch orders",
//       error: error.response?.data || error.message,
//     });
//   }
// };




// import { prisma } from "../../lib/PrimsaClient.js";
// import axios from "axios";

// export const fetchShopifyOrders = async (req, res) => {
//     const shop = req.headers["x-shopify-shop-domain"];
//     if (!shop) {
//         return res.status(400).json({ success: false, message: "Missing shop header" });
//     }

//     try {
//         const store = await prisma.store.findUnique({ where: { shop } });
//         if (!store) {
//             return res.status(404).json({ success: false, message: "Store not found" });
//         }

//         const accessToken = store.accessToken;
//         const sixtyDaysAgo = new Date();
//         sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

//         // Shopify GraphQL query to get last 60 days orders
//         const query = `
//         {
//           orders(first: 50, query: "created_at:>=${sixtyDaysAgo.toISOString()}") {
//             nodes {
//               id
//               email
//               totalPriceSet {
//                 shopMoney {
//                   amount
//                 }
//               }
//               shippingAddress {
//                 address1
//               }
//               lineItems(first: 50) {
//                 edges {
//                   node {
//                     id
//                     name
//                     quantity
//                     title
//                     variantTitle
//                     variant {
//                       image {
//                         originalSrc
//                       }
//                     }
//                   }
//                 }
//               }
//               fulfillments {
//                 id
//                 status
//               }
//             }
//           }
//         }
//         `;

//         const response = await axios.post(
//             `https://${shop}/admin/api/2024-07/graphql.json`,
//             { query },
//             {
//                 headers: {
//                     "X-Shopify-Access-Token": accessToken,
//                     "Content-Type": "application/json",
//                 },
//             }
//         );

//         if (response.data.errors) {
//             return res.status(500).json({
//                 success: false,
//                 message: "Shopify API returned GraphQL errors",
//                 errors: response.data.errors,
//             });
//         }

//         const orders = response.data?.data?.orders?.nodes || [];

//         for (const order of orders) {
//             const orderId = String(order.id);
//             const email = order.email || null;
//             const totalAmount = parseFloat(order.totalPriceSet.shopMoney.amount);
//             const shippingAddr = order.shippingAddress?.address1 || null;

//             // Upsert order
//             const savedOrder = await prisma.order.upsert({
//                 where: { storeId_orderId: { storeId: store.id, orderId } },
//                 update: { email, totalAmount, shippingAddr },
//                 create: {
//                     storeId: store.id,
//                     orderId,
//                     email,
//                     totalAmount,
//                     shippingAddr,
//                 },
//             });

//             // Delete old line items
//             await prisma.lineItem.deleteMany({ where: { orderId: savedOrder.id } });

//             const lineItems = order.lineItems.edges.map(({ node }) => ({
//                 lineItemId: node.id,
//                 name: node.name,
//                 quantity: node.quantity,
//                 title: node.title,
//                 variant: node.variantTitle || null,
//                 imageUrl: node.variant?.image?.originalSrc || null,
//                 orderId: savedOrder.id,
//             }));

//             if (lineItems.length > 0) {
//                 await prisma.lineItem.createMany({ data: lineItems });
//             }

//             // Delete old fulfillments
//             await prisma.fulfillment.deleteMany({ where: { orderId: savedOrder.id } });

//             if (order.fulfillments.length > 0) {
//                 for (const fulfillment of order.fulfillments) {
//                     await prisma.fulfillment.create({
//                         data: {
//                             shopifyFulfillmentId: fulfillment.id,
//                             status: fulfillment.status,
//                             orderId: savedOrder.id,
//                         },
//                     });
//                 }
//             }
//         }

//         return res.status(200).json({
//             success: true,
//             message: "Orders saved successfully",
//             data: orders,
//         });
//     } catch (error) {
//         console.error("Request Error:", error.response?.data || error.message);
//         return res.status(500).json({
//             success: false,
//             message: "Failed to fetch or save orders",
//             error: error.response?.data || error.message,
//         });
//     }
// };




// query MyQuery($id: ID = "") {
//   orders(first: 10, reverse: true) {
//     nodes {
//       id
//       email
//       totalPriceSet {
//         shopMoney {
//           amount
//         }
//       }
//       shippingAddress {
//         address1
//       }
//       lineItems {
//         edges {
//           node {
//             id
//             name
//             quantity
//             title
//             variantTitle
//           }
//         }
//       }
//       fulfillments(first: 10) {
//         id
//         status
//       }
//     }
//   }
//   customer(id: $id) {
//     firstName
//     lastName
//     defaultEmailAddress {
//       emailAddress
//     }
//   }
// }
