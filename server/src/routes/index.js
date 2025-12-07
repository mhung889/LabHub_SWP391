const errorHandler = require("../middlewares/error.handle");
const labRouter = require("./lab.router");
const studentRouter = require("./student.router");
const majorRouter = require("./major.router");

module.exports = (app) => {
  // mount routes
  app.use("/api/labs", labRouter);
  app.use("/api/students", studentRouter);
  app.use("/api/majors", majorRouter);


  
  app.use(errorHandler);
};
