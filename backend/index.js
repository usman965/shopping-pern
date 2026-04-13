import express from "express";

import { Client } from "pg";
import Cryptr from "cryptr";
import jwt from "jsonwebtoken";
import cors from "cors";
import "dotenv/config";
import authenticateToken from "./middlewares/tokenValidation.js";

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const clientAWS = new S3Client({
  region: "ap-south-1",
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

import Stripe from "stripe";
import DB_ERRORS from "./constants/dbErrors.js";
import DB_ERROR_MESSAGES from "./constants/dbErrorMessages.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-03-31.basil",
});

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



app.use(cors({
  origin: [
    'https://devusmanasghar.site',
    'https://www.devusmanasghar.site',
    'http://localhost:5173'
  ],
  credentials: true
}));

// app.use(cors({
//   origin: ['http://localhost:5173/'],
//   credentials: true
// }));

// const allowedOrigin = process.env.CORS_ORIGIN || "*";
// app.use(cors());
app.use(express.json());

app.post("/signup", (req, res) => {
  console.log("🚀 ~ req.body:", req.body);

  const { name, email, password } = req.body;
  const encryptedPassword = cryptr.encrypt(password);
  const query =
    "INSERT INTO customers (c_name, c_email, password) VALUES ($1, $2, $3)   RETURNING c_id";
  console.log("🚀 ~ query:", query);
  client.query(query, [name, email, encryptedPassword], (err, result) => {
    console.log("🚀 ~ result:", result);
    if (err) {
      console.error("Error inserting user", err.code);

      if (err.code == DB_ERRORS.UNIQUE_VIOLATION) {
        res.status(500).send({
          message: DB_ERROR_MESSAGES.UNIQUE_VIOLATION,
          success: false,
        });
      } else {
        res.status(500).send({
          message: "Error inserting user",
          success: false,
        });
      }
    } else {
      const user = {
        email: email,
        name: name,
        c_id: result.rows[0]?.c_id,
      };
      console.log("🚀 ~ user:", user);

      const token = jwt.sign(user, process.env.CRYPTR_SECRET, {
        expiresIn: "1d",
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
      console.error("Error updating profile", err.code);
      res.status(500).send({
        message: "Error updating profile",
        success: false,
      });
    } else {
      if (result.rows.length > 0) {
        const user = result.rows[0];

        const decryptedPassword = cryptr.decrypt(user.password);
        console.log("🚀 ~ decryptedPassword:", decryptedPassword);
        if (decryptedPassword === password) {
          const token = jwt.sign(user, process.env.CRYPTR_SECRET, {
            expiresIn: "1d",
          });

          const userFound = { ...user, token: token };
          delete user.password;

          res.status(200).send({
            message: "User logged in successfully",
            user: userFound,
            success: true,
          });
        } else {
          res.status(401).send({
            message: "Invalid email or password",
            success: false,
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

app.post("/update-profile", authenticateToken, (req, res) => {
  const customer_id = req.user.c_id;
  const { name } = req.body;

  const query = "UPDATE customers SET c_name = $1 WHERE c_id = $2";
  client.query(query, [name, customer_id], (err, result) => {
    console.log("njjjkl  ::  ", result);

    if (err) {
      console.error("Error updating profile", err);
      res.status(500).send({
        message: "Error updating profile",
        success: false,
      });
    } else {
      res.status(200).send({
        message: "User updated successfully",
        success: true,
      });
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

app.post("/add-to-cart", authenticateToken, (req, res) => {
  const customer_id = req.user.c_id;
  console.log("🚀 ~ customcdcer_id:jhkjhjk", customer_id);
  const { product_id, quantity } = req.body;

  const checkIfItemAlreadyInCart =
    "Select item_count as count from my_cart where p_id=$1 and c_id=$2";

  client.query(
    checkIfItemAlreadyInCart,
    [product_id, customer_id],
    (err, result) => {
      console.log("🚀 ~ resucdcdcdcdcclt:", result);
      if (err) {
        res.status(500).send({
          success: false,
          message: "Internal server error",
        });
      } else {
        const count = result.rows[0]?.count;
        if (!count) {
          const query =
            "INSERT INTO  my_cart (c_id, p_id, item_count) VALUES ($1, $2, $3)";
          client.query(
            query,
            [customer_id, product_id, quantity],
            (err, result) => {
              console.log("🚀 ~ redcdcdcsult:", result);
              if (err) {
                console.error("Error adding product to cart", err);
                res.status(500).send({
                  message: "Error adding product to cart",
                  success: false,
                });
              } else {
                res.status(200).send({
                  message: "Product added to cart successfully",
                  success: true,
                });
              }
            },
          );
        } else {
          const queryToIncreamentCount =
            "update my_cart set item_count=$1 where p_id=$2 and c_id=$3";
          client.query(
            queryToIncreamentCount,
            [count + 1, product_id, customer_id],
            (err, result) => {
              if (err) {
                console.error("Error adding product to cart", err);
                res.status(500).send({
                  message: "Error adding product to cart",
                  success: false,
                });
              } else {
                res.status(200).send({
                  message: "Product added to cart successfully",
                  success: true,
                });
              }
            },
          );
        }
      }
    },
  );
});

app.post("/subtract-cart-item-count", authenticateToken, (req, resp) => {
  const customer_id = req.user.c_id;
  console.log("🚀 ~ customcdcer_id:jhkjhjk", customer_id);
  const { product_id, quantity } = req.body;

  if (quantity == 0) {
    const query = "DELETE FROM my_cart where c_id = $1 and p_id = $2";
    client.query(query, [customer_id, product_id], (err, result) => {
      console.log("🚀 ~ redcdkhhkjkjcdcshghult:", result);
      if (err) {
        console.error("Error removing product from cart", err);
        resp.status(500).send({
          message: "Error removing product from cart",
          success: false,
        });
      } else {
        resp.status(200).send({
          message: "Product removed from cart successfully",
          success: true,
        });
      }
    });
  } else {
    const queryChangeCount =
      "update my_cart set item_count=$1 where p_id=$2 and c_id=$3";
    client.query(
      queryChangeCount,
      [quantity, product_id, customer_id],
      (err, result) => {
        if (err) {
          console.error("Error adding product to cart", err);
          resp.status(500).send({
            message: "Error adding product to cart",
            success: false,
          });
        } else {
          resp.status(200).send({
            message: "Product added to cart successfully",
            success: true,
          });
        }
      },
    );
  }
});

app.delete("/my-cart/:productId", authenticateToken, (req, res) => {
  const customer_id = req.user.c_id;
  console.log("🚀 ~ customcdcer_id:jhkjhjk", customer_id);
  const { productId } = req.params;
  console.log("🚀 ~ redcdkhhkjkjcdcsjhjjhghult:", productId);

  const query = "DELETE FROM my_cart where c_id = $1 and p_id = $2";
  client.query(query, [customer_id, productId], (err, result) => {
    console.log("🚀 ~ redcdkhhkjkjcdcshghult:", result);
    if (err) {
      console.error("Error removing product from cart", err);
      res.status(500).send({
        message: "Error removing product from cart",
        success: false,
      });
    } else {
      res.status(200).send({
        message: "Product removed from cart successfully",
        success: true,
      });
    }
  });
});

const getCartOfUserCOntroller = async (customer_id) => {
  const query =
    "select pr.p_name, pr.p_id, mc.item_count, pr.p_price from my_cart mc Join products pr ON mc.p_id=pr.p_id WHERE mc.c_id = $1";

  try {
    const result = await client.query(query, [customer_id]);

    return result.rows;
  } catch (err) {
    throw new Error(err);
  }
};

app.get("/my-cart", authenticateToken, (req, res) => {
  const customer_id = req.user.c_id;
  console.log("🚀 ~ customcdcer_id:jhkjhjk", customer_id);
  const query =
    "select pr.p_name, pr.p_id, mc.item_count,(mc.item_count*pr.p_price) as total_price  from my_cart mc Join products pr ON mc.p_id=pr.p_id WHERE mc.c_id = $1";

  client.query(query, [customer_id], (err, result) => {
    console.log("🚀 ~ redcdcdckjkksult:", result);
    if (err) {
      console.error("Error getting my cart", err);
      res.status(500).send({
        message: "Error getting my cart",
        success: false,
      });
    } else {
      res.status(200).send({
        message: "My cart fetched successfully",
        my_cart: result.rows,
        success: true,
      });
    }
  });
});

app.get("/cart-item-count", authenticateToken, (req, resp) => {
  const customer_id = req.user.c_id;
  const query_cartItem_count =
    "Select count(cart_id) from my_cart where c_id=$1";
  client.query(query_cartItem_count, [customer_id], (err, result) => {
    console.log("🚀 ~ scsdcdcresp:", result);
    if (err) {
      resp.status(500).send({
        message: "Inter nal server error",
        success: false,
      });
    } else {
      const itemCount = result.rows[0].count;
      resp.status(200).send({
        message: "cart items count fetched successfully",
        success: true,
        data: { cartItemCount: itemCount },
      });
    }
  });
});

app.post("/purchase", authenticateToken, (req, res) => {
  const customer_id = req.user.c_id;
  console.log("🚀 ~ customcdcgjhghjer_id:", customer_id);

  const query_for_my_cart =
    "select  pr.p_id, mc.item_count  from my_cart mc Join products pr ON mc.p_id=pr.p_id WHERE mc.c_id = $1";

  client.query(query_for_my_cart, [customer_id], (err, result1) => {
    console.log("🚀 ~ result:", result1);
    if (err) {
      console.error("Error getting my cart", err);
      res.status(500).send({
        message: "Error getting my cart",
        success: false,
      });
    } else {
      const query = "INSERT INTO Orders (c_id) VALUES ($1) RETURNING o_id";

      client.query(query, [customer_id], (err, result) => {
        console.log("🚀 ~ result:", result);
        if (err) {
          console.error("Error purchasing product", err);
          res.status(500).send({
            message: "Error purchasing product",
            success: false,
          });
        } else {
          const order_id = result.rows[0].o_id;
          result1.rows.forEach(async (row) => {
            const { p_id, item_count } = row;
            const query =
              "INSERT INTO order_items (o_id, p_id, item_count) VALUES ($1, $2, $3)";
            client.query(query, [order_id, p_id, item_count], (err, result) => {
              console.log("🚀 ~ rescsd sc sc  scs ult:", result);
              if (err) {
                console.error("Erytror purchasing product", err);
                res.status(500).send({
                  message: "Error purchasing product",
                  success: false,
                });
              }
            });
          });

          const queryToRemoveCart = "Delete from my_cart where c_id = $1";
          client.query(queryToRemoveCart, [customer_id], (err, result) => {
            console.log("🚀 ~ err:", err);
            console.log("🚀 ~ result:", result);
            if (err) {
              res.status(500).send({
                message: "Error purchasing product",
                success: false,
              });
            } else {
              console.log("🚀 ~ rescsd sc c c sc  scs ult:", result);

              res.status(200).send({
                message: "Products purchased successfully",
                success: true,
              });
            }
          });
        }
      });
    }
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

app.get("/checkout-session/:sessionId", authenticateToken, async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(
      req.params.sessionId,
    );
    const metaCid = session.metadata?.c_id;
    if (metaCid != null && String(metaCid) !== String(req.user.c_id)) {
      return res.status(403).json({
        success: false,
        message: "This checkout does not belong to the current user.",
      });
    }
    if (session.payment_status !== "paid") {
      return res.status(400).json({
        success: false,
        message: "Payment is not complete yet.",
        payment_status: session.payment_status,
      });
    }
    res.json({
      success: true,
      session: {
        id: session.id,
        payment_status: session.payment_status,
        amount_total: session.amount_total,
        currency: session.currency,
        customer_email:
          session.customer_details?.email || session.customer_email || null,
      },
    });
  } catch (error) {
    console.error("checkout-session retrieve:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to load checkout session",
    });
  }
});

app.post("/create-checkout-session", authenticateToken, async (req, res) => {
  const customer_id = req.user.c_id;
  const customer_email = req.user.c_email;

  const users_cart = await getCartOfUserCOntroller(customer_id);
  console.log("🚀 ~ users_cart:", users_cart);
  const line_items = users_cart.map((cart_item) => {
    return {
      price_data: {
        currency: "usd",
        product_data: {
          name: cart_item.p_name,
          images: [
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQUMSpaHXKhwIkuhc4h4KRh2tPnB60Kf5_UNw&s",
          ],
        },
        unit_amount: cart_item.p_price * 100,
      },
      quantity: cart_item.item_count,
    };
  });
  console.log("🚀 ~ line_items:", line_items);

  try {
    const session = await stripe.checkout.sessions.create({
      line_items,
      payment_method_types: ["card"],
      mode: "payment",
      ui_mode: "hosted",
      success_url:
        (process.env.FRONTEND_URL || "http://localhost:5173") +
        "/checkout/success?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: "https://example.com/cancel",
      customer_email: customer_email,
      metadata: {
        c_id: String(req.user.c_id),
      },
    });

    console.log("🚀 ~ app.post ~ session:", session);

    // Return both sessionId and client_secret for flexibility
    res.json({
      sessionId: session.id,
      checkoutSessionClientSecret: session.client_secret,
      url: session.url, // This is the hosted checkout URL
    });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    res.status(500).json({
      error: "Failed to create checkout session",
      message: error.message,
    });
  }
});

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.post("/get-presigned-url", authenticateToken, async (req, res) => {
  try {
    const { fileName, fileType } = req.body;
    if (!fileName || !fileType || !String(fileType).startsWith("image/")) {
      return res.status(400).json({
        success: false,
        message: "fileName and an image/* fileType are required.",
      });
    }
    const safe = String(fileName)
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .slice(0, 180);
    if (!safe) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid fileName." });
    }
    const bucket = "pern-learning";
    const key = `uploads/${safe}`;
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: fileType,
    });
    const preSignedURL = await getSignedUrl(clientAWS, command, {
      expiresIn: 900,
    });
    const region = "ap-south-1";
    const publicUrl = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
    console.log("🚀 ~ publicUrl:", publicUrl);

    res.status(200).json({
      success: true,
      data: {
        preSignedURL,
        publicUrl,
        key,
      },
    });
  } catch (error) {
    console.error("get-presigned-url:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create upload URL",
    });
  }
});

app.post("/update-profile-photo", authenticateToken, (req, resp) => {
  const customer_id = req.user.c_id;

  const { imagePath } = req.body;

  const query = `update customers set c_avatar=$1 where c_id=$2 RETURNING c_avatar`;
  client.query(query, [imagePath, customer_id], (err, result) => {
    if (err) {
      resp.status(500).send({
        success: false,
        message: "Error while setting profile photo",
      });
    } else {
      resp.status(200).send({
        success: true,
        message: "Profile picture setted successfully",
        data: {
          profileURL: result.rows[0].c_avatar,
        },
      });
    }
  });
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
