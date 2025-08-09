import axios from "axios"
import crypto from 'crypto';
import { prisma } from "../../lib/PrimsaClient.js"

export const accessTokenExchange = async (req, res) => {
    // accessing data
    const { shop, hmac, code } = req.query;
    const { CLIENT_ID, CLIENT_SECRET, FRONTEND_DOMAN } = process.env;

    // validating HMAC
    console.log("Validating HMAC.....")
    const map = { ...req.query };
    delete map["signature"];
    delete map["hmac"];
    const message = Object.keys(map)
        .sort()
        .map((key) => `${key}=${map[key]}`)
        .join("&");

    const generatedHmac = crypto
        .createHmac("sha256", CLIENT_SECRET)
        .update(message)
        .digest("hex");

    if (generatedHmac !== hmac) return res.status(400).send("HMAC validation failed");

    // Exchanging code for access token
    try {
        console.log("Exchanging access token.....")
        const tokenResponse = await axios.post(
            `https://${shop}/admin/oauth/access_token`,
            {
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                code,
            }
        );

        const accessToken = tokenResponse.data.access_token;
        // console.log("Access Token:", accessToken);

        // Storing access token securely in DB for this shop
        console.log("Storing access token in database....")
        await prisma.store.upsert({
            where: { shop: shop },
            update: {
                accessToken,
            },
            create: {
                shop: shop,
                accessToken: accessToken,
            },
        });

        console.log("App successfully installed! ✅");
        res.redirect(`${FRONTEND_DOMAN}?shop=${shop}`);

    } catch (error) {
        console.error("Token exchange failed:", error.response?.data || error.message);
        res.status(500).send("Error exchanging token");
    }
}