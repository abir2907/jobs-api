require("dotenv").config();
require("express-async-errors");
const path = require("path");

// extra security packages
const helmet = require("helmet");
const cors = require("cors");
const xss = require("xss-clean");
// const rateLimiter = require("express-rate-limit");

// swagger
const swaggerUI = require("swagger-ui-express");
const YAML = require("yamljs");
const swaggerDocument = YAML.load(path.join(__dirname, "./swagger.yaml"));

const express = require("express");
const app = express();

// connectDB
const connectDB = require("./db/connect");

const authenticateUser = require("./middleware/authentication");

// routers
const authRouter = require("./routes/auth");
const jobsRouter = require("./routes/jobs");

// error handler
const notFoundMiddleware = require("./middleware/not-found");
const errorHandlerMiddleware = require("./middleware/error-handler");
const { applyTimestamps } = require("./models/Job");

// extra packages
app.use(express.json());
// app.set("trust proxy", 1 /* number of proxies between user and server */);
// app.use(
//   rateLimiter({
//     windowMs: 15 * 60 * 1000, // 15 minutes
//     limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
//   })
// );
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "validator.swagger.io"],
        connectSrc: ["'self'"],
      },
    },
  })
);
app.use(cors());
app.use(xss());

// routes
app.get("/", (req, res) => {
  res.send(`<h1>Jobs API</h1><a href = "/api-docs">Documentation</a>`);
});
app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(swaggerDocument));
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/jobs", authenticateUser, jobsRouter);

app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

const port = process.env.PORT || 3000;

const start = async () => {
  try {
    await connectDB(process.env.MONGO_URI);
    app.listen(port, () =>
      console.log(`Server is listening on port ${port}...`)
    );
  } catch (error) {
    console.log(error);
  }
};

start();
