/** @format */
const express = require("express");
const router = express.Router();

const adminInfo = require("../../constant.json");

router.post("/", (req, res) => {
  const { email, password } = req.body;

  if (email === adminInfo.email && password === adminInfo.password) {
    return res.json("success");
  } else {
    return res.json("failed");
  }
});

module.exports = router;
