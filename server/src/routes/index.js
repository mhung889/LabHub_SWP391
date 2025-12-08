const errorHandler = require('../middlewares/error.handle');
const labRouter = require('./lab.router');
const accountRouter = require('./account.router');
const mentorRouter = require('./mentor.router');
const majorRouter = require('./major.router');
const studentRouter = require('./student.router');

module.exports = (app) => {
  app.use('/api/labs', labRouter);
  app.use('/api/auth', accountRouter);
  app.use('/api/mentors', mentorRouter);
  app.use('/api/students', studentRouter);
  app.use('/api/majors', majorRouter);

  
  app.use(errorHandler);
};
