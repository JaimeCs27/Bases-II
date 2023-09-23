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
const driver = neo4j.driver('bolt://127.0.0.1', neo4j.auth.basic('si', '12345678'));
const neo4jSession = driver.session() 

/*
//Conexion con Orient
const orient = require('orientjs').OrientDBClient
const orientConection = orient.connect({
    host: "localhost",
    port: 2424
}).then(client =>{
  client.session({ name: "demoDB", username: "root", password: "20040309" })
  .then(session => {
    // use the session
    session.query('select from Persona where name := jaime')
    .all()
    .then((results)=>{
      console.log(results)
    })
    // close the session
    return session.close();
  });
}).then(() => {
  console.log('client closed')
}).catch(error => {
  console.log(error)
})
*/
// Create OrientDB server connection
var OrientDB = require('orientjs');

var server = OrientDB({
  host:     'localhost',
  port:     2424,
  username: 'root',
  password: '20040309',
  useToken: true
});

// Use OrientDB server to connect to a specific database
var dbOrient = server.use({
   name: 'prueba',
   username: 'root',
   password: '20040309',
   useToken : true
});

dbOrient.query("select * from Person")
.then((result) =>{
  console.log(result)
})


async function testNeo4jConnection() {
  const session = driver.session();
  var title = 'Jaime'
  const year = 2013

  try {
    // Ejecuta una consulta simple para verificar la conexión
    const result = await session.run('MATCH (a:Users {title:$titleParam}),(b:Users {title:$nombre}) MERGE(a)-[r:Friend_of]-(b) RETURN a,b', {titleParam : title, nombre:'Sebitas'})
    .then(function(result){
        result.records.forEach(function(record){
            console.log(record._fields[0].properties.title)
        })
    })
    .catch(function(error){
        console.log(error);
    });

  } catch (error) {
    console.error('Error al conectar a Neo4j:', error);
  } finally {
    // Cierra la sesión
    session.close();
  }
}
/*
testNeo4jConnection()
  .then(() => {
    // Cierra la conexión cuando hayas terminado
    driver.close();
  })
  .catch(error => {
    console.error('Error al probar la conexión a Neo4j:', error);
  });
*/




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