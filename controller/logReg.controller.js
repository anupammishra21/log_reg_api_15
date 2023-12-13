const userModel = require('../model/logreg.model')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken');
const mailer = require("../helper/mailer");
const dayJs = require('dayjs')


class loginRegisterController{

    //<<<<<<<<<<<<<<<<<<<<<  authentication part >>>>>>>>>>>>>>>>>>>>>>>>>>>>

    async userAuth(req, res, next){
        try{
            if(!_.isEmpty(req.user)){                   
                next();
            } else {
                res.status(200).json({
                    message: "UnAuthorized UseR .. Please Login",
                    data:[]
                });                                          
            }

        }catch(err){
            throw(err);
        }
    }
//<<<<<<<<<<<<<<<<<<<<<<< show welcome status >>>>>>>>>>>>>>>>>>>>>>>>

    async welcomeStatus(req,res){
        try{
            
       res.status(200).json({
        message:"welcome",
        data:[]
       })

        }catch(err){
            throw err
        }

    }
//  <<<<<<<<<<<<<< user Register >>>>>>>>>>>>>>>>>>

    async register(req,res){
        try{
            if (_.isEmpty(req.body.name)) {
                return res.status(400).json({
                    message:"name is required",
                    data:[]
                })
            }

            if (_.isEmpty(req.body.email)) {
                return res.status(400).json({
                    message:"Email is Required",
                    data:[]
                })
            }

            if (_.isEmpty(req.body.password)) {
                return res.status(400).json({
                    message:"password is Required",
                    data:[]
                })
            }

            if (_.isEmpty(req.body.confirm_password)) {
                return res.status(400).json({
                    message:"confirm password is Required",
                    data:[]
                })
            }

        let is_email_exist = await userModel.findOne({email: req.body.email})

        if (!_.isEmpty(is_email_exist)) {
            return res.status(400).json({
                message: " this email is already exist ",
                data:[]
            }) 
        }

        if (req.body.password !== req.body.confirm_password) {
            return res.status(400).json({
                message:"password and confirm password is does not matching ",
                data:[]
            }) 
        }

        req.body.password = bcrypt.hashSync(req.body.password,bcrypt.genSaltSync(10))
        const dateTimeObject = new Date();
        // await mailer.sendMail(
        //     process.env.EMAIL,req.body.email,"sucessfully Registered",`hiw ${req.body.name}
        //     your account has been registered, <br> Date :${dateTimeObject.toDateString()} <br> Time : ${dateTimeObject.toTimeString()}`
            
        // )

        let saveData = await userModel.create(req.body)
        if (!_.isEmpty(saveData)&& saveData._id ) {
            res.status(200).json({
                message:" Your registration has been sucessfully completed ",
                data:[saveData]
            })
            
        }else{
            res.status(400).json({
                message:" something went wrong ",
                data:[]
            })
        }
         }catch(err){
            throw err
        }

    }
// <<<<<<<<<<<<<<<< user login >>>>>>>>>>>>>>>>
    async login(req,res){
        try{
            if (_.isEmpty(req.body.email)) {
                return res.status(400).json({
                    message:"Email is required",
                    data:[]
                })
             }
             if (_.isEmpty(req.body.password)) {
                return res.status(400).json({
                    message:"password is required",
                    data:[]
                })
             }

             let email_exist = await userModel.findOne({email: req.body.email})

             if (_.isEmpty(email_exist)) {  
                res.status(400).json({
                    message:"email does not exist with this account",
                    data:[]
                })
                
             } 


            if (email_exist.lockUntil && email_exist.lockUntil > new Date()) {
                return res.status(403).json({
                     message: 'Account locked. Try again later.' 
                    });
              }


              const hashpassword = await bcrypt.compare(req.body.password, email_exist.password);

              if (hashpassword) {
                email_exist.loginAttempts = 0;
                email_exist.lockUntil = null;
                await email_exist.save()
                 let token = jwt.sign({
                 id:email_exist._id,
                    },'abcdefg',{expiresIn:"2d"})
                 res.cookie('user_token',token,{expires: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)})
                 return res.status(200).json({ 
                    message: 'Login successful' 
                });
                
                
              } else{
                email_exist.loginAttempts += 1;
                if (email_exist.loginAttempts >= 3) {
                 email_exist.lockUntil = new Date(Date.now() + 1 * 60 * 1000)
                 await email_exist.save();
                    //      await mailer.sendMail(
                    //  process.env.EMAIL,req.body.email,`hiw ${req.body.email}
                    //    your account has been blocked due to multitime wrong password ` )
                       return res.status(401).json({ 
                        message: 'incorrect password,your ac has been locked' 
                    });
                     } else{
                        await email_exist.save();
                        return res.status(401).json({ 
                            message: 'Incorrect password' 
                        });
                     } 
                    }



           
             
             

        }
            catch(err){
                res.status(500).json({ 
                    message: 'Internal server error' 
                });
            throw err
           

        }


    }
//   <<<<<<<<<<<< user dashboard >>>>>>>>>>>>>>>>>>
    async dashboard(req,res){
        try{
            if (!_.isEmpty(req.user)) {
                let login_user = await userModel.findOne({_id:req.user.id})
                res.status(200).json({
                    message:`Welcome ${login_user.name}`,
                    data:[login_user]
                })
            }else{
                res.status(401).json({
                    message:"plz login",
                    data:[]
                })
            }

        }catch(err){
            throw err

        }

    }

    // <<<<<<<<<< logout section >>>>>>>>>>>>>>>

    async logout(req,res){
        try{
            res.clearCookie('user_token')
            res.status(200).json({
                message:"logged out",
                data:[]
            })

        }catch(err){
            throw err

        }
    }



}

module.exports = new loginRegisterController()