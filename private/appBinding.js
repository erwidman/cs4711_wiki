const striptags = require('striptags');

function verifyArgs(args,length,types){
     if(!args || !Array.isArray(args) || args.length != length)
        return false;
    for(let i=0;i<types.length;i++){
        if(typeof args[i] !== types[i])
            return false;
    }
    return true;
}


const routines = {
    createUser : function(args,db,auth){
        return new Promise((resolve, reject) => {
            args[1] = auth;
            if(!verifyArgs(args,2,['string','string']))
                reject('invalid_arg');

            uname = args[0].striptags(uname);
            db.createUser(uname,auth)
            .then((result) => {
                if(typeof result !== 'object')
                    return result;
                else{
                    console.error(result);
                    rej('unable_to_create_user');
                }
            });
            

        })
    }
};



function routeRequest(params,res,db,auth){

    if(!params.command || !routines[params.command])
        return res.status(400).end();

    routines[params.command](params.args,db,auth)
    .then((msg)=> res.send(msg))
    .catch((err)=>res.status(418).end());

}

function bindApplication(app,db){
    app.get('/request',(req,res,next)=>{
        db.checkBlacklist(req.ip)
        .then((isOn)=>{
            if(isOn===true){
                res.status(401).end();
                return false;
            }
            else 
                return isOn;
        })
        .then((ready)=>{
            if(ready)
                routeRequest(req.params,res,db,req.headers.authorization);
        })
        .catch((err)=>{
            console.error(err);
        });
    
    });

}


module.exports={
    bindApplication
};