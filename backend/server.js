// importing modules
import express from "express"
import dotenv from "dotenv"
import cors from "cors"
import cookieParser from "cookie-parser";
import { healthCheck } from "./controllers/authentication/healthCheck.js";
import { installUrlGenerator } from "./controllers/authentication/installUrlGenerator.js";
import { accessTokenExchange } from "./controllers/authentication/accessTokenExchange.js";
import { fetchShopifyOrders } from "./controllers/orders/fetchShopifyOrders.js";
import { getOrder } from "./controllers/orders/getOrder.js";

// initialising modules
const app = express();
dotenv.config();

const {
  HOST,
  BACKEND_PORT,
  FRONTEND_DOMAN
} = process.env;

app.use(express.json());

// app.use(cors());
let corsData = {
  origin: FRONTEND_DOMAN,
  credentials: true
}
app.use(cors(corsData));

// Enable CORS for all routes
app.use(cookieParser());
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', FRONTEND_DOMAN);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// API ENDPOINTS

// ------------------------  Authentication & Authorization  ----------------------------- //
app.get("/", healthCheck); // health check 
app.get("/auth", installUrlGenerator); // start OAuth flow
app.get("/auth/callback", accessTokenExchange); // OAuth callback

// ------------------------  Orders Routes  ----------------------------- //
app.get("/fetch-orders", fetchShopifyOrders)
app.get("/get-order", getOrder)

// assigning  backend a port 
app.listen(BACKEND_PORT, (req, resp) => {
  try {
    console.log(`Express server is running on port: ${BACKEND_PORT}`);
  } catch (error) {
    console.error("Error starting the Backend Server :- ", error);
  }
})