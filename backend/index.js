import express from "express";

import { Client } from "pg";
import Cryptr from "cryptr";
import jwt from "jsonwebtoken";
import cors from "cors";
import "dotenv/config";
import authenticateToken from "./middlewares/tokenValidation.js";

console.log("🚀 ~ process.env.CRYPTR_SECRET:", process.env.CRYPTR_SECRET);

const cryptr = new Cryptr(process.env.CRYPTR_SECRET);

const client = new Client({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME,
  ssl:
    process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : undefined,
});



const app = express();
const port = Number(process.env.PORT || 3000);
// const allowedOrigin = process.env.CORS_ORIGIN || "*";
app.use(cors());
app.use(express.json());

app.post("/signup", (req, res) => {
  console.log("🚀 ~ req.body:", req.body);

  const { name, email, password } = req.body;
  const encryptedPassword = cryptr.encrypt(password);
  const query =
    "INSERT INTO customers (c_name, c_email, password) VALUES ($1, $2, $3) RETURNING c_id";
  console.log("🚀 ~ query:", query);
  client.query(query, [name, email, encryptedPassword], (err, result) => {
    console.log("🚀 ~ result:", result);
    if (err) {
      console.error("Error inserting user", err);
      res.status(500).send({
        message: "Error inserting user",
        success: false,
      });
    } else {
      const user = {
        email: email,
        name: name,
        c_id: result.rows[0]?.c_id,
      };
      console.log("🚀 ~ user:", user);

      const token = jwt.sign(user, process.env.CRYPTR_SECRET, {
        expiresIn: "1h",
      }); // Token expires in 1 hour
      console.log("🚀 ~ token:", token);

      res.status(200).send({
        message: "User inserted successfully",
        user: {
          name: name,
          email: email,
          token: token,
        },
        success: true,
      });
    }
  });
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;


  const query = "SELECT * FROM customers WHERE c_email = $1";
  client.query(query, [email], (err, result) => {
    console.log("🚀 ~ result:", result);
    if (err) {
      console.error("Error logging in user", err);
      res.status(500).send({
        message: "Error logging in user",
        success: false,
      });
    } else {
      if (result.rows.length > 0) {
        const user = result.rows[0];
        const decryptedPassword = cryptr.decrypt(user.password);  
        console.log("🚀 ~ decryptedPassword:", decryptedPassword)
        if (decryptedPassword === password) {
          res.status(200).send({
            message: "User logged in successfully",
            user: user,
            success: true,
          });
        }
      } else {
        res.status(401).send({
          message: "Invalid email or password",
          success: false,
        });
      }
    }
  });
});


app.get("logout", authenticateToken, (req, res) => {
  const token = req.headers.authorization.split(" ")[1];

  console.log("🚀 ~ token:", token);
  res.status(200).send({
    message: "Logged out successfully",
    success: true,
  });
});


app.get("/products", authenticateToken, (req, res) => {
  const query = "SELECT * FROM products";
  client.query(query, (err, result) => {
    console.log("🚀 ~ result:", result);
    if (err) {
      console.error("Error getting products", err);
      res.status(500).send({
        message: "Error getting products",
        success: false,
      });
    } else {
      res.status(200).send({
        message: "Products fetched successfully",
        products: result.rows,
        success: true,
      });
    }
  });
});

app.post("/purchase", authenticateToken, (req, res) => {
  const customer_id = req.user.c_id;
  console.log("🚀 ~ customcdcer_id:", customer_id);
  const { product_id, quantity } = req.body;
  const query = "INSERT INTO Orders (c_id) VALUES ($1) RETURNING o_id";
  client.query(query, [customer_id], (err, result) => {
    console.log("🚀 ~ result:", result);
    if (err) {
      console.error("Error purchasing product", err);
      res.status(500).send({
        message: "Error purchasing product",
        success: false,
      });
    }
    const order_id = result.rows[0].o_id;
    const query =
      "INSERT INTO order_items (o_id, p_id, item_count) VALUES ($1, $2, $3)";
    client.query(query, [order_id, product_id, quantity], (err, result) => {
      console.log("🚀 ~ result:", result);
      if (err) {
        console.error("Error purchasing product", err);
        res.status(500).send({
          message: "Error purchasing product",
          success: false,
        });
      } else {
        res.status(200).send({
          message: "Product purchased successfully",
          success: true,
        });
      }
    });
  });
});

app.get("/purchases", authenticateToken, (req, res) => {
  const customer_id = req.user.c_id;
  const query = `
 select orders.o_id, orders.c_id, customers.c_name, order_items.item_count, products.p_name from order_items join products ON products.p_id=order_items.p_id Join orders ON orders.o_id = order_items.o_id Join customers ON customers.c_id= orders.c_id WHERE orders.c_id = $1;
  `;
  client.query(query, [customer_id], (err, result) => {
    console.log("🚀 ~ result:", result);
    if (err) {
      console.error("Error fetching purchases", err);
      res.status(500).send({
        message: "Error fetching purchases",
        success: false,
      });
    } else {
      res.status(200).send({
        message: "Purchases fetched successfully",
        purchases: result.rows,
        success: true,
      });
    }
  });
});

app.delete("/remove-purchase/:orderId", authenticateToken, (req, res) => {

  const { orderId } = req.params;
  console.log("🚀 ~ orderId:", orderId);
  const query = `
   DELETE FROM order_items WHERE o_id = $1;
    `;
  client.query(query, [orderId], (err, result) => {
    console.log("🚀 ~ result:", result);
    if (err) {
      console.error("Error removing purchase", err);
      res.status(500).send({
        message: "Error removing purchase",
        success: false,
      });
    } else {
      const query = `
        DELETE FROM orders WHERE o_id = $1;
        `;
      client.query(query, [orderId], (err, result) => {
        console.log("🚀 ~ result:", result);
        if (err) {
          console.error("Error removing purchase", err);
          res.status(500).send({
            message: "Error removing purchase",
            success: false,
          });
        } else {
          res.status(200).send({
            message: "Purchase removed successfully",
            success: true,
          });
        }
      });
    }
  });
});

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.listen(port, () => {
  client.connect((err) => {
    if (err) {
      console.error("Error connecting to database", err);
    } else {
      console.log("Connected to database");
    }
  });
  console.log(`Server is running on port ${port}`);
});
