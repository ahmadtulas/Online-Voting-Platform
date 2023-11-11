const app = require('../app');
const request = require('supertest');

// sample test for cheking jest is working or not. 
test('GET / route returns status 200', async () => {
    const response = await request(app).get('/');
  
    expect(response.status).toBe(200);
  });
  