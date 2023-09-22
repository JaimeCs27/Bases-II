const express = require("express")
const app = express()
const path = require("path")
const port = 3000; // Cambia el puerto según tu preferencia




//Conexion con Raven
const { DocumentStore } = require('ravendb');
const ravenConection = new DocumentStore('http://127.0.0.1:8080', 'TecVegetal');
ravenConection.initialize();
const ravenSession = ravenConection.openSession();


//Conexion con Mongo
const mongo = require("mongoose");
mongo.connect("mongodb://localhost:27017/TecVegetal")
.then(() => {
    console.log("mongodb connected");
})
.catch(() =>{
    console.log("mongo not connected");
})

//Conexion con Neoj4
const driver = neo4j.driver('bolt://localhost');

app.use(express.urlencoded({extended:false}))
const publicPath = path.join(__dirname, 'public')
console.log(publicPath);
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))
app.use(express.static(publicPath))

app.get('/', (req, res) => {
  res.render('index');
});

app.post("/login", function(req, res) {
    var user = req.body.username;
    var password = req.body.password;
    ravenSession.query({collection : "Users"}).whereEquals('username', user).all().then(result =>{
      if(result[0].password == password)
        res.render('mainPage')
    })
})

app.post("/register", function(req, res){
    var user = req.body.usernameR;
    var password = req.body.passR;
    var nombre = req.body.nombre_completo;
    let usuario = {
      username : user,
      password : password,
      nombre : nombre,
      "@metadata": {
        "@collection": "Users"
      }
    }
    try {
      ravenSession.store(usuario, 'Users/')
      ravenSession.saveChanges();
    } catch (error) {
      console.log(error)
    }
    ravenSession.dispose();
    
})

// Configura middleware para procesar solicitudes JSON
app.use(express.json());

app.listen(port, ()=>{
    console.log("port connected")
})