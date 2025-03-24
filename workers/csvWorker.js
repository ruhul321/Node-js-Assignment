// workers/csvWorker.js
const { parentPort, workerData } = require("worker_threads");
const fs = require("fs");
const csv = require("csv-parser");
const mongoose = require("mongoose");
const moment = require("moment");

(async () => {
  try {
    await mongoose.connect(
      "mongodb+srv://ruhulc334:ZVi53MWYX4kk9VRt@cluster0.2qo9m.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
    console.log("Worker thread connected to MongoDB");

    // Import models only after connection is established.
    const Agent = require("../models/Agent");
    const User = require("../models/User");
    const Account = require("../models/Account");
    const LOB = require("../models/LOB");
    const Carrier = require("../models/Carrier");
    const Policy = require("../models/Policy");

    const results = [];
    fs.createReadStream(workerData.filePath)
      .pipe(csv())
      .on("data", (data) => {
        // Log CSV keys to verify header names (remove after verification)
        //console.log(Object.keys(data));
        results.push(data);
      })
      .on("end", async () => {
        try {
          for (const row of results) {
            // Parse the date of birth using the correct header 'dob'
            const dobString = row["dob"];
            if (!dobString) {
              console.error(`DOB not provided for email ${row["email"]}`);
              continue;
            }
            const dobMoment = moment(
              dobString,
              ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD", "DD-MM-YYYY"],
              true
            );
            if (!dobMoment.isValid()) {
              console.error(
                `Invalid DOB format for email ${row["email"]}: ${dobString}`
              );
              continue;
            }
            const validDOB = dobMoment.toDate();

            // Parse policy start and end dates using correct headers
            const policyStartString = row["policy_start_date"];
            const policyEndString = row["policy_end_date"];
            const startMoment = moment(
              policyStartString,
              ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD", "DD-MM-YYYY"],
              true
            );
            const endMoment = moment(
              policyEndString,
              ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD", "DD-MM-YYYY"],
              true
            );
            if (!startMoment.isValid() || !endMoment.isValid()) {
              console.error(
                `Invalid policy date format for policy number ${row["policy_number"]}`
              );
              continue;
            }
            const validPolicyStart = startMoment.toDate();
            const validPolicyEnd = endMoment.toDate();

            // Insert or update Agent info using 'agent'
            const agent = await Agent.findOneAndUpdate(
              { name: row["agent"] },
              { name: row["agent"] },
              { upsert: true, new: true }
            );

            // Insert or update User info using 'firstname', 'dob', etc.
            const user = await User.findOneAndUpdate(
              { email: row["email"] },
              {
                firstName: row["firstname"],
                dob: validDOB,
                address: row["address"],
                phoneNumber: row["phone"],
                state: row["state"],
                zipCode: row["zip"],
                email: row["email"],
                gender: row["gender"],
                userType: row["userType"],
              },
              { upsert: true, new: true }
            );

            // Insert or update Account info using 'account_name'
            const account = await Account.findOneAndUpdate(
              { accountName: row["account_name"] },
              { accountName: row["account_name"] },
              { upsert: true, new: true }
            );

            // Insert or update LOB (Policy Category) using 'category_name'
            const lob = await LOB.findOneAndUpdate(
              { categoryName: row["category_name"] },
              { categoryName: row["category_name"] },
              { upsert: true, new: true }
            );

            // Insert or update Policy Carrier using 'company_name'
            const carrier = await Carrier.findOneAndUpdate(
              { companyName: row["company_name"] },
              { companyName: row["company_name"] },
              { upsert: true, new: true }
            );

            // Create Policy Info using the mapped fields
            const policy = new Policy({
              policyNumber: row["policy_number"],
              policyStartDate: validPolicyStart,
              policyEndDate: validPolicyEnd,
              policyCategoryId: lob._id,
              carrierId: carrier._id,
              userId: user._id,
              agentId: agent._id,
              accountId: account._id,
            });
            await policy.save();
          }
          parentPort.postMessage(
            "All data processed and inserted successfully."
          );
        } catch (error) {
          parentPort.postMessage(`Error processing data: ${error.message}`);
        } finally {
          fs.unlink(workerData.filePath, (unlinkErr) => {
            if (unlinkErr) {
              console.error("Error deleting file:", unlinkErr);
            }
          });
          process.exit();
        }
      });
  } catch (err) {
    console.error("Error connecting to MongoDB in worker:", err);
    parentPort.postMessage(`Error connecting to MongoDB: ${err.message}`);
    process.exit(1);
  }
})();
