# Masivian
Clean Code
API que representa una ruleta de apuestas:

La aplicacion se desarrollo en NodeJS. Para lanzar la misma es necesario utilizar el comando "npm run dev"
La base de datos utilizada fue PostgreSQL

END POINTS
1.Crear Ruleta
http://localhost:8080/crear_ruleta
Crea la ruleta y devuelve un listado de las ruletas y el estado de las mismas.
2.Apertura Ruleta.
http://localhost:8080/abrir_ruleta/:id'
En los header y mediante la ruta "abrir_ruleta" se especifica el id de la ruta que se quiere abrir.
Retorna el resultado de la operacion y vuelve a la pagina de inicio.
3.Apuesta a un numero.
http://localhost:8080/apuesta/:id
En el header se especifica el id de usuario.
Mediante un formulario se captura la informacion de la apuesta (validando que se cumpla con todos los requisitos)
4.Cierre de apuestas.
http://localhost:8080/cerrar-apuesta
Mediante un formulario se captura el id de la ruta y si la misma existe y esta abierta, se procesan las apuestas y se entrega el resultado de las mismas.
5.Listado de ruletas creadas
http://localhost:8080/
En la pagina de index se puede visualizar esta informacion
