function getArticle() {
    return new Promise((resolve, reject) => {//see line 16 and 19
        $.ajax({
            url: '/article.html',
            async: true,
            complete: (xhr, status) => resolve(xhr),
            error: (xhr, status, error) => reject(error),
            beforeSend: function (xhr) {
                // xhr.setRequestHeader('authorization', authuser+ " | "+password);
            }
        })
    })
}

function getArticleHandler(){
    getArticle().then(function(result){//resolve
        console.log(result);//resolve/result of get article
        var example_result = {
            "data":{
                "content":"update main text after get article",
                "creadted_by":"Keith Atkinson"
            }
        }
        $('#main').html(example_result.data.content)
    }, function(result) {//reject
        console.error("call failed")
    })
}
window.onload = function() {
    getArticleHandler();
}
//line 98 in the html
