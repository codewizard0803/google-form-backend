/** @format */

const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const Doc = require("../../modal/doc");

router.post("/", async (req, res) => {
  const zipPath = path.join(__dirname, "../../downloads", req.body.zipFileName);

  if (zipPath && fs.existsSync(zipPath)) {
    fs.unlink(zipPath, (err) => {
      if (err) {
        console.log(err);
      } else {
        Doc.findOneAndDelete({ fileName: req.body.zipFileName }).then(() => {
          return res.json("Success");
        });
      }
    });
  }
});

module.exports = router;
