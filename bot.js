const builder = require('botbuilder');
const express = require('express');
const bodyParser = require('body-parser');

const app = express();

// Create chat bot
const connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});
const bot = new builder.UniversalBot(connector);


app.use(bodyParser.json());

app.post('/api/messages', connector.listen());


bot.dialog('/', [
    function (session) {
        // if (checkCommandContains(session.message.text)) {
        //     // getData(
        //     //     (json) => session.send(buildResultMessage(json)),
        //     //     (error) => session.send(`${error}`)
        //     // );
        // }

        console.log(session);
    }
]);


app.listen(3232);
