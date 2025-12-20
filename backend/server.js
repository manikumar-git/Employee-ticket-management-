const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/tickets", require("./routes/tickets"));
app.use("/auth", require("./routes/auth"));
app.use("/admin", require("./routes/admin"));
app.use("/uploads", express.static("uploads"));




app.listen(3001, () => {
  console.log("Backend running on http://localhost:3001");
});
