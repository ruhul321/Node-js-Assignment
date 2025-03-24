const express = require("express");
const multer = require("multer");
const { Worker } = require("worker_threads");
const os = require("os");
const schedule = require("node-schedule");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");

mongoose.connect(
  "mongodb+srv://ruhulc334:ZVi53MWYX4kk9VRt@cluster0.2qo9m.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => console.log("Connected to MongoDB"));

const Agent = require("./models/Agent");
const User = require("./models/User");
const Account = require("./models/Account");
const LOB = require("./models/LOB");
const Carrier = require("./models/Carrier");
const Policy = require("./models/Policy");
const Message = require("./models/Message");

const app = express();
app.use(bodyParser.json());

const upload = multer({ dest: "uploads/" });

// ==========================
// Task 1 Endpoints
// ==========================

// 1. Upload API (uses worker thread to process file upload)
app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).send("No file uploaded");
  const worker = new Worker("./workers/csvWorker.js", {
    workerData: { filePath: req.file.path },
  });
  worker.on("message", (msg) => {
    res.status(200).send({ status: "Upload Process Completed", details: msg });
  });
  worker.on("error", (err) => {
    console.error("Worker error:", err);
    res.status(500).send({ error: err.message });
  });
});

// 2. Search API to find policy info by username or email (username corresponds firstName in User)
app.get("/search", async (req, res) => {
  const { username, email } = req.query;
  if (!username && !email)
    return res
      .status(400)
      .send(
        "Either 'username' or 'email' query parameter is required. Username is firstName"
      );

  try {
    // Find the user by a unique field (firstName or Email)
    const user = await User.findOne({
      $or: [{ firstName: username }, { email: email }],
    });
    if (!user) return res.status(404).send("User not found");

    const policies = await Policy.find({ userId: user._id });
    res.json({ user, policies });
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
});

// 3. API to provide aggregated policy by each user.
app.get("/aggregatedPolicy", async (req, res) => {
  try {
    const aggregated = await Policy.aggregate([
      {
        $group: {
          _id: "$userId",
          totalPolicies: { $sum: 1 },
          policies: { $push: "$$ROOT" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userDetails",
        },
      },
    ]);
    res.json(aggregated);
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
});

// ==========================
// Task 2 Endpoints
// ==========================

// 1. CPU Utilization Monitor (using a simple setInterval and load average approximation)
setInterval(() => {
  const numCpus = os.cpus().length;
  // We use the 1-minute average as an approximation.
  const loadAvg = os.loadavg()[0];
  const cpuUsagePercent = (loadAvg / numCpus) * 100;
  console.log(`CPU Usage (approx): ${cpuUsagePercent.toFixed(2)}%`);
  if (cpuUsagePercent > 70) {
    console.warn("CPU usage above threshold. Restarting server...");
    process.exit(1);
  }
}, 5000);

// 2. Post-service for scheduling message insertion
app.post("/post-message", async (req, res) => {
  const { message, day, time } = req.body;
  if (!message || !day || !time)
    return res.status(400).send("Message, day, and time are required");

  const scheduledDate = new Date(`${day} ${time}`);
  if (scheduledDate < new Date()) {
    return res.status(400).send("Scheduled time must be in the future");
  }

  schedule.scheduleJob(scheduledDate, async () => {
    try {
      const newMessage = new Message({ message, scheduledAt: scheduledDate });
      await newMessage.save();
      console.log("Message inserted at scheduled time:", newMessage);
    } catch (err) {
      console.error("Error inserting scheduled message:", err);
    }
  });

  res.send("Message scheduled successfully.");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
