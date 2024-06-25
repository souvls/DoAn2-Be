const jwt = require('jsonwebtoken');

class token{

    //method create token
    static getGenerateAccessToken(id,username,email){
        return jwt.sign({"id":id,"username":username,"email":email},process.env.ACCESS_TOKEN_KEY,{expiresIn:"100h",algorithm:"HS256" })
    }
    static getGenerateRefreshToken(username,email){
        return jwt.sign({"username":username,"email":email},process.env.REFRESH_TOKEN_KEY,{expiresIn:"30d",algorithm:"HS256" })
    }
    static getTokenAdmin(username,pass){
        return jwt.sign({"username":username,"pass":pass},process.env.ACCESS_TOKEN_KEY,{expiresIn:"1h",algorithm:"HS256" })
    }
    static getExpirDate(token){
        const decodedToken = jwt.decode(token, { complete: true });
        const expiryDate = new Date(decodedToken.payload.exp * 1000);
        return expiryDate;
    }
    static jwtValidate = (req,res,next)=>{
        //const tokenHeader = req.body.token || req.query.token || req.headers["x-access-token"];
        const tokenHeader =  req.headers.authorization
        if(tokenHeader){
            try{
                //convert token to object and save to req.user
                const token = req.headers.authorization.split(" ")[1];
                const decoded = jwt.verify(token,process.env.ACCESS_TOKEN_KEY);
                req.data = decoded;
                return next();
            }catch(err){
                return res.status(401).json({status:"no",msg:"Invalid token"});
            }
        }else{
            return res.status(401).json({status:"no",msg:"A token is required for authentication"});
        }
    }
    static jwtVerifyRefeshToken = (req,res,next)=>{
        const tokenHeader =  req.headers.authorization
        //Check the header contains the token or not.
        if(tokenHeader){
            try{
                const token = req.headers.authorization.split(" ")[1];

                jwt.verify(token,process.env.REFRESH_TOKEN_KEY,(err,decoded)=>{
                    if(err) return res.status(401).json({status:"no",msg:"Wrong token"});
                    req.token = token;
                    req.email = decoded.email;
                    return next();
                })
                
            }catch(err){
                return res.status(401).json({status:"no",msg:"Invalid token"});
            }
        }else{
            return res.status(401).json({status:"no",msg:"A token is required for authentication"});
        }
    }
}
module.exports = token;