var express = require('express');
var ejs = require("ejs");

var app = express();

app.engine('ejs', ejs.renderFile);
app.use(express.static('public'));

app.get('/', function (req, res) {
    console.log('get!!');
    /*res.render(
        'index.ejs',
        {
            title: 'Test Page',
            content: 'this is test.'
        }
    );*/
});

var server = app.listen(3000, function () {
    console.log('successful!!');
});










