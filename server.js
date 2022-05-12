const express = require("express");
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const app = express();

// middleware
app.use(cors());
app.use(express.json());

const verifyJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  console.log(authHeader);
  if (!authHeader) {
    res.status(401).send({ message: "Reauthorized Access" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
    if (err) {
      res.status(403).send({ message: "Forbidden Access" });
    }
    req.decoded = decoded;
    next();
  });
};

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster1.jggf1.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    client.connect();
    const productCollection = client.db("EmaJohn").collection("products");

    // Load products
    app.get("/products", async (req, res) => {
      const page = parseInt(req.query.page);
      const query = {};
      const cursor = productCollection.find(query);
      let products;
      if (page) {
        products = await cursor
          .skip(page * 10)
          .limit(10)
          .toArray();
      } else {
        products = await cursor.limit(10).toArray();
      }
      res.send(products);
    });

    // Count Product
    app.get("/count", async (req, res) => {
      const count = await productCollection.estimatedDocumentCount();
      res.send({ count });
    });

    // Setting Cart Product
    app.post("/cartProducts", verifyJWT, async (req, res) => {
      const uid = req.body.uid;
      const decodedUid = req.decoded.uid;

      if (uid === decodedUid) {
        const keys = req.body.keys;
        const ids = keys.map((id) => ObjectId(id));
        const query = { _id: { $in: ids } };
        const cursor = productCollection.find(query);
        const result = await cursor.toArray();
        res.send(result);
      }
    });

    // Get Token
    app.post("/getToken", async (req, res) => {
      const user = req.body.userId;
      const accessToken = jwt.sign({ user }, process.env.ACCESS_TOKEN, {
        expiresIn: "1d",
      });
      res.send({ accessToken });
    });
  } finally {
    // client.close()
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Welcome to Ema John server");
});

app.listen(port, () => {
  console.log("Server Running on: ", port);
});
