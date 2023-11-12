const request = require("supertest");
const cheerio = require("cheerio");

const db = require("../models/index");
const app = require("../app");

let server, agent;

function extractTokenOfCSRF(res) {
  let $ = cheerio.load(res.text);
  return $("[name=_csrf]").val();
}

describe("User Test Suite", () => {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    server = app.listen(3005, () => {});
    testAgent = request.agent(server);
    await testAgent.get("/");
  });

  afterAll(async () => {
    await db.sequelize.close();
    server.close();
  });

  test("User Registration: Sign up for a new account", async () => {
    let signupResponse = await testAgent.get("/signup");
    const csrfToken = extractTokenOfCSRF(signupResponse);

    let registrationResponse = await testAgent.post("/users").send({
      firstName: "Ahmad",
      lastName: "Jamal",
      email: "ahmadjamalcs@gmail.com",
      password: "plmnko",
      _csrf: csrfToken,
    });

    expect(registrationResponse.statusCode).toBe(302);
  });

  test("User Authentication: Log in with registered credentials", async () => {
    let loginResponse = await testAgent.get("/login");
    const csrfToken = extractTokenOfCSRF(loginResponse);
  
    let authenticationResponse = await testAgent.post("/session").send({
      email: "ahmadjamalcs@gmail.com",
      password: "plmnko",
      _csrf: csrfToken,
    });
  
    expect(authenticationResponse.statusCode).toBe(302);
    expect(authenticationResponse.header["location"]).toBe("/dashboard");
  });

  test("User A: Log in", async () => {
    let res = await testAgent.get("/login");
    const csrfToken = extractTokenOfCSRF(res);
    res = await testAgent.post("/session").send({
      email: "ahmadjamalcs@gmail.com",
      password: "plmnko",
      _csrf: csrfToken,
    });
    expect(res.statusCode).toBe(302);
  });
  
  test("User A: Access Dashboard after Log in", async () => {
    let res = await testAgent.get("/dashboard");
    expect(res.statusCode).toBe(200);
  });

  let electionId;
  test("User A: Create a new election", async () => {
    const addElectionPageResponse = await testAgent.get("/dashboard");
    const csrfToken = extractTokenOfCSRF(addElectionPageResponse);
    console.log("CSRF Token:", csrfToken);
    const createElectionResponse = await testAgent
      .post("/addElection")
      .send({
        electionName: "Test Election",
        _csrf: csrfToken,
      });
  
    expect(createElectionResponse.statusCode).toBe(302);
    electionId = 1;
  });
  

  test("User A: Access Ballot Form for the created election", async () => {
    const ballotFormResponse = await testAgent.get(`/elections/${electionId}/ballotForm`);
    expect(ballotFormResponse.statusCode).toBe(200);
  });

  test("User A: Sign out", async () => {
 
    const signoutResponse = await testAgent.get("/signout");
    expect(signoutResponse.statusCode).toBe(302);
    expect(signoutResponse.header["location"]).toBe("/");
  });
  
});
