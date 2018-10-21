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

function collectArgs(params){
    let index =0;
    let final = [];

    while(params[index+'']){
        final.push(params[index]);
        index++;
    }
    return final;
}

const routines = {
    createUser : function(args,db,auth){
        return new Promise((resolve, reject) => {
            args[1] = auth;

            if(!verifyArgs(args,2,['string','string']))
                reject('invalid_arg');
            let uname = striptags(args[0]);
            db.createUser(uname,auth)
            .then((result) => {
                if(typeof result !== 'object')
                    resolve(result);
                else{
                    console.error(result);
                    reject('unable_to_create_user');
                }
            });
            

        });
    },
    login : function(args,db,auth){
        return new Promise((resolve, reject) => {
            args[1] = auth;
            if(!verifyArgs(args,2,['string','string']))
                reject('invalid_arg');
            let uname = striptags(args[0]);
            db.login(uname,auth)
            .then((result)=>resolve(result))
            .catch((err)=>reject(err));
        });
    },
    removeUser : function(args,db,auth){
        return new Promise((resolve, reject) => {
            console.log(args);
            if(!verifyArgs(args,1,['string']))
                reject('invalid_arg');
            auth = auth.split('?~?~?');
            let user = auth[0];
            let pass = auth[1];
            let uname = args[0];
            console.log(auth);
            db.login(user,pass)
            .then((result)=>{
                if(result){
                    db.removeUser(uname)
                    .then((stat)=>{

                        if(stat===true)
                            resolve(true);
                        else
                            reject();
                    });
                }
            })
            .catch((err)=>reject(err));
        });
    }

};



function routeRequest(params,res,db,auth){
  
    if(!params.command || !routines[params.command])
        return res.status(400).end();
    console.log(params);
    let args = collectArgs(params);
    routines[params.command](args,db,auth)
    .then((msg)=> res.send(`${msg}`))
    .catch((err)=>{
        console.error(err);
        res.status(418).end()
    });

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
                routeRequest(req.query,res,db,req.headers.authorization);
        })
        .catch((err)=>{
            console.error(err);
        });
    
    });

}


module.exports={
    bindApplication
};