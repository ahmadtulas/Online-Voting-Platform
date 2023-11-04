const app = require('./app');
app.listen(process.env.PORT || 3002, ()=>{
  console.log('Online Voting Plateform service has been started--->');
});
