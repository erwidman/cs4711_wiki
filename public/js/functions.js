$('#create-user-button').on('click', function () {//when an element with id="create-user-button" is clicked
    var args = {//a dictionary object
        username: $('#create-user-email').val(),// val of the input with id="create-user-email"
        password: $('#create-user-password').val(),
        successCallback: function () {
            alert("success! created user")//function to do when complete(Like hiding loading icon)
        }
    };
    console.log('creating user: ', args);
    createUser(args)
});

/**
 *
 * @param args {object}
 * @param [args.username] - users username, presumably email. No spaces
 * @param [args.password] - users password no spaces
 * @callback [args.successCallback] - functions used when ajax is successful
 * @callback [args.failureCallback] - functions used when ajax fails
 */
function createUser(args) {
    if(!args.username || !args.password){
        args.failureCallback || function () {
            alert("error in createUser" + JSON.stringify(args))
        }()
    }
    $.ajax({
        url: '/request?command=createUser&0='+args.username,
        async: true,
        success: args.successCallback,
        error: args.failureCallback || function () {
            alert("error in createUser")
        },
        beforeSend: function (xhr) {
            xhr.setRequestHeader('authorization', args.password);
        }
    })
}


$('#login-user-button').on('click', function () {
    var args = {
        username: $('#login-user-email').val(),
        password: $('#login-user-password').val(),
        successCallback: function () {
            alert("success! created user")
        }
    };
    console.log('login user: ', args);
    login(args)
});



/**
 *
 * @param args {object}
 * @param [args.username] - users username, presumably email
 * @param [args.password] - users password
 * @param [args.successCallback] - functions used when ajax is successful
 * @param [args.failureCallback] - functions used when ajax fails
 */
function login(args) {
    $.ajax({
        url: '/request?command=login&0='+args.username,
        async: true,
        success: args.successCallback,
        error: args.failureCallback || function () {
            alert("error in login User")
        },
        beforeSend: function (xhr) {
            xhr.setRequestHeader('authorization', args.password);
        }
    })
}

$('#create-article-button').on('click', function(){
    var args = {
        content: $('#article-content').val(),
        title: $('#article-title').val()
    }
    createArticle(args)
});


/**
 *
 * @param args {object}
 * @param [args.owner=] - users username, presumably email
 * @param [args.content] - users password
 * @param [args.title] - functions used when ajax is successful
 * @param [args.successCallback] - functions used when ajax is successful
 * @param [args.failureCallback] - functions used when ajax fails
 */
function createArticle(args){
    $.ajax({
        url: '/request?command=createArticle&0='+ (args.owner || 'anon')+'&1='+args.title+'&2='+args.content,
        async: true,
        success: args.successCallback,
        error: args.failureCallback || function () {
            alert("error in createArticle")
        },
        beforeSend: function (xhr) {
            xhr.setRequestHeader('authorization', args.password);
        }
    })
}
