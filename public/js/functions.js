$('#create-user').on('click', function () {
    var args = {
        username: 'keith' + new Date().getTime().toString().substr(5,13),
        password: 'test',
        successCallback: function () {
            alert("success! created user")
        }
    };
    console.log('creating user: ', args);
    createUser(args)
});

/**
 *
 * @param args {object}
 * @param [args.username] - users username, presumably email
 * @param [args.password] - users password
 * @param [args.successCallback] - functions used when ajax is successful
 * @param [args.failureCallback] - functions used when ajax fails
 */
function createUser(args) {
    $.ajax({
        url: '/request',
        async: true,
        data: {
            command: 'createUser',
            username: args.username
        },
        success: args.successCallback,
        error: args.failureCallback || function () {
            alert("error in createUser")
        },
        beforeSend: function (xhr) {
            xhr.setRequestHeader('authorization', args.password);
        }
    })
}