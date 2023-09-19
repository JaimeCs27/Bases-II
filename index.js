const express = require("express")
const app = express()
const path = require("path")

const { DocumentStore } = require('ravendb');

const port = 3000; // Cambia el puerto según tu preferencia

const store = new DocumentStore('http://127.0.0.1:8080', 'TecVegetal');
store.initialize();

const session = store.openSession();

// Función para realizar una prueba de conexión
async function testConnection() {
    try {
      // Abre una sesión de RavenDB
      const session = store.openSession();
  
      let product = {
        title: 'iPhone X',
        price: 999.99,
        currency: 'USD',
        storage: 64,
        manufacturer: 'Apple',
        in_stock: true,
        last_update: new Date('2017-10-01T00:00:00'),
        "@metadata": {
            "@collection": "Products"
        }
    };

      // Realiza una operación de prueba (p. ej., consulta un documento ficticio)
      const result = await session.store(product, 'Products/');
      session.saveChanges();
      console.log('Conexión exitosa a RavenDB');
      console.log('Resultado de prueba:', result);
    } catch (error) {
      console.error('Error de conexión a RavenDB:', error);
    } finally {
      // Cierra la sesión de RavenDB
      session.dispose();
    }
  }
  
  // Ejecuta la función de prueba de conexión
  testConnection();



/*
async function saveData() {
    let product = {
        id: '1',
        title: 'iPhone X',
        price: 999.99,
        currency: 'USD',
        storage: 64,
        manufacturer: 'Apple',
        in_stock: true,
        last_update: new Date('2017-10-01T00:00:00')
    };
    
    await session.store(product);
    console.log(product.id); // products/1-A
    await session.saveChanges();

}

saveData();

*/









// Configura middleware para procesar solicitudes JSON
app.use(express.json());

app.listen(3000, ()=>{
    console.log("port connected")
})