const mongoose = require('mongoose')

const schemae = mongoose.Schema

const userSchema = schemae({
    name : { type: String , require:true },  
    email : { type: String , require:true },
    password : { type: String , require:true },
    loginAttempts: { type: Number, default: 0 },
    lockUntil:{type:Date,default:null},
    // isDeleted: { type: Boolean , enum: [true, false], default: false }

},{
    timestamps:true,
    versionkey:false
})

module.exports = mongoose.model('RegisterUser',userSchema)