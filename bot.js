const builder = require('botbuilder');
const express = require('express');
const bodyParser = require('body-parser');
const rp = require('request-promise');

const app = express();

// Create chat bot
const connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});
const bot = new builder.UniversalBot(connector);


var messages = [];


app.use(bodyParser.json());

app.post('/api/messages', connector.listen());


bot.dialog('/', function (session) {

    messages.push(session.message);
    // console.log(session.message.user.name);
    if(/(привет)|(hi)|(hello)/i.test(session.message.text)) {
        session.send(`Привет комрад ${session.message.user.name}`);
    } else if(/совет|грей|грэй|gray|как\sжить|подскажите|\?/i.test(session.message.text)) {
        rp('http://fucking-great-advice.ru/api/random')
        .then(r => {
            var sovet = 'Совета нет(';
            try {
                r = JSON.parse(r);
                sovet = `${session.message.user.name}] \`${r.text}\``;
            } catch(e) {};

            var data = {text: sovet, bot: "советчик"};

            session.send(sovet);

        })
        .catch(() => {
            session.send('Сукабляэксепшн');
        });
    } else {
        var item = messages[Math.floor(Math.random()*messages.length)];
        session.send(`Как сказал великий человек ${item.user.name}: "${item.text}"`)
    }
});


app.listen(8080);
