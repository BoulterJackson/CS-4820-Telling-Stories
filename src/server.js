require("dotenv").config()

const express = require("express")
const session = require("express-session")
const flash = require("express-flash")
const methodOverride = require("method-override")
const bodyParser  = require("body-parser")
const expressH5P = require('./h5p/expressH5P')

const regestrationRoute = require('./registration')
const usersRoute = require('./users')
const accountRoute = require('./account')
const passwordRoute = require('./password')

const passport = require("passport")
const initializePassport = require('./config/passport')
const db = require("./config/database")
const auth = require('./authenticate')

initializePassport(
    passport,
    async email => await db.User.findFirst({ where: { email } }),
    async id => await db.User.findFirst({ where: { id } })
)

const server = express()

server.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false, // we want to resave the session variable if nothing is changed
    saveUninitialized: false
}))

server.set('views', './views')
server.set('view engine', 'ejs')
server.use('/public', express.static('public'))
server.use(flash())
server.use(methodOverride("_method"))

server.use(passport.initialize())
server.use(passport.session())

// Express H5P setup
server.use(bodyParser.json({ limit: '500mb' }));
server.use(bodyParser.urlencoded({extended: true}));






/**
 * start the server 
 * HEADS UP: this has been moved to ./startServer.js to support the use of jest tests
 * this is due to when the server is exported to example.test.js it runs the below code and 
 * starts a seperate instance of this server
 */
// const PORT = 8080
// server.listen(PORT)
// console.log(`Server started on port http://localhost:${PORT}...`)



expressH5P(server)

/**
 * server code, primarily uses Expresses routes, and creates 'mini-apps' for the main functionalities
 * of our application
*/
server.get('/', async(req, res) => {
    res.render("index.ejs")
})

server.use('/registration', regestrationRoute)
server.use('/users', usersRoute)
server.use('/account', accountRoute)
server.use('/password', passwordRoute)

server.get("/demo", (req, res) => {
    res.render('demo.ejs')
})

/**
 * export server module
 */
module.exports = server


/**
 * start the server and export server module
 */
// const PORT = process.env.PORT || '8080';
// server.listen(PORT)
// console.log(`Server started on port http://localhost:${PORT}...`)

