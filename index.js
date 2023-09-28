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
const bcrypt = require('bcrypt')
const userLoging = []


//Conexion con Raven
const { DocumentStore, GetServerWideExternalReplicationOperation, DocumentInfo } = require('ravendb');
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
const driver = neo4j.driver('bolt://127.0.0.1', neo4j.auth.basic('neo4j', '12345678'));
const neo4jSession = driver.session() 

var OrientDB = require('orientjs');
const async = require("hbs/lib/async.js");

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
app.use(bodyParser.urlencoded({extended:true}));

app.get('/', (req, res) => {
  res.render('index.ejs');
});

app.post("/cursoDetallesPublicados", async function(req, res){
  const course = await collection.find({id : req.body.input})
  res.render('cursoPublicadoDetalles', {course : course[0]})
})

// app.get("/cursoDetalles", async function(req, res){
//   console.log('parametros')
//   console.log(req.params)
// })

app.get("/setCurso", async function(req, res){
  try{
    const courses = await collection.find({})
    const user = userLoging[0]
    const userInfos = await ravenSession.load('Users/'+user)
    console.log("setCurso: " + userInfos)
    const creados = userInfos.cursosCreados
    var arr = []
    if(creados)
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
    const user = userLoging[0]
    const userInfos = await ravenSession.load('Users/'+user)
    const matriculados = userInfos.cursosMatriculados
    var arr = []
    courses.forEach(function(course){
        matriculados.forEach(function(myCourses){
          if(course.id == myCourses.codigo)
            arr.push(course)
        })
    })
    res.render('cursosMatriculados', {courses : arr}) // aqui se agrega el html donde se muestran los cursos
  }catch(error){
    console.log(error)
  }
})

app.post("/findCourse", async function(req, res){
  try{
    const courses = await collection.find({})
    res.render('cursosMatriculados', {course : courses}) // aqui se agrega el html donde se muestran los cursos
  }catch(error){
    console.log(error)
  }
})

app.post("/login", async function(req, res) {
    const user = req.body.username;
    const password = req.body.password;
    try{
      ravenSession.query({collection : "Users"}).whereEquals("username", user).all().then(result =>{
        result.forEach(async function(result){
          if(await bcrypt.compare(password, result.password)){
            userLoging.push(user)
            //res.redirect('/login/${user}')
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

app.get("/login/:username", (req,res) => {
  const {username} = req.params
  res.render(path.join(__dirname, 'views/mainPage.ejs'), {username: username})
})




app.post('/getCourses', async (req,res)=> {
  let payload = req.body.payload.trim();
  try{
    const courses = await collection.find({name:{$regex: new RegExp('^'+payload+'.*','i')}}).exec();
    res.send({payload: courses}) // aqui se agrega el html donde se muestran los cursos
  }catch(error){
    console.log(error)
  }
})


app.post("/register",upload.single('profile_pic'), async function(req, res){
    try {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(req.body.passR, salt);
      const user = req.body.usernameR;

      var password = hashedPassword;
      var nombre = req.body.nombre_completo;
      var fechaNacimiento = req.body.fecha_nacimiento
      const file = req.file
      const matriculados = []
      let usuario = {
        username : user,
        password : password,
        salt : salt,
        nombre : nombre,
        fechaNacimiento: fechaNacimiento,
        cursosMatriculados: matriculados,
        cursosCreados: [],
        "@metadata": {
          "@collection": "Users"
        }
      }
      ravenSession.store(usuario, 'Users/'+user)
      ravenSession.advanced.attachments.store('Users/'+user, file.originalname, file.buffer, file.mimetype)
      ravenSession.saveChanges();
      try {
        const result = await neo4jSession.run('CREATE(n:Users {username:$user}) RETURN n', { user: user})
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
    var user = userLoging[0]
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
    var user = userLoging[0]  // el usuario debe venir por parametro de alguna manera
    var idCurso = req.body.codigo   // el codigo debe venir por parametro
    console.log(idCurso)
    const curso = await collection.find({id : idCurso})
    const students = curso[0].students
    console.log(students)
    if(students.length == 0){
      const result = await collection.updateOne(
        {id : idCurso},
        {$push : {
          students: {
            user: user
          }
        }} 
      )
      const userInfo = await ravenSession.query({collection: 'Users'}).whereEquals("username", user).all()
      userInfo[0].cursosMatriculados.push({"codigo": curso})
      ravenSession.saveChanges()
      return;
    }
    students.forEach(async function(student){
      if(student.user != user){
        const result = await collection.updateOne(
          {id : idCurso},
          {$push : {
            students: {
              user: user
            }
          }} 
        )
        const userInfo = await ravenSession.query({collection: 'Users'}).whereEquals("username", user).all()
        userInfo[0].cursosMatriculados.push({"codigo": curso})
        ravenSession.saveChanges()
        return;
      }
    })
  }catch(error){
    console.log(error)
  }
})

app.post("/editUser", async function(req, res){
    var user = userLoging[0]   // EL USUARIO DEBE VENIR POR PARAMETRO
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