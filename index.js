const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const mysql = require("mysql");
const admin = require("firebase-admin");
const serviceAccount = require("./firebase.json");
const connection = require("./connection.json");

app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.listen(5000, () => {
  console.log("Listening to port 5000");
});

app.get("/users", (req, res) => {
  const data = req.query;
  let query;
  let token;
  let mail;
  if (data == null) {
    query = "SELECT * FROM USERS;";
  } else if (data.mail && data.pass && data.token) {
    mail = data.mail;
    const pass = data.pass;
    token = data.token;
    query = `SELECT * FROM USERS WHERE MAIL = '${mail}' AND PASSWORD = '${pass}';`;
  } else {
    mail = data.mail;
    query = `SELECT * FROM USERS WHERE MAIL = '${mail}';`;
  }
  let conn = mysql.createConnection(connection);
  conn.query(query, (err, re) => {
    if (err) {
      console.log(err);
    } else if (re.length !== 0 && token) {
      const user = re[0];
      if (user.TOKEN !== token) {
        query = `UPDATE USERS SET TOKEN = '${token}' WHERE MAIL = '${mail}'`
        conn.query(query, (err, re) => {
          if (err) console.log(err);
        })
      }
    }
    res.status(200).send({ result: re });
  });
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
        res.status(200).send({ success: false });
      } else {
        res.status(200).send({ success: true });
      }
    }
  );
  conn.end;
});

app.post("/diary/create", (req, res) => {
  const data = req.body;
  let conn = mysql.createConnection(connection);
  const query = `INSERT INTO DIARY (DATE_ROUTINE, MAIL, ROUTINE) VALUES ('${data.date}', '${data.mail}', '${data.routine}');`;
  conn.query(query, (err, re) => {
    if (err) {
      console.log(err);
      res.status(200).send({ success: false });
    } else {
      res.status(200).send({ success: true });
    }
  });
  conn.end;
});

app.get("/diary", (req, res) => {
  const data = req.query;
  let query;
  if (data == null) {
    query = "SELECT * FROM DIARY;";
  } else if (data.mail && data.date) {
    const mail = data.mail;
    const date = data.date;
    query = `SELECT * FROM DIARY WHERE MAIL = '${mail}' AND DATE_ROUTINE = '${date}';`;
  } else if (data.mail && data.month && data.year) {
    const mail = data.mail;
    const month = data.month;
    const year = data.year;
    query = `SELECT DATE_FORMAT(DATE_ROUTINE, '%Y-%m-%d') AS DATE_F FROM DIARY WHERE MONTH(DATE_ROUTINE) = ${month} AND YEAR(DATE_ROUTINE) = ${year} AND MAIL = '${mail}';`;
  } else if (data.mail) {
    const mail = data.mail;
    query = `SELECT * FROM DIARY WHERE MAIL = '${mail}' AND DATE_ROUTINE = CURDATE();`;
  }
  let conn = mysql.createConnection(connection);
  conn.query(query, (err, re) => {
    if (err) console.log(err);
    res.status(200).send({ result: re });
  });
  conn.end;
});

app.delete("/diary", (req, res) => {
  const data = req.query;
  let query;
  if (data == null) {
    query = "DELETE FROM DIARY;";
  } else if (data.mail && data.date) {
    const mail = data.mail;
    const date = data.date;
    query = `DELETE FROM DIARY WHERE MAIL = '${mail}' AND DATE_ROUTINE = '${date}';`;
  }
  let conn = mysql.createConnection(connection);
  conn.query(query, (err, re) => {
    if (err) {
      res.status(200).send({ success: false });
    } else {
      res.status(200).send({ success: true });
    }
  });
  conn.end;
});

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

app.post("/routine/firebase", (req, res) => {
  const query =
    "SELECT u.TOKEN, d.ROUTINE FROM USERS u INNER JOIN DIARY d ON u.MAIL = d.MAIL WHERE d.DATE_ROUTINE = CURDATE();";
  let conn = mysql.createConnection(connection);
  conn.query(query, (err, re) => {
    if (err) console.log(err);
    else {
      for (let i = 0; i < re.length; i++) {
        const element = re[i];
        const message = {
          notification: {
            title: "¡Hoy es día de entrenamiento!",
            body: `La rutina de hoy es: ${element.ROUTINE}`,
          },
          token: element.TOKEN,
        };
        console.log(message);
        admin
          .messaging()
          .send(message)
          .then((response) => {
            console.log(response);
          })
          .catch((error) => {
            console.log("Error al enviar la notificación:", error);
          });
      }
    }
  });
  conn.end;
  res.status(200).send();
});

app.post("/routine/create", (req, res) => {
  const data = req.body;
  let conn = mysql.createConnection(connection);
  const query = `INSERT INTO ROUTINES (MAIL, NAME, DESCRIP) VALUES ('${data.mail}', '${data.routine_name}', '${data.routine_desc}');`;
  conn.query(query, (err, re) => {
    if (err) {
      console.log(err);
      res.status(200).send({ success: false });
    } else {
      res.status(200).send({ success: true });
    }
  });
  conn.end;
});

app.get("/routine", (req, res) => {
  const data = req.query;
  let query;
  if (data == null) {
    query = "SELECT * FROM ROUTINES;";
  } else if (data.mail) {
    const mail = data.mail;
    query = `SELECT * FROM ROUTINES WHERE MAIL = '${mail}';`;
  }
  let conn = mysql.createConnection(connection);
  conn.query(query, (err, re) => {
    if (err) console.log(err);
    res.status(200).send({ result: re });
  });
  conn.end;
});

app.post("/routine-ex/create", (req, res) => {
  const data = req.body;
  let conn = mysql.createConnection(connection);
  const query = `INSERT INTO ROUTINE_EXERCISE (NAME, MAIL, ID_EJ) VALUES ('${data.routine_name}', '${data.mail}', ${data.ex_id});`;
  conn.query(query, (err, re) => {
    if (err) {
      console.log(err);
      res.status(200).send({ success: false });
    } else {
      res.status(200).send({ success: true });
    }
  });
  conn.end;
});

app.post("/exercise", (req, res) => {
  const data = req.body;
  let query;
  if (data == null) {
    query = "SELECT * FROM EXERCISES;";
  } else if (data.lang && data.mail && data.routine_name) {
    const lang = data.lang;
    const mail = data.mail;
    const rName = data.routine_name;
    query = `SELECT e.ID, e.NAME, e.DES, e.NUM_SERIES, e.NUM_REPS, e.KG, e.LINK FROM EXERCISES e INNER JOIN ROUTINE_EXERCISE re ON e.ID = re.ID_EJ WHERE re.NAME = '${rName}' AND e.LANG = '${lang}' AND re.MAIL = '${mail}'`;
  } else if (data.lang && data.id_ex) {
    const lang = data.lang;
    const idEx = data.id_ex;
    query = `SELECT ID, NAME, DES, NUM_SERIES, NUM_REPS, KG, LINK FROM EXERCISES WHERE ID = ${idEx} AND LANG = '${lang}'`;
  } else if (data.lang) {
    const lang = data.lang;
    query = `SELECT * FROM EXERCISES WHERE LANG = '${lang}';`;
  }
  let conn = mysql.createConnection(connection);
  conn.query(query, (err, re) => {
    if (err) console.log(err);
    res.status(200).send({ result: re });
  });
  conn.end;
});

app.delete("/routine-ex", (req, res) => {
  const data = req.query;
  let query;
  if (data.mail && data.id_ej && data.name) {
    const mail = data.mail;
    const idEj = data.id_ej;
    const name = data.name;
    query = `DELETE FROM ROUTINE_EXERCISE WHERE MAIL = '${mail}' AND NAME = '${name}' AND ID_EJ = '${idEj}';`;
  }
  let conn = mysql.createConnection(connection);
  conn.query(query, (err, re) => {
    if (err) {
      res.status(200).send({ success: false });
    } else {
      res.status(200).send({ success: true });
    }
  });
  conn.end;
});

app.delete("/routine", (req, res) => {
  const data = req.query;
  let query;
  if (data.mail && data.name) {
    const mail = data.mail;
    const name = data.name;
    query = `DELETE FROM ROUTINES WHERE MAIL = '${mail}' AND NAME = '${name}';`;
  }
  let conn = mysql.createConnection(connection);
  conn.query(query, (err, re) => {
    if (err) {
      res.status(200).send({ success: false });
    } else {
      res.status(200).send({ success: true });
    }
  });
  conn.end;
});

app.post("/image/create", (req, res) => {
  const data = req.body;

  const mail = data.mail;
  const image = data.image;
  const exID = data.ex_id;

  let query = `SELECT IMAGE FROM IMAGES WHERE MAIL = '${mail}' AND EXERCISE_ID = ${exID};`;
  let conn = mysql.createConnection(connection);
  conn.query(query, (err, re) => {
    if (err) console.log(err);
    if (re.length !== 0) {
      query = `DELETE FROM IMAGES WHERE MAIL = '${mail}' AND EXERCISE_ID = ${exID};`;
      let conn2 = mysql.createConnection(connection);
      conn2.query(query, (err, re) => {
        if (err) console.log(err);
      });
      query = `INSERT INTO IMAGES VALUES('${mail}', ${exID}, '${image}');`;
      conn2.query(query, (err, re) => {
        if (err) console.log(err);
        res.status(200).send({ success: true });
      });
      conn2.end;
    } else {
      query = `INSERT INTO IMAGES VALUES('${mail}', ${exID}, '${image}');`;
      conn.query(query, (err, re) => {
        if (err) console.log(err);
        res.status(200).send({ success: true });
      });
    }
  });
  conn.end;
});

app.post("/image", (req, res) => {
  const data = req.body;

  const mail = data.mail;
  const exID = data.ex_id;

  const query = `SELECT IMAGE FROM IMAGES WHERE MAIL = '${mail}' AND EXERCISE_ID = ${exID};`;

  let conn = mysql.createConnection(connection);
  conn.query(query, (err, re) => {
    if (err) {
      console.error(err);
      res.status(500).send({ result: "null" });
    }

    if (re.length === 0) {
      res.status(200).send({ result: "null" });
    } else {
      const imageString = re[0].IMAGE;
      res.status(200).send({ result: imageString });
    }
  });
  conn.end;
});

//0 10 * * * curl -XPOST http://localhost:puerto/routine >/dev/null 2>&1
