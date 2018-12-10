const mysql = require('mysql');

function helloworld(params) {
  return new Promise((resolve, reject) => {
    // Default values set here
    const name = params.name || 'stranger';
    getGreeting(name, message => resolve({ message }));
  });
}

function getGreeting(name, callback) {
  // Get special greeting from database here
  const dbconn = mysql.createConnection({
    host: 'mysql',
    user: 'myuser',
    password: 'myuser',
    database: 'mydb'
  });

  // Default greeting
  let greeting = "Hello";
  try {
    dbconn.connect((err) => {
      if (err) throw err;
    });
  } catch (error) {
    // TODO: Handle error
  }

  try {
    const qry = `SELECT custom_greeting FROM personal_greeting WHERE first_name = "${name}"`;
    dbconn.query(qry, (err, rows) => {
      if (err) throw err;
      if (rows.length > 0) {
        greeting = rows[0].custom_greeting;
      }
      callback(`${greeting}, ${name}`);
    });
  } catch (error) {
    // TODO: Handle error
  };
  dbconn.end();
}

exports.main = helloworld;