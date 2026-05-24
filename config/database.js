const mongoose = require("mongoose");

const url = process.env.MONGO_URL;

console.log("DB URL:", url);

if (!url) {
  console.log("MONGO_URL NOT FOUND");
  process.exit(1);
}

mongoose.connect(url, {
  serverSelectionTimeoutMS: 5000,
  maxPoolSize: 10,
})
  .then(() => {
    console.log("Mongo Connected");
  })
  .catch((err) => {
    console.log("MongoDB Connection Error:", err.message);
  });

mongoose.connection.on("connected", () => {
  console.log("Mongoose connected to DB");
});

mongoose.connection.on("error", (err) => {
  console.log("Mongoose connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.log("Mongoose disconnected");
});