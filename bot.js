const builder = require('botbuilder');
const express = require('express');
const bodyParser = require('body-parser');
const rp = require('request-promise');
const querystring = require('querystring');
const d = require('./d');
const shell = require('shelljs');
const fs = require('fs');
const Entities = require('html-entities').XmlEntities;
const entities = new Entities();

const app = express();

// Create chat bot
const connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});
const bot = new builder.UniversalBot(connector);


var messages = [];
var gsession = null;

let lastTime = 0;
const TTL = 3;


var Dictionary = ["%s, держи нас в курсе.",
"%s, а вам не кажется, что ваше место возле параши?",
"%s, Вы всегда так глупы или сегодня особый случай?",
"Мозг еще не все. А в вашем случае, %s, он ничего!",
"Вы мне нравитесь, %s. Говорят, у меня отвратительный вкус, но я вас люблю.",
"Не обижайтесь, %s, но у вас, что, работа — распространять невежество?",
"%s, продолжайте говорить, когда-нибудь вам все-таки удастся сказать что-нибудь умное!",
"%s, Вы являетесь живым доказательством того, что человек может жить без мозгов!",
"Да вы просто шаблон для построения идиота, %s.",
"Я не знаю, что делает вас глупым, %s, но это действительно работает.",
"А может поговорим об этом когда к вам, %s, вернется рассудок?",
"%s, Вы решили шевельнуть извилиной? И что? Мозги перемешались?",
"Я даже не буду делать из вас дурака, вы и сами не плохо справляетесь, %s.",
"%s, в Вашу голову если и приходят умные мысли, то только умирать.",
"%s, Вы заблуждаетесь настолько глубоко, что заблуждаетесь даже насчёт глубины своего заблуждения."]

const VKApi = require('node-vkapi');
const VK    = new VKApi();


console.log('Starting...', process.env.MICROSOFT_APP_ID, process.env.MICROSOFT_APP_PASSWORD);

app.use(bodyParser.json());

app.post('/intellik/api/messages', connector.listen());

app.get('/intellik/api/say', function(req, res) {
    console.log(req.query);
    if(req.query.text && gsession) {
        gsession.send(req.query.text);
        res.end('ok');
    } else {
        res.end();
    }
});


app.get('/intellik/api/who_is_open', function(req, res) {
    console.log(req.query);
    if(req.query.a && gsession) {
        gsession.send(`По сылке перешёл ${gsession.message.user.name}`);
        res.redirect(req.query.a);
        res.end('ok');
    } else {
        res.end();
    }
});


bot.dialog('/', function (session) {
    gsession = session;
    
    if(/system/ig.test(session.message.sourceEvent.text)) {
        const address = session.message.address;

        setTimeout(() => {
          let msg = new builder.Message().address(address);
          msg.text('Hello, this is a notification');
          bot.send(msg);
        }, 5000);
        return;
        }

    if(/criminal:(.+)/ig.test(session.message.sourceEvent.text)) {
        session.message.sourceEvent.text = session.message.sourceEvent.text.split('\n').join(' ');

        if(/^Edited previous message:/i.test(session.message.sourceEvent.text)) {
            session.message.sourceEvent.text = session.message.sourceEvent.text.split('<e_m')[0];
        }

        let criminal = '';
        let match = /criminal:(.+)/ig.exec(session.message.sourceEvent.text);
        if(match[1]) {
         criminal = match[1].trim()
         //criminal = entities.decode(code);
         }

        rp({
          method: 'GET',
          uri: `http://95.85.12.25:3222/gangsta`,
          qs: {name: criminal},
          resolveWithFullResponse: true,
          json: true
        })
        .then(r => {
            //console.log(r.body);
            session.send(`__${r.body.gangsta.name}__\n\n${r.body.gangsta.description}\n\n${r.body.gangsta.link}\n\n`);
        })
        .catch(r => {
            console.log(r);
            session.send('Not found');
        });

        return;
    }

    if(/js:(.+)/ig.test(session.message.sourceEvent.text)) {
        let code = '';

        session.message.sourceEvent.text = session.message.sourceEvent.text.split('\n').join(' ');

        if(/^Edited previous message:/i.test(session.message.sourceEvent.text)) {
            session.message.sourceEvent.text = session.message.sourceEvent.text.split('<e_m')[0];
        }

        let match = /js:(.+)/ig.exec(session.message.sourceEvent.text);

        if(match[1]) {
            code = match[1].trim()
            code = entities.decode(code);
        }

        let f_name = `s_${Math.random().toString(36).substring(7)}.js`;


        fs.writeFile(`/tmp/${f_name}`, code, function(err) {
            if(err) {
                console.log(err);
                session.send('err', err);
                return;
            }

            let child = shell.exec(`node /tmp/${f_name}`, {async:true});

            child.stdout.on('data', function(data) {
                // console.log('Exec', status);
                session.send(data);
            });
        });

        return;
    }

    if(/униан:?(\d+)?/i.test(session.message.text)) {
        // http://api.unian.net/ext_news.php?lang=ua&limit=10
        let limit = 5;

        let match = /униан:?(\d+)?/i.exec(session.message.text);

        if(match[1]) {
            limit = parseInt(match[1]);
        }

        rp('http://api.unian.net/ext_news.php?lang=ua&limit='+limit)
        .then(r => {
            let rj = JSON.parse(r);
            session.send(
                rj.response.news.map((n, i) => {
                    return '__'+(i+1)+'__.' + ' ['+ n.date + '] __' +n.title + '__\n\n' + n.link + '\n-----\n\n';
                }).join('\n\n')
            );

        })
        .catch(err => {
            console.log(err);
            session.send('Сукабляэксепшн');
        });
        return;
    }


    if(/(подскажи)|(скажи)|(предложи)/i.test(session.message.text)) {
        let item1 = d.first[Math.floor(Math.random()*d.first.length)];
        let item2 = d.sentences[Math.floor(Math.random()*d.sentences.length)];
        let item3 = d.sentences[Math.floor(Math.random()*d.sentences.length)];
        let item4 = d.last[Math.floor(Math.random()*d.last.length)];

        session.send(item1+' '+item2+ ' '+ item3 + ' '+ item4);

        return;
    }


    if(/погода/i.test(session.message.text)) {
        rp('http://apidev.accuweather.com/currentconditions/v1/324505.json?language=en&apikey=hoArfRosT1215')
        .then(r => {
            session.send('(shivering) '+JSON.parse(r)[0].Temperature.Metric.Value);
        })
        .catch(() => {
            session.send('Ой');
        });

        return;
    }

    let currentTime = (new Date()).getTime()/1000;

    let diff = (currentTime - lastTime)/60;

    if(diff >= TTL) {
        lastTime = (new Date()).getTime()/1000;

        let item = Dictionary[Math.floor(Math.random()*Dictionary.length)].replace('%s', session.message.user.name);

        session.send(item);

        return;
    }

    messages.push(session.message);
    // console.log(session);

    // if(session.message.user.name === 'Brainiac Brainiac') {
    //     session.send('Вася не отвлекайся от Data Dictionary');
    //     return;
    // }


    if(/(привет)|(hi)|(hello)/i.test(session.message.text)) {
        session.send(`Привет комрад ${session.message.user.name}`);
    } else if(/котэ/i.test(session.message.text)) {
        session.send('http://thecatapi.com/api/images/get?format=src&type=jpg&rnd='+Math.random());
    } else if(/18\+/.test(session.message.text)) {
        session.send('https://img.joinfo.ua/i/2015/02/54edd254e0e5a_1401969037_fd1s35r7gs4d6r46saeyretu.jpeg');
    } else if(/ping/.test(session.message.text)) {
        session.send('pong');
    } else if(/im:(.+)/.test(session.message.text)) {
        VK.call('photos.search', {
          q: /im:(.+)/i.exec(session.message.text)[1],
          sort: 1,
          count: 1,
        }).then(res => {
            console.log(/im:(.+)/i.exec(session.message.text)[1], res);
          if(res.items.length) {
            session.send(res.items[0]['photo_604']+' '+ res.items[0].text)
          } else {
            session.send('Сорян Бро по '+/im:(.+)/i.exec(session.message.text)[1] + ' пусто');
          }
        });
    } else if(/w:(.+)/.test(session.message.text)) {

        // rp('https://en.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&exintro=&explaintext=&titles='+)
        // .then(r => {
        //     var sovet = 'Ой';
        //     try {
        //         r = JSON.parse(r);
        //         sovet = `${session.message.user.name} \`${r.text}\``;
        //     } catch(e) {};

        //     var data = {text: sovet, bot: "советчик"};

        //     session.send(sovet.replace(/&nbsp/g, " "));

        // })
        // .catch(() => {
        //     session.send('Сукабляэксепшн');
        // });

    } else if(/астанавитесь\!/i.test(session.message.text)) {
        session.send('http://stuki-druki.com/aforizms/yanukovich03.jpg');
    } else {
        rp('http://api.forismatic.com/api/1.0/?method=getQuote&key=457653&format=json&lang=ru')
        .then(r => {
            var sovet = 'Совета нет(';
            try {
                r = JSON.parse(r);
                sovet = `__${session.message.user.name}__ \`${r.quoteText}\` *${r.quoteAuthor}*`;
            } catch(e) {
                console.log(e);
            };

            var data = {text: sovet, bot: "советчик"};

            session.send(sovet.replace(/&nbsp;/g, " "));

        })
        .catch(() => {
            session.send('Сукабляэксепшн');
        });
    }
});


app.listen(8080);