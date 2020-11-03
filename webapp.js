const express = require("express");
const app = express();
const mysql = require("mysql");
const { Pool } = require("pg");
const bodyParser = require('body-parser')
const session = require("express-session");
const flash = require('express-flash')
var path = require("path")
const fileUpload = require("express-fileupload");
const nodemailer = require("nodemailer");
const XLSX = require("xlsx");
const poolPostgres = new Pool({
  max: 20,
  host: 'localhost',
  user: 'postgres',
  password: '16971226',
  database: 'Masivian'
});
var poolMySql = mysql.createPool({
  connectionLimit: 20,
  host: 'localhost',
  user: 'root',
  password: 'fn2h2ye2',
  database: 'blog_viajes'
});
app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('public'));
app.use(session({ secret: 'token-muy-secreto', resave: true, saveUninitialized: true }));
app.use(flash());
app.use(fileUpload());
app.listen(8080, function () {
  console.log("Servidor Iniciado");
});
app.get("/apuesta/:id", function (req, res) {
  res.render("apuesta", { message: req.flash('message'), id:req.params.id});
});
app.get("/cerrar-apuesta", function (req, res) {
  res.render("cierre", { message: req.flash('message') });
});
app.get('/crear_ruleta', function (request, response) {
  poolPostgres.connect(function (err, client, release) {
    if (err) {
      console.log("error conectandose a la base de datos: " + err);
      request.flash('message', 'Error conectando Base de Datos');
      response.redirect('/');
    }
    const query = `INSERT INTO ruleta(estado) VALUES('Cerrada')`;
    client.query(query, function (error, rows) {
      if (error) {
        request.flash('message', 'Error en la consulta...');
        console.log(error);
        response.redirect('/');
      }
      else {
        request.flash('message', `Ruleta creada con exito!`);
        response.redirect('/');
      }
    });
    release();
  });
});
app.get('/abrir_ruleta/:id', function (request, response) {
  poolPostgres.connect(function (err, client, release) {
    if (err) {
      console.log("error conectandose a la base de datos: " + err);
      request.flash('message', 'Error conectando Base de Datos');
      response.redirect('/');
    }
    const query = `SELECT * FROM ruleta WHERE id=${request.params.id}`;
    client.query(query, function (error, rows) {
      if (error) {
        request.flash('message', 'Error en la consulta...');
        console.log(error);
        response.redirect('/');
      }
      else {
        if (rows.rowCount != 0) {
          const queryUpdate = `UPDATE ruleta SET estado='abierta' where id=${request.params.id}`
          client.query(queryUpdate, function (err, rows) {
            if (error) {
              request.flash('message', 'Error actualizando el estado de la ruleta');
              console.log(error);
              response.redirect('/');
            }
            request.flash('message', `Ruleta abierta con Exito!`);
            response.redirect('/');
          });
        }
        else {
          request.flash('message', `El Id ingresado no corresponde a ningun ruleta... Intente de nuevo`);
          response.redirect('/');
        }
      }
    });
    release();
  });
});
app.get("/", function (req, res) {
  poolPostgres.connect(function (err, client, release) {
    if (err) {
      console.log("error conectandose a la base de datos: " + err);
      request.flash('message', 'Error conectando Base de Datos');
      response.redirect('/');
    }
    const consulta = `select * from ruleta`;
    client.query(consulta, function (err, result2) {
      const columnBaseDatos = [];
      for (var i in result2.fields) {
        columnBaseDatos[i] = result2.fields[i].name;
      }
      let datos = [];
      datos = result2.rows;
      var prueba = datos[0];
      res.render("index", { message: req.flash('message'), data: datos, column: columnBaseDatos });
    })
    release();
  })
});
app.post("/procesar-apuesta", function (req, res) {
  poolPostgres.connect(function (err, client, release) {
    const idRoulette = req.body.idRuleta;
    const num = req.body.numero;
    let color = req.body.color;
    const cash = req.body.dinero;
    const query2 = `SELECT *FROM ruleta WHERE id=${idRoulette}`;
    let query = `INSERT INTO apuesta(ruleta_id,numero,color,dinero_apostado,estado_apuesta)
    VALUES (${idRoulette}, ${num}, ${color}, ${cash}, 'Abierta')`;
    if (color == undefined) {
      color = '';
      query = `INSERT INTO apuesta(ruleta_id,numero,dinero_apostado,estado_apuesta)
      VALUES (${idRoulette}, ${num}, ${cash}, 'Abierta')`;
    }
    if (num == '') {
      query = `INSERT INTO apuesta(ruleta_id,color,dinero_apostado,estado_apuesta)
      VALUES (${idRoulette}, ${color}, ${cash}, 'Abierta')`;
    }
    client.query(query2, function (err2, result) {
      if (result.rowCount == 0) {
        req.flash('message', 'Error la ruleta a la que trata de apostar.. No existe!!');
        res.redirect('/apuesta');
      }
      else {
        const stateRoulette = result.rows[0].estado;
        if (stateRoulette == 'Cerrada') {
          req.flash('message', `Error... La Ruleta con id '${idRoulette}' se encuentra Cerrada`);
          res.redirect('/apuesta');
        }
        else {
          client.query(query, function (error, result) {
            if (num != '' ^ color != '') {
              if (error) {
                console.log(error);
                req.flash('message', 'Error de comunicacion con la base de datos');
                res.redirect('/apuesta');
              }
              else {
                if (num > 36 || num < 0 || cash > 10000) {
                  req.flash('message', 'Error.. No cumple las condiciones para realizar la apuesta');
                  res.redirect('/apuesta');
                }
                else {
                  req.flash('message', 'Apuesta realizada con Exito!');
                  res.redirect('/apuesta');
                }
              }
            }
            else {
              req.flash('message', 'Error... Debe apostar a color o numero pero,  no  a las dos a la vez');
              res.redirect('/apuesta');
            }
          });
        }
      }
    });
    release();
  })
})
app.post("/procesar-cerrar", function (req, res) {
  poolPostgres.connect(function (err, client, release) {
    const idRoulette = req.body.idRuleta;
    const query = `SELECT *FROM ruleta WHERE id=${idRoulette}`;
    client.query(query, function (err2, result) {
      if (result.rowCount == 0) {
        req.flash('message', 'Error... La ruleta que esta tratando de cerrar, no existe!');
        res.redirect('/cerrar-apuesta');
      }
      else {
        if (result.rows[0].estado == 'Cerrada') {
          req.flash('message', 'Error... La ruleta ya esta Cerrada');
          res.redirect('/cerrar-apuesta');
        }
        else {
          const query2 = `UPDATE ruleta SET estado='Cerrada' WHERE id=${idRoulette}`;
          client.query(query2, function (err3, result) {
            const number = numberWin();
            const color = numberOdd(number) ? 'rojo' : 'negro';
            const query3 = `SELECT *FROM apuesta WHERE ruleta_id= ${idRoulette}`;
            client.query(query3, function (err4, result) {
              if (err4) {
                console.log("Error4: " + err4);
                req.flash('message', 'Error procesando la solicitud');
                res.redirect('/cerrar-apuesta');
              }
              else {
                let bets = result.rows;
                for (var j in bets) {
                  const colorDataBase = bets[j].color;
                  const numberDataBase = bets[j].numero;
                  const cashBet = bets[j].dinero_apostado
                  let reward = 0;
                  if (numberDataBase != null && (numberDataBase == number)) {
                    reward = cashBet * 5;
                  }
                  else if (colorDataBase != null && (colorDataBase == color)) {
                    reward = cashBet * 1.8;
                  }
                  const betStatus = (reward == 0) ? 'Perdida' : 'Ganada';
                  const query4 = `UPDATE apuesta SET
                  premio=${reward},
                  estado_apuesta='${betStatus}'
                  WHERE ruleta_id=${idRoulette}
                  `;
                  client.query(query4, function (err5, result) {
                    if (err5) {
                      console.log("error5" + err5);
                      req.flash('message', 'Error procesando la solicitud');
                      res.redirect('/cerrar-apuesta');
                    }
                    else {
                      res.render("resultado-apuestas", { message: req.flash('message'), data: bets});
                    }
                  });
                }
              }
            });
          });
        }
      }
    });
    release();
  });
});
function numberWin() {
  return Math.round(Math.random() * 36);
}
function numberOdd(number) {
  if ((number % 2) == 0) {
    return true;
  }
  else {
    return false;
  }
}
