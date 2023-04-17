const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const mysql = require("mysql");

const connection = {
  host: "161.35.34.173",
  port: 3306,
  user: "user",
  password: "password",
  database: "db",
  insecureAuth: true,
};

app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.listen(5000, () => {
  console.log("Listening to port 5000");
});

app.get("/users", (req, res) => {
  const data = req.query;
  let query;
  if (data == null) {
	query = 'SELECT * FROM USERS;';
  } else if (data.mail && data.pass) {
	const mail = data.mail;
	const pass = data.pass;
	query = `SELECT * FROM USERS WHERE MAIL = '${mail}' AND PASSWORD = '${pass}';`;
  } else {
	const mail = data.mail;
	query = `SELECT * FROM USERS WHERE MAIL = '${mail}';`;
  }
  let conn = mysql.createConnection(connection);
  conn.query(
    query,
    (err, re) => {
		if (err) console.log(err);
		res.status(200).send({ result: re });
    }
  );
  conn.end;
});

app.post("/users/create", (req, res) => {
  const data = req.body;
  let conn = mysql.createConnection(connection);
  conn.query(
    `INSERT INTO USERS (MAIL, PASSWORD, NAME, SURNAME) VALUES ('${data.mail}', '${data.pass}', '${data.name}', '${data.surname}')`,
    (err, re) => {
      if (err) {
		res.status(200).send({ success: false});
	  } else {
		res.status(200).send({ success: true })
	  }
    }
  );
  conn.end;
});

