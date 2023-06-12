const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const cors = require("cors");
const port = process.env.PORT || 5000;
const generateDocFile = require("./routes/api/generateDocFile");

app.use(cors());

app.use(bodyParser.json());

app.use("/api/generateDoc", generateDocFile);
app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`app listen on port ${port}`);
});
