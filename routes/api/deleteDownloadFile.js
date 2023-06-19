const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");

router.post("/", async (req, res) => {
  console.log("res", req.body);
  const zipPath = path.join(__dirname, "../../downloads", req.body.zipName);

  if (zipPath && fs.existsSync(zipPath)) {
    fs.unlink(zipPath, (err) => {
      if (err) {
        console.log(err);
      } else {
        res.json("Success");
      }
    });
  }
});

module.exports = router;
