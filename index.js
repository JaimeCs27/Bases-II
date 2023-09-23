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
const mongoose = require('mongoose')
const uri = 'mongodb://127.0.0.1:27017/TecVegetal'
mongoose.connect(uri, {
    useUnifiedTopology: true,
    useNewUrlParser: true
})
.then(db => console.log('Mongo is connected'))
.catch(err => console.log(err))


//Conexion con Neoj4
const neo4j = require('neo4j-driver')
const driver = neo4j.driver('bolt://127.0.0.1', neo4j.auth.basic('neo4j', '20040309'));
const neo4jSession = driver.session() 


//Conexion con OrientDB
const Orient = require("orientjs").OrientDBClient;
const orientSession = Orient.connect({
    host: "127.0.0.1",
    port: 2424
})

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
    try{
      ravenSession.query({collection : "Users"}).whereEquals('username', user).all().then(result =>{
        if(result[0].password == password)
          res.render('mainPage')
      })
    }catch(error){
      console.log(error)
    }
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