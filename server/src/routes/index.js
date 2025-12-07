const errorHandler = require('../middlewares/error.handle');
const userRouter = require('./user.router');

module.exports = (app) => {
  // app.use('/api/accounts', accountRouter);
  // app.use('/api/categories', categoryRouter);
  // app.use('/api/products', productRouter);

  app.use('/api/users', userRouter);

  app.use(errorHandler);
};
