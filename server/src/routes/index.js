const errorHandler = require('../middlewares/error.handle');
const labRouter = require('./lab.router');



module.exports = (app) => {
  app.use('api/labs', labRouter);

  app.use(errorHandler);
};
