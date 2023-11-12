// NOTE Server - client architecture testing setup
const request = require("supertest");
// NOTE Used to parse markup language
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
  
});
