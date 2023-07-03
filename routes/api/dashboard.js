/** @format */

const express = require("express");
const router = express.Router();
const Doc = require("../../modal/doc");

router.get("/", async (req, res) => {
  await Doc.find()
    .then((data) => res.json(data))
    .catch((err) => res.json("Server Error"));
});

module.exports = router;
