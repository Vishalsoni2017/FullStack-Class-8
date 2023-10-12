const validator = require('validator')
const bcrypt = require('bcryptjs')

const usersCollection = require('../db').db().collection("users");

let User = function(data){
    this.data = data
    this.errors = []
}

User.prototype.cleanUp = function(){
    if (typeof(this.data.username) != "string") {this.data.username = ""}
    if (typeof(this.data.email) != "string") {this.data.email = ""}
    if (typeof(this.data.password) != "string") {this.data.password = ""}

    // get rid of bogus property
    this.data = {
        username: this.data.username.trim().toLowerCase(),
        profile: this.data.profile,
        email: this.data.email.trim().toLowerCase(),
        password: this.data.password
    }

}

User.prototype.validate = function(){
    return new Promise(async (resolve, reject) => {
        if (this.data.username == "") {this.errors.push("You must provide a username.")}
        if (this.data.username != "" && !validator.isAlphanumeric(this.data.username)) {this.errors.push("Username can only contain letters and numbers.")}
        if (!validator.isEmail(this.data.email)) {this.errors.push("You must provide a valid email address.")}
        if (this.data.password == "") {this.errors.push("You must provide a password.")}
        if (this.data.password.length > 0 && this.data.password.length < 6) {this.errors.push("Password must be at least 6 characters.")}
        if (this.data.password.length > 50) {this.errors.push("Password cannot exceed 50 characters.")}
        if (this.data.username.length > 0 && this.data.username.length < 3) {this.errors.push("Username must be at least 3 characters.")}
        if (this.data.username.length > 30) {this.errors.push("Username cannot exceed 30 characters.")}

        if(this.data.username.length > 2 && this.data.username.length < 31 && validator.isAlphanumeric(this.data.username)){
            let usernameExist = await usersCollection.findOne({username: this.data.username})
            if(usernameExist) {this.errors.push("Username already exists.")}
        }

        if(validator.isAlphanumeric(this.data.email)){
            let emailExist = await usersCollection.findOne({email: this.data.email})
            if(emailExist) {this.errors.push("Email already exists")}
        }
        resolve()
    })
}

User.prototype.register = function(){
    // use arrow function below instead of traditional function otherwise this.data will be undefined 
    // and mongodb error: Cannot read property '_id' of undefined as the data will be empty
    return new Promise(async (resolve, reject)=>{
        // step1 validate and cleanup data
        this.cleanUp()
        await this.validate()

        
        // step2 store the user into the db
        if(!this.errors.length){
            let salt = bcrypt.genSaltSync(10)
            this.data.password = bcrypt.hashSync(this.data.password, salt)
            await usersCollection.insertOne(this.data)
            resolve()
        }else{
            reject(this.errors)
        }
    })
}

User.prototype.login = function(){
    return new Promise((resolve, reject)=>{
        this.cleanUp()
        usersCollection.findOne({username: this.data.username}).then(attemptedUser =>{
            if(attemptedUser && bcrypt.compareSync(this.data.password, attemptedUser.password)){
                resolve("login successful")
            }else{
                reject("login failed")
            }
        }).catch(()=>{
            reject("Please try again later")
        })
    })
}

module.exports = User