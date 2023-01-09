/* eslint-disable no-unused-vars */
const {request, response} = require('express');
const express = require('express');
const app = express();
const csrf = require('tiny-csrf');

const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

const passport = require('passport');
const connectEnsureLogin = require('connect-ensure-login');
const session = require('express-session');
const LocalStrategy = require('passport-local');

const bcrypt = require('bcrypt');
const saltRounds = 10;

const flash = require('connect-flash');

app.use(express.urlencoded({extended: false}));
const path = require('path');

app.set('views',path.join(__dirname,'views'));

// seting the ejs is the engine
app.set('view engine', 'ejs');

// setting the css folder 
app.use(express.static(path.join(__dirname, 'public')));

app.use(flash());

app.use(bodyParser.json());
app.use(cookieParser('ssh!!!! some secret string'));
app.use(csrf('this_should_be_32_character_long', ['POST', 'PUT', 'DELETE']));

app.use(session({
  secret:"this is my secret-112333444455556",
  cookie:{
    maxAge: 24 * 60 * 60 * 1000 // that will be equal to 24 Hours / A whole day
  }
}))

// user model imported here
const {
  Users,Elections,Questions, Options, Voters, Votes
} = require("./models");

app.use(passport.initialize());
app.use(passport.session());
app.use((request, response, next)=>{
  response.locals.messages = request.flash();
  next();
});

passport.use(new LocalStrategy({
  usernameField: 'email',
  password: 'password',
},(username, password, done) => {
  Users.findOne({
    where:{
      email:username,
      
    }
  })
  .then(async(user) => {
    const result = await bcrypt.compare(password, user.password);
    if(result){
      return done(null,user);
    } else{
      return done(null, false, {message: "Invalid Password"});
    }
  })
  .catch((error) => {
    console.error(error);
    return done(null,false,{
      message: "You are not a registered user",
    })

  })
}))

passport.serializeUser((user, done)=>{
  console.log("Serializing user in session",user.id)
  done(null,user.id);
});

passport.deserializeUser((id,done) => {
  Users.findByPk(id)
  .then(user => {
    done(null, user)
  })
  .catch(error =>{
    done(error, null)
  })
})

app.get('/', async (request, response)=>{
  if(request.user)
  {
    response.redirect('/dashboard');
  }
  else{  
  response.render('index', {
      title: 'Online Voting Platform',
      csrfToken: request.csrfToken(),
    });
  }
});

app.get('/signup',(request,response)=>{
  response.render('signup',{
    title: 'Sign Up',
    csrfToken: request.csrfToken(),
  });
});

app.post("/users", async (request, response) => {
  let hashedPwd = await bcrypt.hash(request.body.password, saltRounds);
  if (request.body.password === "") hashedPwd = "";
  try {
    const user = await Users.create({
      firstName: request.body.firstName,
      lastName: request.body.lastName,
      email: request.body.email,
      password: hashedPwd,
    });
    request.login(user, (err) => {
      if (err) {
        console.log(err);
      }
      response.redirect("/dashboard");
    });
  } catch (error) {
    console.log(error);
    if ("errors" in error)
      request.flash(
        "error",
        error.errors.map((error) => error.message)
      );
    response.redirect("/signup");
  }
});

app.get('/dashboard',connectEnsureLogin.ensureLoggedIn(),async (request,response)=>{
  const currentUserId = request.user.id;
  const elections = await Elections.findAllElectionOfUser(currentUserId);  
  response.render('dashboard',{
    title: 'Dashboard',
    elections,
    csrfToken: request.csrfToken(),
  });
});

app.get('/login',(request,response)=>{
  response.render('login',{
    title:"Login",
    csrfToken: request.csrfToken(),
  });
});

app.post('/session',passport.authenticate('local',{
  failureRedirect: '/login',
  failureFlash: true,
}),(request,response)=>{
  console.log(request.user);
  response.redirect('/dashboard');
})

app.get('/signout',(request,response, next) => {
  request.logOut((err)=>{
    if(err)
    {
      return next(err);
    }
    response.redirect('/');
  })
})

app.post(
  "/addElection",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    if(!request.body.electionName)
    {
      request.flash("error", "Election name can't be empty");
      return response.redirect("/dashboard");
    }  
    try {
        const loggedInUser = request.user.id;
        await Elections.createNewElection(request.body.electionName, loggedInUser);
        request.flash("success", "New election has been added");
        return response.redirect("/dashboard");
      } catch (error) {
        console.log(error);
        if ("errors" in error)
          request.flash(
            "error",
            error.errors.map((error) => error.message)
          );
        return response.redirect("/dashboard");
      }
    }

);

// Election Ballot form Management  
app.get('/elections/:id/ballotForm',
connectEnsureLogin.ensureLoggedIn(),
    async (request, response) => {
    try{
      const election = await Elections.findByPk(request.params.id, {
        include: [
          { model: Questions, include: Options },
          { model: Voters, include: Votes },
        ],
      });
      return response.render("ballotForm", {
        csrfToken: request.csrfToken(),
        user: request.user,
        title: 'Ballot(Question/Voters)',
        election,
      });
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
});
// Question add request
app.post(
  "/question/:eid",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    if(!request.body.title)
    {
      request.flash("error", "Question can't be empty");
      return response.redirect(`/elections/${request.params.eid}/ballotform`);
    }  
    try{
      await Questions.addQuestion(
        request.body.title,
        request.body.description,
        request.params.eid
      );
      return response.redirect(`/elections/${request.params.eid}/ballotform`);
    }
    catch(error){
      console.log(error);
      return response.redirect(`/elections/${request.params.eid}/ballotform`);
    }
  }
);


module.exports = app;
