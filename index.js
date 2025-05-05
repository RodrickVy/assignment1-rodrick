require("./util");

const express = require("express");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const bcrypt = require("bcrypt");
const saltRounds = 12;

const port = process.env.PORT || 3000;
const app = express();


// serve public folder

app.use("/js", express.static("./public/js"));
app.use("/js", express.static("./public/js"));
app.use("/css", express.static("./public/css"));
app.use("/img", express.static("./public/img"));

const Joi = require("joi");

// Session must expire after 1 hour
const expireTime = 60 * 60 * 1000;



/* secret information section */
const mongodb_host = process.env.MONGODB_HOST;
const mongodb_user = process.env.MONGODB_USER;
const mongodb_password = process.env.MONGODB_PASSWORD;
const mongodb_database = process.env.MONGODB_DATABASE;
const mongodb_session_secret = process.env.MONGODB_SESSION_SECRET;

const node_session_secret = process.env.NODE_SESSION_SECRET;
/* END secret section */

var database = include('databaseConnection');

const userCollection = database.db(mongodb_database).collection('users');

app.use(express.urlencoded({extended: false}));

// Schemas for NSQL injection prevention (max length based on IEEE security standards)
const nameSchema = Joi.string().max(155).required();
const passwordSchema = Joi.string().max(100).required();
const emailSchema = Joi.string().max(255).required();


// Handles home page, shows authentication options for unauthenticated user and member welcome otherwise.
app.get("/", (req, res) => {

    let html = createHTMLPage(`
        <section class="section" >
             <a class="button" href="/signup">Sign Up</a>
             <a class="button" href="/login">Login</a>
        </section>
   `);
    if (req.session !== undefined && req.session.authenticated) {
        html = createHTMLPage(`
        <section class="section" >
            <h4 id="memberGreeting">Hello, ${req.session.name}</h4>
            <a class="button" href="/members">Go To Members Area</a>
            <a class="button" href="/logout">Log out</a>
        </section>
   `);
    }

    res.send(html);
})


// Renders the html form for log in
app.get("/login", (req, res) => {

    let html = createHTMLPage(`
        <form action="/loginSubmit" class="section" >
          <label for="name" class="label">Email
            <input id="name" name="username" type="email" placeholder="Enter your email">
          </label>
          <label for="password" class="label">Password
            <input id="password" name="password" type="password" placeholder="Enter your password">
          </label>
          <button class="button" type="submit">Submit</button>
        </form>
   `);


    res.send(html);
})

// Renders the html form for log in
app.get("/loginSubmit", (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    const validateUserName = nameSchema.validate(username);

    const validatePassword = passwordSchema.validate(password);

    if(validateUserName.error != null || validatePassword != null){

    }


    res.send(html);
})


// RUN SERVER
app.listen(port, function () {
    console.log("Example app listening on port " + port + "!");
});

