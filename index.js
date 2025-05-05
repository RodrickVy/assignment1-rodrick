
const {database} = require("./databaseConnection.js");
const {createHTMLPage,getRandomOneToThree} = require("./util.js");

require('dotenv').config();
const express = require("express");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const bcrypt = require("bcrypt");
const saltRounds = 12;

const port = process.env.PORT || 3000;
const app = express();


// serve public folder

app.use("/js", express.static("./public/js"));
app.use("/css", express.static("./public/css"));
app.use("/img", express.static("./public/img"));

const Joi = require("joi");

// Session must expire after 1 hour
const expireTime = 60 * 60 * 1000;



/* Secret information section */
const mongodb_host = process.env.MONGODB_HOST;
const mongodb_user = process.env.MONGODB_USER;
const mongodb_password = process.env.MONGODB_PASSWORD;
const mongodb_database = process.env.MONGODB_DATABASE;
const mongodb_session_secret = process.env.MONGODB_SESSION_SECRET;

const node_session_secret = process.env.NODE_SESSION_SECRET;
/* END secret section */


const userCollection = database.db(mongodb_database).collection('users');
const mongoStore = MongoStore.create({
    mongoUrl: `mongodb+srv://${mongodb_user}:${mongodb_password}@${mongodb_host}/sessions`,
    crypto: {
        secret: mongodb_session_secret
    }
})
app.use(express.urlencoded({extended: false}));
app.use(session({
        secret: node_session_secret,
        store: mongoStore, //default is memory store
        saveUninitialized: false,
        resave: true
    }
));

// Schemas for NSQL injection prevention (max length based on IEEE security standards)
const nameSchema = Joi.string().min(8) .max(155).required();
const passwordSchema = Joi.string().min(8)                            // Minimum length 8 characters
    .max(30)                           // Maximum length 30 characters
    // .pattern(new RegExp('^(?=.*[a-z])')) // At least one lowercase letter
    // .pattern(new RegExp('^(?=.*[A-Z])')) // At least one uppercase letter
    // .pattern(new RegExp('^(?=.*[0-9])')) // At least one number
    // .pattern(new RegExp('^(?=.*[!@#$%^&*])')) // At least one special character
     .required()
    .messages({
        'string.min': 'Password must be at least 8 characters long.',
        'string.max': 'Password must be no more than 30 characters long.',
        //'string.pattern.base': 'Password must include uppercase, lowercase, number, and special character.',
        'any.required': 'Password is required.'
    });
const emailSchema = Joi.string().min(3) .max(255).required();


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
            <h4 id="memberGreeting">Hello, ${req.session.username}</h4>
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
          <label for="email" class="label">Email
            <input id="email" name="email" type="email" placeholder="Enter your email">
          </label>
          <label for="password" class="label">Password
            <input id="password" name="password" type="password" placeholder="Enter your password">
          </label>
          <button class="button" type="submit">Submit</button>
        </form>
   `);


    res.send(html);
})


// Renders the html form for signup
app.get("/signup", (req, res) => {

    let html = createHTMLPage(`
        <form action="/signupSubmit" class="section" >
           <label for="username" class="label">Name
            <input id="username" name="username" type="text" placeholder="Enter your email">
          </label>
          <label for="email" class="label">Email
            <input id="email" name="email" type="email" placeholder="Enter your email">
          </label>
          <label for="password" class="label">Password
            <input id="password" name="password" type="password" placeholder="Enter your password">
          </label>
          <button class="button" type="submit">Submit</button>
        </form>
   `);


    res.send(html);
})


app.get("/loginSubmit", async (req, res) => {

    const email = req.query.email;
    const password = req.query.password;

    const validateEmail = emailSchema.validate(email);

    const validatePassword = passwordSchema.validate(password);

    // If name is poorly formated
    if (validateEmail.error != null) {
        res.status(400).send(createHTMLPage(`
    <section class="section" >
      ${ email.length > 0 ?'The email provided is badly formated please try again.':'Missing email, email is required.' }
      <a href="/login" class="button"> Try Again</a>
    </section>
`));
        return;
    }
    // If password is poorly formated
    if (validatePassword.error != null) {
        res.status(400).send(createHTMLPage(`
    <section class="section">
      ${ password.length > 0 ? 'The password provided is badly formated:':'Password is missing, password is required'}
   
      <a  href="/login" class="button"> Try Again</a>
    </section>
`));
        return;
    }



    const usersFound = await  userCollection.find({email:email}).project({username:1,email:1,password:1,_id:1}).toArray();
    console.log(usersFound)
    if(usersFound.length !== 1){
        res.send(createHTMLPage(`
    <section class="section">
      User not found, maybe create an account or try again.
      <a href="/login" class="button"> Try Again</a>
    </section>
`));
        return;
    }


    if(await bcrypt.compare(password, usersFound[0].password)) {

        req.session.authenticated = true;
        req.session.username = usersFound[0].username;
        req.session.cookie.maxAge = expireTime;
        res.redirect('/');

    }else{
        res.send(createHTMLPage(`
    <section class="section">
      Invalid login credentials, wrong password.
      <a href="/login" class="button"> Try Again</a>
    </section>
`));
    }

})



app.get("/signupSubmit", async (req, res) => {

    const username = req.query.username;
    const email = req.query.email;
    const password = req.query.password;
    const validateUsername = nameSchema.validate(username);
    const validateEmail = emailSchema.validate(email);
    const validatePassword = passwordSchema.validate(password);

    // If name is poorly formated
    if (validateUsername.error != null) {
        res.status(400).send(createHTMLPage(`
    <section class="section" >
      ${username.length > 0 ? 'The username provided is badly formated please try again.' : 'Missing name, user name is required'}
      <a href="/signup" class="button"> Try Again</a>
    </section>
`));
        return;
    }
    // If name is poorly formated
    if (validateEmail.error != null) {
        res.status(400).send(createHTMLPage(`
    <section class="section" >
      ${email.length > 0 ? 'The email provided is badly formated please try again.' : 'Missing email, email is required'}
      <a href="/signup" class="button"> Try Again</a>
    </section>
`));
        return;
    }
    // If password is poorly formated
    if (validatePassword.error != null) {
        res.status(400).send(createHTMLPage(`
    <section class="section">
      ${password.length > 0 ? ' The password provided is badly formated: ':'Password is mising, password is required'}
   
      
      <a  href="/signup" class="button"> Try Again</a>
    </section>
`));
        return;
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    await userCollection.insertOne({username: username,email:email, password: hashedPassword});

    req.session.authenticated = true;
    req.session.username =username;
    req.session.cookie.maxAge = expireTime;
    res.redirect('/');

})

app.get('/logout', (req,res) => {
    req.session.destroy();
    res.redirect('/');
});


app.get('/members', (req,res) => {

    if(req.session === undefined || req.session.authenticated === undefined || req.session.username === undefined) {

        res.status(404).redirect('/')
        return;
    }
    let html = createHTMLPage(`
        <section  class="section" >
          <h4 id="memberGreeting">Hello, ${req.session.username}</h4>
            <img alt="quote on power" width="80%" src="/img/random_${getRandomOneToThree()}.jpg"><br>
            <a class="button" href="/logout">Log out</a>
        </section>
   `);

    res.send(html);
});


app.use((req,res) => {

    const html = createHTMLPage(`
    <section class="section" id="memberOptions">
    <h1 >404</h1>
    <h4 class="displayMessage">Oops! Page Not Found</h4>
    <a class="button" href="/">Go Home</a>
</section>
`);
    res.status(404).send(html)
})

// RUN SERVER
app.listen(port, function () {
    console.log("Example app listening on port " + port + "!");
});

