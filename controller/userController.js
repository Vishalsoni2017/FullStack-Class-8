const User = require('../models/User')

exports.register = (req, res)=>{
    let user = new User(req.body)
    user.register().then(()=>{
        res.send("registered successfully!!!")
    }).catch(err =>{
        console.log(err)
        res.send("error!!!")
    })
}

// two types of auth- session, token

exports.login = (req, res)=>{
    let user = new User(req.body)
    user.login().then((result)=>{
        console.log(result)
        req.session.user = {username: user.data.username}
        req.session.save(()=>res.redirect('/'))
    }).catch(err=>{
        console.log(err)
        req.session.save(()=>res.redirect('/'))
    })
}

exports.logout = (req, res)=>{
    req.session.destroy(()=>res.redirect('/'))
}

exports.home = (req, res)=>{
    if(req.session.user){
        res.render('home-logged-in-no-results')
    }else{
        res.render('home-guest')
    }
}