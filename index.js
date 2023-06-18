const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const cors = require("cors");
const port = process.env.PORT || 5000;
const generateDocFile = require("./routes/api/generateDocFile");
const deleteDownloadFile = require("./routes/api/deleteDownloadFile");

app.use(cors());

app.use(bodyParser.json());

app.use("/downloads", express.static(__dirname + "/downloads"));
app.use("/api/generateDoc", generateDocFile);
app.use("/api/deleteFile", deleteDownloadFile);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`app listen on port ${port}`);
});
