const Major = require("../models/major-model");

exports.getAllMajors = async (req, res) => {
  const majors = await Major.find();
  res.json({ majors });
};
