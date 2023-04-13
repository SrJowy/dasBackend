const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const mysql = require('mysql');

const connection = {
	host: '161.35.34.173',
	port: 3306,
	user: 'user',
	password: 'password',
	database: 'db',
	insecureAuth: true
}

app.use(cors());
app.use(express.json())
app.use(bodyParser.urlencoded( {extended: true} ));

app.listen(5000, ()=>{
    console.log("Listening to port 5000");
    let conn = mysql.createConnection(connection);
    conn.query("SELECT * FROM USERS;", (err, res) => {
    	if (err) console.log(err);
    	console.log(res)
    })
    conn.end;
});

app.get('/users', (req, res) => {
	console.log(req.query)
	res.send({User: 'Joel'});
})