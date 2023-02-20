// Copyright 2023, Ryan Stone, All rights reserved.

const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');

const app = express();
const port = 3000;

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

// create connection to MySQL database
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'admin',
  password: 'password',
  database: 'login_system'
});

// handle user registration request
app.post('/signup', (req, res) => {
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const email = req.body.email;
    const username = req.body.username;
    const consoleType = req.body.consoleType;
    const location = req.body.location;
    const boss = req.body.boss;
  
    // generate unique user_id
    let userId = generateUserId();
    checkUserIdExists(userId, (exists) => {
      // keep generating new userIds until we get one that doesn't exist
      while (exists) {
        userId = generateUserId();
      }
  
      // hash user's password
      bcrypt.hash(req.body.password, 10, (err, hash) => {
        if (err) {
          console.error(err);
          res.status(500).send('Error hashing password');
          return;
        }
  
        // insert user data into database with the unique userId
        const sql = 'INSERT INTO users (user_id, first_name, last_name, email, username, password, console_type, location, boss) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
        const values = [userId, firstName, lastName, email, username, hash, consoleType, location, boss];
  
        connection.query(sql, values, (error, results, fields) => {
          if (error) {
            console.error(error);
            res.status(500).send('Error inserting user data into database');
          } else {
            res.sendStatus(200);
            // REMOVE IN PROD DON'T FORGET, THIS WOULD MESS UP YOUR LOGS!!!!!!
            console.log("SUCCESS, Remove in PROD")
          }
        });
      });
    });
  
    // generate a random 10 digit user_id
    function generateUserId() {
      const min = 1000000000;
      const max = 9999999999;
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }
  
    // check if user_id exists in database
    function checkUserIdExists(userId, callback) {
      const sql = 'SELECT user_id FROM users WHERE user_id = ?';
      connection.query(sql, userId, (error, results, fields) => {
        if (error) {
          console.error(error);
          callback(false); // treat as non-existent to avoid infinite loop
        } else {
          callback(results.length > 0);
        }
      });
    }
  });  

// handle user login request
app.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  // find user by email
  const sql = 'SELECT * FROM users WHERE email = ?';
  connection.query(sql, email, (error, results, fields) => {
    if (error) {
      console.error(error);
      res.status(500).send('Error retrieving user data from database');
      return;
    }

    if (results.length === 0) {
      res.status(401).send('Invalid email or password');
      return;
    }

    // compare password hashes
    const user = results[0];
    bcrypt.compare(password, user.password, (err, result) => {
      if (err) {
        console.error(err);
        res.status(500).send('Error comparing password hashes');
        return;
      }

      if (result) {
        res.send({ userId: user.user_id });
      } else {
        res.status(401).send('Invalid email or password');
      }
    });
  });
});

app.post('/boss', (req, res) => {
  const userId = req.body.userId;

  // Query the database for the user's boss information
  pool.query('SELECT Boss FROM User WHERE UserID = ?', [userId], (error, results, fields) => {
    if (error) {
      console.error(error);
      res.status(500).send('Error retrieving boss information');
    } else {
      if (results.length > 0) {
        // Return the boss information for the given user ID
        res.send(results[0].Boss);
      } else {
        res.status(404).send('User not found');
      }
    }
  });
});
  
// start server on the port in the var above
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});