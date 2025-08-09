import { prisma } from "../../lib/PrimsaClient.js";

export const getOrder = async (req, res) => {
    try {
        const orderId = req.query.orderId;
        const shopDomain = req.headers["x-shopify-shop-domain"];

        if (!orderId || !shopDomain) {
            return res.status(400).json({
                success: false,
                message: "Missing orderId or shop domain",
            });
        }

        // 1️⃣ Find the store by shop domain
        const store = await prisma.store.findUnique({
            where: { shop: shopDomain },
        });

        if (!store) {
            return res.status(404).json({
                success: false,
                message: "Store not found",
            });
        }

        // 2️⃣ Fetch order using the compound unique constraint
        const order = await prisma.order.findUnique({
            where: {
                storeId_orderId: {
                    storeId: store.id,
                    orderId: orderId,
                },
            },
            include: {
                lineItems: true,
                fulfillments: true,
            },
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        // 3️⃣ Format order for frontend
        const formattedOrder = {
            id: order.id,
            email: order.email,
            totalAmount: order.totalAmount,
            shippingAddress: order.shippingAddress,
            lineItems: order.lineItems.map((item) => ({
                id: item.lineItemId,
                name: item.name,
                quantity: item.quantity,
                title: item.title,
                variantTitle: item.variant,
                imageUrl: item.imageUrl,
            })),
            fulfillments: order.fulfillments.map((f) => ({
                id: f.shopifyFulfillmentId,
                status: f.status,
            })),
        };

        res.status(200).json({
            success: true,
            message: "Order fetched successfully",
            data: formattedOrder,
        });
    } catch (error) {
        console.error("Error fetching order:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};


// import { prisma } from "../../lib/PrimsaClient.js";

// export const getOrder = async (req, res) => {
//     try {
//         const orderId = req.query.orderId;
//         // const orderId = req.params.id;

//         // Fetch the order with related line items and fulfillments
//         const order = await prisma.order.findUnique({
//             where: { orderId : orderId },
//             include: {
//                 lineItems: true,
//                 fulfillments: true,
//             },
//         });

//         if (!order) {
//             return res.status(404).json({ success: false, message: "Order not found" });
//         }

//         // Format for frontend
//         const formattedOrder = {
//             id: order.id,
//             email: order.email,
//             totalAmount: order.totalAmount,
//             shippingAddress: order.shippingAddr,
//             lineItems: order.lineItems.map((item) => ({
//                 id: item.lineItemId,
//                 name: item.name,
//                 quantity: item.quantity,
//                 title: item.title,
//                 variantTitle: item.variant,
//                 imageUrl: item.imageUrl,
//             })),
//             fulfillments: order.fulfillments.map((f) => ({
//                 id: f.shopifyFulfillmentId,
//                 status: f.status,
//             })),
//         };

//         res.status(200).json({
//             success: true,
//             message: "Order fetched successfully",
//             data: formattedOrder,
//         });
//     } catch (error) {
//         console.error("Error fetching order:", error);
//         res.status(500).json({ success: false, message: "Internal Server Error" });
//     }
// };
