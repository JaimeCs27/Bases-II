const express = require("express")
const fs = require("fs")
const app = express()
const path = require("path")
const port = 3000; // Cambia el puerto según tu preferencia
const multer = require('multer')
const storage = multer.memoryStorage()
const upload = multer({ storage })
const bodyParser = require('body-parser')
const router = express.Router()


//Conexion con Raven
const { DocumentStore, GetServerWideExternalReplicationOperation } = require('ravendb');
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
const collection = require("./src/mongodb.js")


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
   name: 'demodb',
   username: 'root',
   password: '20040309',
   useToken : true
});

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

app.use(express.urlencoded({extended:true}))
const publicPath = path.join(__dirname, 'public')
console.log(publicPath);
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))
app.use(express.static(publicPath))
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.render('index.ejs');
});

app.get("/setCurso", async function(req, res){
  try{
    const courses = await collection.find({})
    const user = 'usuario'
    const userInfos = await ravenSession.load('Users/'+user)
    console.log("setCurso: " + userInfos)
    const creados = userInfos.cursosCreados
    console.log(creados)
    var arr = []
    courses.forEach(function(course){
        creados.forEach(function(myCourses){
          console.log('Curso ID: ' + course.id)
          console.log('Mi curso id: ' + myCourses.codigo)
          if(course.id == myCourses.codigo)
            arr.push(course)
        })
    })
    console.log(arr)
    res.render('cursosCreados', {courses : arr}) // aqui se agrega el html donde se muestran los cursos
  }catch(error){
    console.log(error)
  }
})

app.get("/setMainPage", function(req, res){
  res.render('mainPage')
})

app.post('/goToCreateCourse', function(req, res){
  res.render('crearCurso')
})

app.get("/setFindCourses", async function(req, res){
  try{
    const courses = await collection.find({})
    res.render('cursosPublicados', {courses : courses, payload : courses}) // aqui se agrega el html donde se muestran los cursos
  }catch(error){
    console.log(error)
  }
})

app.get("/setEnrollment", async function(req, res){
  try{
    const courses = await collection.find({})
    const user = 'nuevo'
    const userInfos = await ravenSession.load('Users/'+user)
    const matriculados = userInfos.cursosMatriculados
    var arr = []
    courses.forEach(function(course){
        matriculados.forEach(function(myCourses){
          if(course.id == myCourses.codigo)
            arr.push(course)
        })
    })
    console.log(arr)
    res.render('cursosMatriculados', {courses : arr}) // aqui se agrega el html donde se muestran los cursos
  }catch(error){
    console.log(error)
  }
})

app.post("/findCourse", async function(req, res){
  try{
    const courses = await collection.find({})
    console.log(courses)
    res.render('cursosMatriculados', {course : courses}) // aqui se agrega el html donde se muestran los cursos
  }catch(error){
    console.log(error)
  }
})

app.post("/login", function(req, res) {
    const user = req.body.username;
    const password = req.body.password;
    try{
      ravenSession.query({collection : "Users"}).whereEquals("username", user).all().then(result =>{
        result.forEach(function(result){
          if(result.password == password){
            res.render('mainPage')       
          }
          else
            console.log('No se pudo acceder')
        })
        
      })
    }catch(error){
      console.log(error)
    }
    
})

app.post('/getCourses', async (req,res)=> {
  let payload = req.body.payload.trim();
  try{
    console.log('Nueva Busqueda')
    const courses = await collection.find({name:{$regex: new RegExp('^'+payload+'.*','i')}}).exec();
    res.send({payload: courses}) // aqui se agrega el html donde se muestran los cursos
  }catch(error){
    console.log(error)
  }
})

app.post('/cursoDetalles', async (req,res)=> {
  //res.render('mainPage')
})



app.post("/register",upload.single('profile_pic'), async function(req, res){
    var user = req.body.usernameR;
    var password = req.body.passR;
    var nombre = req.body.nombre_completo;
    var fechaNacimiento = req.body.fecha_nacimiento
    const file = req.file
    const matriculados = []
    let usuario = {
      username : user,
      password : password,
      nombre : nombre,
      fechaNacimiento: fechaNacimiento,
      cursosMatriculados: matriculados,
      cursosCreados: matriculados,
      "@metadata": {
        "@collection": "Users"
      }
    }
    try {
      ravenSession.store(usuario, 'Users/'+user)
      ravenSession.advanced.attachments.store('Users/'+user, file.originalname, file.buffer, file.mimetype)
      ravenSession.saveChanges();
      try {
        const result = await neo4jSession.run('CREATE(n:Users {username:$userParam}) RETURN n', {userParam : user})
        .then(function(result){
            console.log('Usuario '+ result.username + ' agreagado con exito a neo4j')
        })
        .catch(function(error){
            console.log(error);
        });
    
      } catch (error) {
        console.error('Error al conectar a Neo4j:', error);
      }
    } catch (error) {
      console.log('No se logro agregar el usuario a raven'+error)
    }
    ravenSession.dispose();
    
    
})
/*
app.post("/", async function(req, res){
  const Users = await session.load("Users")
  const file = await session.advanced.attachments.get(Users, "")

})
*/



app.post('/subir-archivo', upload.single('archivo'), (req, res) => {
  const archivo = req.file
  console.log(archivo)
  fs.writeFileSync('public/imagen.jpg', archivo.buffer)
  res.send('<h1>Mostrar Imagen</h1><img src=/imagen.jpg alt="Imagen" />');
})




app.post("/createCourse", async function(req, res){  // SE OCUPA EL USUARIO DE LA PAGINA
    var user = 'usuario'
    var cursoId = req.body.curso_id
    var nombre = req.body.curso_name
    var description = req.body.curso_desc
    var start = req.body.curso_start
    var end = req.body.curso_end
    const data = {
      id: cursoId,
      name: nombre,
      description: description,
      start: start,
      end: end
    }
    try{
      await collection.insertMany([data])
      const userInfo = await ravenSession.query({collection: 'Users'}).whereEquals("username", user).all()
      userInfo[0].cursosCreados.push({"codigo": cursoId})
      ravenSession.saveChanges()
    }catch(error){
      console.log(error)
    } 
})




app.post("/addEvaluation", async function(req, res){
  try{
    const filter = {id: 'IC4023'}
    console.log(course)
    var cod = req.body.evaluacion_cod
    var start = req.body.evaluacion_start
    var end = req.body.evaluacion_end 
    await collection.updateOne(filter, 
      {$push: {
        evaluations : {
          code : cod,
          start : start,
          end : end
        },
      },
    })

  }catch(error){
    console.log(error)
  }
})

app.post("/enroll", async function(req, res){
  try{
    var user = "jaime"  // el usuario debe venir por parametro de alguna manera
    var curso = "IC4023"   // el codigo debe venir por parametro
    const result = await collection.updateOne(
      {id : curso},
      {$push : {
        students: {
          user: user
        }
      }} 
    )
  }catch(error){
    console.log(error)
  }
})

app.post("/editUser", async function(req, res){
    var user = req.body.user   // EL USUARIO DEBE VENIR POR PARAMETRO
    var password = req.body.passR;
    var nombre = req.body.nombre_completo;
    var fechaNacimiento = req.body.fecha_nacimiento
    const file = req.file
    console.log(file)
    try {
      const userInfo = ravenSession.query({collection: 'Users'}).whereEquals("username", user).all()
      userInfo.password = password
      userInfo.nombre = nombre
      userInfo.fechaNacimiento = fechaNacimiento
      const oldFile = userInfo.advanced.attachments.getNames("Users/"+user)
      if(file != null){
        userInfo.advanced.attachments.delete("Users/"+user, oldFile.name)
        userInfo.advanced.attachments.store('Users/'+user, file.originalname, file.buffer, file.mimetype)
      }
      ravenSession.saveChanges();
    } catch (error) {
      console.log('No se logro agregar el usuario a raven'+error)
    }
    ravenSession.dispose();
})

app.post("/addQuestion", async function(req, res){
  try{
    var question = req.body.question
    var opcion1 = req.body.opcion1
    var opcion2 = req.body.opcion2
    var opcion3 = req.body.opcion3
    var opcion4 = req.body.opcion4
    var correcta = req.body.correcta
    const data = {
      question: question,
      opcion1: opcion1,
      opcion2: opcion2,
      opcion3: opcion3,
      opcion4: opcion4,
      correct: correcta
    }
    const result = await collection.updateOne(
      {id: 'IC4023', "evaluations.code": 'Evaluacion 2'},    //AQUI DEBE IR EL NOMBRE DE LA EVALUACION Y EL CODIGO DEL CURSO
      {$push: {"evaluations.$.questions": data}}  
    )
    if (result.matchedCount === 0){
      console.log('No')
    } else{
      console.log('Si')
    }
  } catch(error){
    console.log(error)
  }
})


// Configura middleware para procesar solicitudes JSON
app.use(express.json());

app.listen(port, ()=>{
    console.log("port connected")
})