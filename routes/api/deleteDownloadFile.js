const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");

router.post("/", async (req, res) => {
  const storyPath = path.join(
    __dirname,
    "../../downloads",
    req.body.fileStoryURL
  );

  const qaPath = path.join(__dirname, "../../downloads", req.body.fileQaURL);

  let storyBool = false;
  let qaBool = false;

  if (storyPath && fs.existsSync(storyPath)) {
    fs.unlink(storyPath, (err) => {
      if (err) {
        console.log(err);
      } else {
        storyBool = true;
      }
    });
  }

  if (qaPath && fs.existsSync(qaPath)) {
    fs.unlink(qaPath, (err) => {
      if (err) {
        console.log(err);
      } else {
        qaBool = true;
      }
    });
  }

  if (storyBool === true && qaBool === true) {
    res.json("Success");
  }
});

module.exports = router;
