const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const mysql = require("mysql");
const admin = require("firebase-admin");
const serviceAccount = require("./dasp-50c3b-firebase-adminsdk-vuuw7-f85d0743c9.json");

const connection = {
  host: "161.35.34.173",
  port: 3306,
  user: "master-user01",
  password: "T8!C3s*2&7",
  database: "POCKET_DB",
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
    `INSERT INTO USERS (MAIL, PASSWORD, NAME, SURNAME, TOKEN) VALUES ('${data.mail}', '${data.pass}', '${data.name}', '${data.surname}', '${data.token}')`,
    (err, re) => {
      if (err) {
        console.log(err);
		    res.status(200).send({ success: false});
      } else {
        res.status(200).send({ success: true })
      }
    }
  );
  conn.end;
});

app.post("/diary/create", (req, res) => {
  const data = req.body;
  let conn = mysql.createConnection(connection);
  const query = `INSERT INTO DIARY (DATE_ROUTINE, MAIL, ROUTINE) VALUES ('${data.date}', '${data.mail}', '${data.routine}');`;
  conn.query(
    query,
    (err, re) => {
      if (err) {
        console.log(err);
        res.status(200).send({ success: false});
      } else {
        res.status(200).send({ success: true })
      }
    }
  );
  conn.end;
});

app.get("/diary", (req, res) => {
  const data = req.query;
  let query;
  if (data == null) {
	  query = 'SELECT * FROM DIARY;';
  } else if (data.mail && data.date) {
    const mail = data.mail;
    const date = data.date;
    query = `SELECT * FROM DIARY WHERE MAIL = '${mail}' AND DATE_ROUTINE = '${date}';`;
  } else if (data.mail && data.month && data.year) {
    const mail = data.mail;
    const month = data.month;
    const year = data.year;
    query = `SELECT DATE_FORMAT(DATE_ROUTINE, '%Y-%m-%d') AS DATE_F FROM DIARY WHERE MONTH(DATE_ROUTINE) = ${month} AND YEAR(DATE_ROUTINE) = ${year} AND MAIL = '${mail}';`;
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
})

app.delete("/diary", (req, res) => {
  const data = req.query;
  let query;
  if (data == null) {
	  query = 'DELETE FROM DIARY;';
  } else if (data.mail && data.date) {
    const mail = data.mail;
    const date = data.date;
    query = `DELETE FROM DIARY WHERE MAIL = '${mail}' AND DATE_ROUTINE = '${date}';`;
  }
  let conn = mysql.createConnection(connection);
  conn.query(
    query,
    (err, re) => {
      if (err) {
        res.status(200).send({ success: false});
      } else {
        res.status(200).send({ success: true })
      }
    }
  );
  conn.end;
})

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

app.post("/routine", (req, res) => {
  const query = "SELECT u.TOKEN, d.ROUTINE FROM USERS u INNER JOIN DIARY d ON u.MAIL = d.MAIL WHERE d.DATE_ROUTINE = CURDATE();";
  let conn = mysql.createConnection(connection);
  conn.query(query, (err, re) => {
      if (err) console.log(err);
      else {
        const message = {
          notification: {
            title: "¡Toca entrenar!",
            body: "Tu rutina es RRR",
          },
          token: re[0].TOKEN
        }

        console.log(message)
        
        admin.messaging().send(message)
        .then((response) => {
          console.log('Notificación enviada:', response);
        })
        .catch((error) => {
          console.log('Error al enviar la notificación:', error);
          //TODO Hacer hasta 3 intentos por notificación para evitar errores
        });

      }
  })
  res.status(200).send();
})


