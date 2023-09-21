const express = require("express")
const app = express()
const path = require("path")
const { DocumentStore } = require('ravendb');
const port = 3000; // Cambia el puerto según tu preferencia
const store = new DocumentStore('http://127.0.0.1:8080', 'TecVegetal');
store.initialize();
const session = store.openSession();

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
    session.query({collection : "Users"}).whereEquals('username', user).all().then(result =>{
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
      session.store(usuario, 'Users/')
      session.saveChanges();
    } catch (error) {
      console.log(error)
    }
    session.dispose();
    
})

// Configura middleware para procesar solicitudes JSON
app.use(express.json());

app.listen(port, ()=>{
    console.log("port connected")
})