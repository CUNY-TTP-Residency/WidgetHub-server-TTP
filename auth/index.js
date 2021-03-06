const express = require('express')
const router = express.Router()
const models = require('../db/models');

router.post('/login', (req, res, next) => {
    //searches for user with matching email
    models.User.findOne({
        where: 
        {
            email: req.body.email
        },
            include: [models.Preferences, models.Tasks]

    })
    .then(user => {
        //if no user matches, sends an error that email or password is wrong
        if(!user) {
            res.status('401')
            .send('Wrong email/password')
        }
        //if email is found in db, checks if password does not match the password stored in db
        else if(!user.correctPassword(req.body.password)) {
            //error if password does not match
                res.status('401')
                .send('Wrong email/password')
            }
            //runs if email and password match db
        else {
            //passport function, creates a session for the user that has been logged in
            req.login(user, err => {
                return err ?
                next(err) :
                res.json(user)
            })
        }
    })
    .catch(err => next(err))
})

router.post('/signup', (req, res, next) => {
    //adds new user to the database
    models.User.create({
        firstName: req.body.firstName,
        email: req.body.email,
        password: req.body.password,
        preference: {
            clock: req.body.clock,
            toDoList:req.body.toDo,
            weather:req.body.weather,
            news: req.body.news,
            covid: req.body.covid
        }
    },{
        include: models.Preferences
    })
    .then(createdUser => {
            req.login(createdUser, err => (err ? next(err) :res.json(createdUser)))
        })
    // //creates a session for the user that has been registered
    // .then(user => {
    //     return req.login(user, err => (err ? next(err) :res.json(user)))
    // })
    .catch(err => {
        //checks if error is due to an email that is already registered to the database
        if (err.name === 'SequelizeUniqueConstraintError') {
            res.status(401).send("Email is already in use")
        }
        else {
            return next(err)
        }
    })
})


//does not delete user from database
router.delete('/logout', (req, res, next) => {
    //logs out current user from the session
    req.logOut()
    //ends current session
    req.session.destroy(err => {
        if (err) {
            return next(err)
        }
        else{
            res.status(201).end()
        }
    })
})

router.get("/me", (req, res) => {
    //used for debugging
    const user = req.user ? req.user : ""
    res.json(user);
  });

module.exports = router