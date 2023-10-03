const express = require("express")
const fs = require("fs")
const app = express()
const path = require("path")
const port = 3000; // Cambia el puerto según tu preferencia
const { 
  GridFsStorage 
} = require('multer-gridfs-storage')
const Grid = require('gridfs-stream')
const methodOverride = require('method-override')
const bodyParser = require('body-parser')
const router = express.Router()
const bcrypt = require('bcrypt')

const multer = require('multer')

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    return cb(null, './public/uploads');
  },
  filename: function (req, file, cb) {
    return cb(null, `${userLoging[0]}-${file.originalname}`);
  },
});

const upload = multer({storage})


var userLoging = []
var currentCourse = []
var questions = []
var files = []

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

let bucket;
mongoose.connection.on("connected", () => {
  var db = mongoose.connections[0].db;
  bucket = new mongoose.mongo.GridFSBucket(db, {
    bucketName: "newBucket"
  });
  //console.log(bucket);
});


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


app.use(express.urlencoded({extended:true}))
const publicPath = path.join(__dirname, 'public')
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))
app.use(methodOverride('_method'))
app.use(express.static(publicPath))
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));

app.get('/', (req, res) => {
  res.render('index.ejs');
});

app.post('/menuCrearEvaluacion', async function(req, res){
  const course = await collection.find({id : req.body.codigo})
  res.render('crearEvaluacion', {course : course[0]})
})

app.post('/menuCrearSeccion', async function(req, res){
  const course = await collection.find({id : req.body.codigo})
  res.render('crearSeccion', {course : course[0]})
})

app.post("/cursoDetallesPublicados", async function(req, res){
  const course = await collection.find({id : req.body.input})
  res.render('cursoPublicadoDetalles', {course : course[0]})
})

app.post("/cursoDetallesMatriculados", async function(req, res){
  const course = await collection.find({id : req.body.input})
  currentCourse.push(course[0])
  res.render('cursoMatriculadoDetalle', {course : course[0]})
})

app.get('/estudiantesMiCurso',async function(req, res){
  const curso = currentCourse[0]
  res.render('estudiantesMiCurso', {course : curso})
})

app.post("/miCursoDetalles", async function(req, res){
  const course = await collection.find({id : req.body.input})
  currentCourse.push(course[0])
  res.render('cursoCreadoDetalle', {course : course[0]})
})

app.get("/setCurso", async function(req, res){
  questions = []
  currentCourse = []
  try{
    const courses = await collection.find({})
    const user = userLoging[0]
    const userInfos = await ravenSession.load('Users/'+user)
    const creados = userInfos.cursosCreados
    var arr = []
    if(creados)
      courses.forEach(function(course){
          creados.forEach(function(myCourses){
            if(course.id == myCourses.codigo)
              arr.push(course)
          })
      })
    res.render('cursosCreados', {courses : arr}) // aqui se agrega el html donde se muestran los cursos
  }catch(error){
    console.log(error)
  }
})

app.get("/setMainPage", async function(req, res){
  questions = []
  const usuario = await ravenSession.load('Users/'+userLoging[0])
  currentCourse = []
  console.log(usuario.path)
  var ruta = usuario.path;
  var nuevaRuta = ruta.substring(7);
  res.render('mainPage', {user:usuario, pathImg : {path: nuevaRuta}})
})

app.post('/goToCreateCourse', function(req, res){
  res.render('crearCurso')
})

app.get('/detallesCreado', async function(req, res){
  const curso = currentCourse[0]
  res.render('cursoCreadoDetalle', {course : curso})
})

app.get('/evaluacionesCreado', async function(req, res){
  const curso = currentCourse[0]
  console.log(curso)
  res.render('evaluacionCursoCreado', {course : curso})
})

app.get('/seccionesMiCurso', async function(req, res){
  const curso = currentCourse[0]
  res.render('seccionesMiCurso', {course : curso})
})

app.get('/detallesMatriculado', async function(req, res){
  const curso = currentCourse[0]
  res.render('cursoMatriculadoDetalle', {course : curso})
})

app.get('/notasMatriculado', async function(req, res){
  const curso = currentCourse[0]
  const usuario = await ravenSession.load("Users/"+userLoging[0])
  console.log(usuario)
  res.render('notas', {course : curso, user: usuario})
})

app.post('/verPersona', async function(req, res) {
  const matriculados = [];
  const creados = [];
  console.log(req.body.user)
  const usuario = await ravenSession.load('Users/' + req.body.user);

  // Utiliza Promise.all para esperar a que todas las búsquedas se completen.
  var matriculadosPromises = []
  try{
    matriculadosPromises = usuario.cursosMatriculados.map(async function(curso) {
    const result = await collection.find({ id: curso.codigo });
    matriculados.push(result[0]);
  });
  }catch(error){
    console.log(error)
  }
  var creadosPromises = []
  try {
    creadosPromises = usuario.cursosCreados.map(async function(curso) {
      const aux = await collection.find({ id: curso.codigo });
      creados.push(aux[0]);
    });
    
  } catch (error) {
    console.log(error)
  }
  try {
    
    await Promise.all(matriculadosPromises);
  } catch (error) {
    console.log(error)
  }
  try {
    
    await Promise.all(creadosPromises);
  } catch (error) {
    console.log(error)
  }
  console.log(usuario)
  const miUsuario = await ravenSession.load('Users/' + userLoging[0]);
  res.render('Persona', { matriculados: matriculados, creados: creados, student: usuario, user: miUsuario });
});

app.get('/setContactos', async function(req, res){
  const result = await neo4jSession.run('MATCH (n:Users {username: $user})-[r:FriendOf]->(a:Users) RETURN a', {user: userLoging[0]});
  const friendsId = []
  const friends = []
  
  result.records.forEach(function(record){
    friendsId.push(record._fields[0].properties)
  })

  
  const friendsPromises = friendsId.map(async function(friend){
    const f = await ravenSession.load("Users/"+friend.username);
    return f;
  });

  const loadedFriends = await Promise.all(friendsPromises);

  res.render('contactos', { friends: loadedFriends });
});


app.post('/agregarContacto', async function(req, res){
  const current = userLoging[0]
  const friend = req.body.user
  try{
    await neo4jSession.run('MATCH (user1:Users {username:$current}),(user2:Users {username:$friend}) MERGE(user1)-[:FriendOf]->(user2)', { current, friend })
    await neo4jSession.run('MATCH (user1:Users {username:$current}),(user2:Users {username:$friend}) MERGE(user2)-[:FriendOf]->(user1)', { current, friend });

    console.log('Relación de amistad creada con éxito.');
  }catch(error){
    console.log(error)
  }
})

app.get('/evaluacionesMatriculado', async function(req, res){
  const curso = currentCourse[0]
  const usuario = await ravenSession.load("Users/"+userLoging[0])
  console.log(usuario)
  res.render('Evaluaciones', {course : curso, user: usuario})
})

app.get('/estudiantesMatriculado', async function(req, res){
  const curso = currentCourse[0]
  res.render('estudiantes', {course : curso})
})

app.get('/setFindUsers',async function(req, res){
  currentCourse = []
  const usuarios = await ravenSession.query({ collection: "Users" }).all();
  res.render('usuarios', {users: usuarios})
})

app.get('/seccionesMatriculado', async function(req, res){
  const curso = currentCourse[0]
  res.render('secciones', {course : curso})
})

app.post('/hacerEvaluacion', async function(req, res){
  const curso = await collection.find({id: req.body.codigo})
  var eval = []
  console.log(req.body.evaluation)
  curso[0].evaluations.forEach(function(evaluation){
    if(evaluation.code == req.body.evaluation)
      eval = evaluation
  })
  res.render('hacerEvaluacion', {course : curso[0], evaluation: eval})
})

app.get("/setFindCourses", async function(req, res){
  questions = []
  currentCourse = []
  try{
    const courses = await collection.find({})
    res.render('cursosPublicados', {courses : courses, payload : courses}) // aqui se agrega el html donde se muestran los cursos
  }catch(error){
    console.log(error)
  }
})

app.post('/entregarEvaluacion', async function(req,res){
  const curso = await collection.find({id: req.body.codigo})
  var eval = []
  curso[0].evaluations.forEach(function(evaluation){
    if(evaluation.code == req.body.evaluation)
      eval = evaluation
  })
  const body = req.body
  var buenas = 0
  var preguntas = 0
  eval.questions.forEach(function(question){
    const pregunta = body[question.question]
    if(question.correct == pregunta){
      buenas += 1
    }
    preguntas += 1
  })
  const nota = buenas * 100 / preguntas
  console.log(nota)
  const usuario = await ravenSession.load("Users/"+userLoging[0])
  const data =
  {
    evaluation: eval.code,
    nota: nota
  }
  console.log(usuario)
  usuario.cursosMatriculados.forEach(function(matriculado){
    
    if(matriculado.codigo == curso[0].id){
      console.log(matriculado)
      matriculado.notas.push(data)
    }
  })
  ravenSession.saveChanges();
})

app.get("/setEnrollment", async function(req, res){
  currentCourse = []
  questions = []
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
            const usuario = await ravenSession.load('Users/'+userLoging[0])
            var ruta = usuario.path;
            var nuevaRuta = ruta.substring(7);
            res.render('mainPage', {user:usuario, pathImg : {path: nuevaRuta}})
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
    const courses = await collection.find({name:{$regex: new RegExp('^'+payload+'.*','i')}}).exec();
    res.send({payload: courses}) // aqui se agrega el html donde se muestran los cursos
  }catch(error){
    console.log(error)
  }
})

app.post('/getUsers', async function(req, res){
  let payload = req.body.payload.trim();
  try{
    const users = await ravenSession
    .query({ collection: "Users" })
    .whereStartsWith("nombre", payload.toLowerCase()) // Realiza la búsqueda con case-insensitive
    .all();
    console.log(users)
    res.send({payload: users}) // aqui se agrega el html donde se muestran los cursos
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
      const path = file.path
      let usuario = {
        username : user,
        password : password,
        salt : salt,
        nombre : nombre,
        fechaNacimiento: fechaNacimiento,
        path: path,
        cursosMatriculados: matriculados,
        cursosCreados: [],
        "@metadata": {
          "@collection": "Users"
        }
      }

      if(new Date(fechaNacimiento).getTime() > Date.now()){
        console.log('No se anadio el usuario porque la fecha de nacimiento es incorrecta')
        return;
      }
      ravenSession.store(usuario, 'Users/'+user)
      ravenSession.saveChanges();
      try {
        const result = await neo4jSession.run('CREATE(n:Users {username:$user}) RETURN n', { user: user})
        .then(function(result){
            console.log('Usuario '+ user + ' agreagado con exito a neo4j')
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

app.post('/clonarCurso', async function(req, res){
    var user = userLoging[0]
    var cursoId = req.body.codigo
    var nombre = req.body.nombre
    var start = req.body.inicio
    var end = req.body.final
    const curso = await collection.find({id: req.body.codigoCurso})
    var description = curso[0].description
    if(new Date(start).getTime() < Date.now()){
      console.log('No se creo el curso la fecha de inicio es incorrecta')
      return;
    }
    if(new Date(start).getTime() > new Date(end).getTime()){
      console.log('No se creo el curso la fecha de inicio es mayor a la fecha de finalizacion')
      return;
    }
    const data = {
      id: cursoId,
      name: nombre,
      description: description,
      start: start,
      end: end,
      imgPath: curso[0].imgPath,
      sections: curso[0].sections,
      students: [],
      evaluations: []
    }
    try{
      const result = await collection.insertMany([data])
      console.log(result)
      const userInfo = await ravenSession.query({collection: 'Users'}).whereEquals("username", user).all()
      userInfo[0].cursosCreados.push({"codigo": cursoId})
      ravenSession.saveChanges()

    }catch(error){
      console.log(error)
    }
})

app.post("/createCourse",upload.single('file'), async function(req, res){  // SE OCUPA EL USUARIO DE LA PAGINA
    var user = userLoging[0]
    var cursoId = req.body.curso_id
    var nombre = req.body.curso_name
    var description = req.body.curso_desc
    var start = req.body.curso_start
    var end = req.body.curso_end
    var file = req.file
    var path = file.path
    console.log(file)
    if(new Date(start).getTime() < Date.now()){
      console.log('No se creo el curso la fecha de inicio es incorrecta')
      return;
    }
    if(new Date(start).getTime() > new Date(end).getTime()){
      console.log('No se creo el curso la fecha de inicio es mayor a la fecha de finalizacion')
      return;
    }
    var newPath = path.substring(7)

    const data = {
      id: cursoId,
      name: nombre,
      description: description,
      start: start,
      end: end,
      imgPath: newPath
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
    console.log(req.body.codigo)
    const filter = {id: req.body.codigo}  //id del curso
    var cod = req.body.nombreEvaluacion
    var start = req.body.evaluacion_start
    var end = req.body.evaluacion_end 
    const result = await collection.updateOne(filter, 
      {$push: {
        evaluations : {
          code : cod,
          start : start,
          end : end,
          questions: questions
        },
      },
    })
    console.log(result)
  }catch(error){
    console.log(error)
  }
})

app.post("/addFile", upload.single('file'), async function(req, res){
  const file = req.file
  const data = {
    path: file.path,
    name: req.body.titulo
  }
  files.push(data)
})

app.post('/addSection', async function(req, res){
  const idCurso = req.body.codigo
  console.log(idCurso)
  const result = await collection.updateOne(
    {id : idCurso},
    {$push : {
      sections: {
        description: req.body.nombreSeccion,
        documents: files
      }
    }} 
  )
})

app.post('/descargarDocumentos', function(req, res){
  res.download(req.body.path)
})

app.post('/verSeccion', async function(req,res){
  const course = await collection.find({id : req.body.codigo})
  var sectionvar = []
  course[0].sections.forEach(function(section){
    console.log(section)
    console.log(req.body.desc)
    if(section.description == req.body.desc)
      sectionvar = section
  })
  console.log(sectionvar)
  res.render('seccionesDetalles', {course : course[0], section: sectionvar});
})

app.post("/enroll", async function(req, res){
  try{
    var user = userLoging[0]  // el usuario debe venir por parametro de alguna manera
    var idCurso = req.body.codigo   // el codigo debe venir por parametro
    const curso = await collection.find({id : idCurso})
    const students = curso[0].students
    if(students.length == 0){
      const result = await collection.updateOne(
        {id : idCurso},
        {$push : {
          students: {
            user: user
          }
        }} 
      )
      const userInfo = await ravenSession.load('Users/'+user)
      userInfo.cursosMatriculados.push({
        "codigo": idCurso,
        "notas": []
      })
      ravenSession.saveChanges()
      return;
    }
    var repetido = false
    students.forEach(async function(student){
      if(student.user == user){
        repetido = true
      }
      console.log(student)
    })
    if(!repetido){
      const result = await collection.updateOne(
        {id : idCurso},
        {$push : {
          students: {
            user: user
          }
        }} 
      )
      const userInfo = await ravenSession.load('Users/'+user)
      console.log(userInfo)
      userInfo.cursosMatriculados.push({"codigo": idCurso})
      ravenSession.saveChanges()
      return;
    }
  }catch(error){
    console.log(error)
  }
})

app.get("/logOut", function(req,res){
  userLoging = []
  currentCourse = []
  questions = []
  files = []
  res.render('index')
})

app.post("/editUser", upload.single("profilePic"),async function(req, res){
    var user = userLoging[0]   // EL USUARIO DEBE VENIR POR PARAMETRO
    var password = req.body.passR;
    var nombre = req.body.nombre_completo;
    var fechaNacimiento = req.body.fecha_nacimiento
    const file = req.file
    try {
      const userInfo = await ravenSession.load("Users/"+user)
      if(password != ''){
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        userInfo.salt = salt
        userInfo.password = hashedPassword
      }
      userInfo.nombre = nombre
      userInfo.fechaNacimiento = fechaNacimiento
      if(file)
        userInfo.path = file.path
      ravenSession.saveChanges();
    } catch (error) {
      console.log('No se logro agregar el usuario a raven'+error)
    }
    ravenSession.dispose();
})

app.post("/addQuestion", function(req, res){
  try{
    var question = req.body.pregunta
    var opcion1 = req.body.respuesta1
    var opcion2 = req.body.respuesta2
    var opcion3 = req.body.respuesta3
    var opcion4 = req.body.respuesta4
    var correcta = true
    if(req.body.cbox1 === 'checkbox')
      correcta = 1
    if(req.body.cbox2 === 'checkbox')
      correcta = 2
    if(req.body.cbox3 === 'checkbox')
      correcta = 3
    if(req.body.cbox4 === 'checkbox')
      correcta = 4
    const data = {
      question: question,
      opcion1: opcion1,
      opcion2: opcion2,
      opcion3: opcion3,
      opcion4: opcion4,
      correct: correcta
    }
    questions.push(data)
  } catch(error){
    console.log(error)
  }
})


// Configura middleware para procesar solicitudes JSON
app.use(express.json());

app.listen(port, ()=>{
    console.log("port connected")
})