const wrapper = document.querySelector('.wrapper');
const loginLink = document.querySelector('.login-link');
const registerLink = document.querySelector('.register-link');
const btn = document.querySelector('.btn');


const express = require('express');
const { DocumentStore } = require('raven-js');

const app = express();
const port = 3000; // Cambia el puerto según tu preferencia

const store = new DocumentStore({
  urls: ['http://localhost:8080'], // Cambia esto a la URL de tu servidor RavenDB
  database: 'YourDatabaseName', // Cambia esto al nombre de tu base de datos
});
store.initialize();

// Configura middleware para procesar solicitudes JSON
app.use(express.json());

// Endpoint para el inicio de sesión
app.post('/login', async (req, res) => {
  const session = store.openSession();
  const { username, password } = req.body;

  try {
    // Consulta la base de datos para verificar las credenciales
    const user = await session.query({ collection: 'users' })
      .whereEquals('username', username)
      .whereEquals('password', password)
      .singleOrNull();

    if (user) {
      // El inicio de sesión es exitoso
      res.json({ message: 'Inicio de sesión exitoso' });
    } else {
      // Credenciales incorrectas
      res.status(401).json({ error: 'Credenciales incorrectas' });
    }
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  } finally {
    session.dispose();
  }
});

app.listen(port, () => {
  console.log('Servidor en ejecución en http://localhost:${port}');
});









registerLink.addEventListener('click', ()=> {
    wrapper.classList.add('active');
})

loginLink.addEventListener('click', ()=> {
    wrapper.classList.remove('active');
})

btn.addEventListener('click', () => {
    console.log('Hola');
})


