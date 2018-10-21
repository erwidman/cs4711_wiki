const db = require(__dirname+'/dbInterface.js');


function startup(expressApp){

    db.createUser("anon","")
    .catch((err)=>console.error(err));

    require(`${__dirname}/appBinding.js`).bindApplication(expressApp,db);
}

module.exports ={startup};