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

// eslint-disable-next-line no-undef
app.set('views',path.join(__dirname,'views'));

// seting the ejs is the engine
app.set('view engine', 'ejs');

// setting the css folder 
// eslint-disable-next-line no-undef
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
const e = require('connect-flash');

app.use(passport.initialize());
app.use(passport.session());
app.use((request, response, next)=>{
  response.locals.messages = request.flash();
  next();
});

passport.use(
  "admin",
  new LocalStrategy({
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
  let role;

if (user instanceof Voters) {
  role = "Voter";
} else if (user instanceof Users) {
  role = "User";
}
  done(null,user.id,role);
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

app.post('/session',passport.authenticate('admin',{
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

// add new election
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

// to fetch particualr election data
app.get(
  "/elections/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
      
        const election = await Elections.findByPk(request.params.id);
        return response.json(election);
         }
);

// update Election Name
app.put('/updateElection/:id',
connectEnsureLogin.ensureLoggedIn(),
async (request, response) => {
  const election = await Elections.findByPk(request.params.id);
  console.log(request.body);
  if(request.body.name !=election.name)
  {
    updatedElectionName = await election.updateElection(request.body.name);
    request.flash("success", "Edited election name successfully");
  }
  else{
    request.flash("success", "name is allready uptodate");
  }
}

);


app.put(
  "/updateElectionStatus/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
      const election = await Elections.findByPk(request.params.id);
      let updatedElection,
        updated = false,
        invalid = false;
        if (
          "start" in request.body &&
          election.start === false &&
          request.body.start === true
        ) {
          if (await election.doesElectionHaveEnoughQuestions(request.params.id)) {
            request.flash(
              "error",
              "A minimum of 1 question is required to start the election."
            );
            invalid = true;
          }

          if (await election.doesElectionHaveEnoughOptions(request.params.id)) {
            request.flash(
              "error",
              "A minimum of 2 options per question is required to start the election."
            );
            invalid = true;
          }
          //console.log("Election Data:", election);

          if (!(await election.doesElectionHaveEnoughVoters(request.params.id))) {
            request.flash(
              "error",
              "A minimum of 2 voters is required to start the election."
            );
            invalid = true;
          //console.log("doesElectionHaveEnoughVoters Called");
          }
          

          if (!invalid) {
            updatedElection = await election.setElectionStart(request.body.start);
            updated = true;
            request.flash("success", "Started election successfully");
          }
          updated = true;
        }

        if (
          "end" in request.body &&
          election.end === false &&
          request.body.end === true
        ) {
          updatedElection = await election.setElectionEnd(request.body.end);
          updated = true;
          request.flash("success", "Ended election successfully");
        }

        if (!updated)
          return response
            .status(422)
            .json({ message: "Missing name, start and/or end property" });

        return response.json(updatedElection);
    
   
  }
);

// delete a particular election
app.delete(
  "/elections/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
        await Elections.removeElectionByID(request.params.id, request.user.id);
        return response.json({ success: true });
      
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

// voter add request with checking of each voter should be unique for each election
app.post(
  "/voters/:eid",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    try {
    
      const existingVoter = await Voters.findOne({
        where: {
          voterId: request.body.voter_id,
          electionId: request.params.eid,
        },
      });

      if (existingVoter) {
        request.flash("error", "Voter ID must be unique for each election");
        return response.redirect(`/elections/${request.params.eid}/ballotform`);
      }

      if (!request.body.voter_id) {
        request.flash("error", "Voter ID can't be empty");
        return response.redirect(`/elections/${request.params.eid}/ballotform`);
      }

      if (!request.body.password) {
        request.flash("error", "Password can't be empty");
        return response.redirect(`/elections/${request.params.eid}/ballotform`);
      }

      await Voters.addVoter(
        request.body.voter_id,
        await bcrypt.hash(request.body.password, saltRounds),
        request.params.eid
      );

      return response.redirect(`/elections/${request.params.eid}/ballotform`);
    } catch (error) {
      console.error("Error:", error);
      return response.redirect(`/elections/${request.params.eid}/ballotform`);
    }
  }
);

app.post(
  "/option/:eid/:qid",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    if(!request.body.title)
    {
      request.flash("error", "option title can't be empty");
      return response.redirect(`/elections/${request.params.eid}/ballotform`);
    }  
    try{
      await Options.addOptionToQuestion(
        request.body.title,
        request.params.qid
      );
      // request.flash("error", "Option has been added");
      return response.redirect(`/elections/${request.params.eid}/ballotform`);
    }
    catch(error){
      // console.log(error);
      // request.flash("error", "catch Executed");
      return response.redirect(`/elections/${request.params.eid}/ballotform`);
    }
  }
);


// to fetch the particualr question of an election 
app.get(
  "/elections/:eid/questions/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    
        const question = await Questions.findByPk(request.params.id);
        return response.json(question);
         
    }
);

// to update the particular question details
app.put(
  "/elections/:eid/questions/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    
      const question = await Questions.findByPk(request.params.id);
      console.log(request.body);
      let updated = false,
        updatedQuestion;
     
        if ("title" in request.body) {
          updatedQuestion = await question.titleUpdater(request.body.title);
          updated = true;
        }

        if ("description" in request.body) {
          updatedQuestion = await question.descriptionUpdater(
            request.body.description
          );
          updated = true;
        }

        if (updated) {
          return response.json(updatedQuestion);
        }
    }
);

// to fetch particular option 
app.get(
  "/elections/:eid/questions/:qid/options/:oid",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {   
        const option = await Options.findByPk(request.params.oid);
        return response.json(option);    
    }
);

// to update the option

app.put(
  "/elections/:eid/questions/:qid/options/:oid",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
   
      const option = await Options.findByPk(request.params.oid);
     
      let updated = false,
        updatedOption;
        if ("title" in request.body) {
          updatedOption = await option.updateOption(request.body.title);
          updated = true;
        }

        if (updated) {
          return response.json(updatedOption);
        }
    }
);

// to delete the option
app.delete(
  "/elections/:eid/questions/:qid/options/:oid",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    
        await Options.delete(request.params.oid, request.params.qid);
        return response.json({ success: true }); 
   
  }
);

// to delete particular voter
app.delete(
  "/elections/:eid/voters/:vid",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
        await Voters.delete(request.params.eid, request.params.vid);
        return response.json({ success: true });    
    }
  
);

// Election Preview 

app.get(
  "/electionsPreview/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
     
        const election = await Elections.findByPk(request.params.id, {
          include: [{ model: Questions, include: Options }, { model: Voters }],
        });
        console.log(JSON.stringify(election, null, 2));
        return response.render("electionPreview", {
          title: 'Election Preview',
          csrfToken: request.csrfToken(),
          user: request.user,
          election,
        });
    }
);


// Ballot Casting Portal (Public Page) Logic Start
app.get("/ballotCastingPortal/:id", async (request, response) => {
  try {
    const election = await Elections.findByPk(request.params.id, {
      include: [{ model: Questions, include: Options }, { model: Voters }],
    });

    if (!election) {
      renderError(response, 404, "Not Found", "Election Id Not Valid");
    } else if (!election.start) {
      renderError(response, 403, "Forbidden", "The election is not yet open for voting");
    } else if (election.end) {
      response.redirect(`/elections/${request.params.id}/viewResults`);
    } else {
      handleVoterRedirect(response, request.user, election, request.params.id);
    }
  } catch (error) {
    console.error("Error:", error);
    renderError(response, 500, "Internal Server Error", "An unexpected error occurred");
  }
});

function renderError(response, errorCode, errorStatus, errorMessage) {
  response.status(errorCode).render("error", {
    title: "error",
    errorCode,
    errorStatus,
    errorMessage,
  });
}

function handleVoterRedirect(response, user, election, electionId) {
  if (user instanceof Voters) {
    response.redirect(`/ballotCastingPortal/${electionId}/vote`);
  } else {
    response.render("ballotCastingPortal", {
      title: "Ballot Casting Portal",
      csrfToken: response.req.csrfToken(),
      user,
      election,
    });
  }
}
// Ballot Casting Portal (Public Page) Logic End

// authetication strategy for Voter only

passport.use('voter', new LocalStrategy({
  usernameField: 'voterId',
  passwordField: 'password',
  passReqToCallback: true,
}, async (request, username, password, done) => {
  try {
    const voter = await Voters.findOne({
      where: {
        voterId: username,
        electionId: request.params.eid,
      },
    });

    if (voter) {
      const isPasswordValid = await bcrypt.compare(password, voter.password);

      if (isPasswordValid) {
        return done(null, voter);
      } else {
        return done(null, false, { message: 'Password is not correct' });
      }
    } else {
      return done(null, false, { message: 'Voter Id is not correct' });
    }
  } catch (err) {
    return done(err);
  }
}));

//session voter for login voter only
app.post(
  "/sessionVoter/:eid",
  function (request, response, next) {
    const callback = passport.authenticate("voter", {
      failureRedirect: `/ballotCastingPortal/${request.params.eid}`,
      failureFlash: true,
    });
    return callback(request, response, next);
  },
  (request, response) => {
    console.log(request.user);
    response.redirect(`/ballotCastingPortal/${request.params.eid}/vote`);
  }
);


app.delete(
  "/elections/:eid/questions/:qid",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
        await Questions.delete(request.params.eid, request.params.qid);
        return response.json({ success: true });  
    }
  
);

module.exports = app;
