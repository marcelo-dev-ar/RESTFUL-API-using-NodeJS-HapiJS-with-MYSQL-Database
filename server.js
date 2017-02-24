'use strict';
const Hapi = require('hapi');
const Joi = require('joi');
const MySQL = require('mysql');
const Bcrypt = require('bcryptjs');

// Create a server with a host and port
const server = new Hapi.Server();

const connection = MySQL.createConnection({
     host: 'localhost',
     user: 'root',
     password: '',
     database: 'test'
});

server.connection({
    host: 'localhost',
    port: 8000
});

connection.connect();

// Add the route
server.route({
    method: 'GET',
    path:'/welcome',
    handler: function (request, reply) {
    return reply('Welcome');
}
});

// Get users list
server.route({
    method: 'GET',
    path: '/users',
    handler: function (request, reply) {
       connection.query('SELECT user_id, username, email FROM users',
       function (error, results, fields) {
       if (error) throw error;

       reply(results);
    });
  }
});

// Get individual user information
server.route({
    method: 'GET',
    path: '/user/{user_id}',
    handler: function (request, reply) {
    const user_id = request.params.user_id;

    connection.query('SELECT user_id, username, email FROM users WHERE user_id = "' + user_id + '"',
    function (error, results, fields) {
       if (error) throw error;

       reply(results);
    });
    },
   config: {
       validate: {
        params: {
        user_id: Joi.number().integer()
       }
  }
}
});
// Create a user
server.route({
    method: 'POST',
    path: '/signup',
    handler: function (request, reply) {
    const username = request.payload.username;
    const email = request.payload.email;
    const password = request.payload.password;

    //Encryption
    var salt = Bcrypt.genSaltSync();
    var encryptedPassword = Bcrypt.hashSync(password, salt);

    //Decrypt
    var orgPassword = Bcrypt.compareSync(password, encryptedPassword);

    connection.query('INSERT INTO users (username,email,password) VALUES ("' + username + '","' + email + '","' + encryptedPassword + '")',
    function (error, results, fields) {
        if (error) throw error;

        reply(results);
    });
},
config: {
      validate: {
       payload: {
          username: Joi.string().alphanum().min(3).max(30).required(),
          email: Joi.string().email(),
          password: Joi.string().regex(/^[a-zA-Z0-9]{8,30}$/)
       }
    }
}
});
// Delete a user
server.route({
    method: 'DELETE',
    path: '/user/{user_id}',
    handler: function (request, reply) {
    const user_id = request.params.user_id;
    connection.query('DELETE FROM users WHERE user_id = "' + user_id + '"',
    function (error, result, fields) {
       if (error) throw error;

       if (result.affectedRows) {
           reply(true);
       } else {
           reply(false);
       }
});
},
config: {
     validate: {
     params: {
       user_id: Joi.number().integer()
      }
     }
}
});



server.start((err) => {
   if (err) {
     throw err;
   }
  console.log('Server running at:', server.info.uri);
});