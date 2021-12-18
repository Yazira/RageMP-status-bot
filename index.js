const Discord = require('discord.js');
const bot = new Discord.Client({ 
    intents: [Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_MEMBERS, Discord.Intents.FLAGS.GUILD_MESSAGES, Discord.Intents.FLAGS.DIRECT_MESSAGES],
    allowedMentions: {parse: ['users', 'roles'], repliedUser: true}
})
const fetch = require('node-fetch')
const fs = require('fs')
const config = require('./Config.json');
const displays = require('./Displays.json')

let servername = config.server

bot.login(config.token)

bot.on('messageCreate', async message => {
    if(message.content.startsWith(config.prefix)){
        let args = message.content.slice(config.prefix.length).split(/ +/);
        let cmd = args.shift().toLowerCase()
        if(cmd == 'status'){
            if(!message.member.permissions.has('ADMINISTRATOR')) return
            let serverData = await getServer(servername)
            let msg = await message.channel.send({embeds: [generateEmbed(serverData)]})
            displays.push({ msgID: msg.id, channelID: message.channel.id })
            saveJSON()
        }
    }
})

bot.on('ready', () => {
    setInterval(async () => {
        for(let i = displays.length - 1; i >= 0; i--){
            let channel = bot.channels.resolve(displays[i].channelID)
            if(!channel){
                displays.splice(i, 1)
                saveJSON()
                continue
            }
    
            let msg = await channel.messages.fetch(displays[i].msgID)
            if(!msg){
                displays.splice(i, 1)
                saveJSON()
                continue
            }
            let serverData = await getServer(servername)
            msg.edit({embeds: [generateEmbed(serverData)]})
        }
    }, 120000)
    console.log('[BOT] Der Status-Bot wurde erfolgreich gestartet.')
})

function getServer(serverName){
    return new Promise((resolve, reject) => {
        fetch('https://cdn.rage.mp/master/').then(buffer => buffer.json().then(data => {
            let ipAndInfo = Object.entries(data)
            let server = ipAndInfo.find(x => x[1].name.includes(serverName))
            if(server)
                return resolve(server)
            else
                return resolve('OFFLINE')
        }))
    })
}

function generateEmbed(serverData){
    if(serverData == 'OFFLINE')
        return new Discord.MessageEmbed()
        .setTitle('Serverstatus - Offline')
        .setColor('#FF0000')
        .setTimestamp()
        .setFooter('Letztes Update')

    const ip = serverData[0]
    serverData = serverData[1]
    return new Discord.MessageEmbed()
    .setTitle('Serverstatus - Online')
    .addFields(
        { name: 'Status', value: '✅ Server Online', inline: true },
        { name: 'Aktuelle Spieler', value: `${serverData.players}/${serverData.maxplayers}`, inline: true },
        { name: 'Spieler Peak', value: `${serverData.peak}`, inline: true },
        { name: 'Server IP', value: `\`\`\`${ip}\`\`\`` }

    )
    .setColor('#17FE00')
    .setTimestamp()
    .setFooter('Letztes Update')
}

function saveJSON(){
    fs.writeFileSync('./Displays.json', JSON.stringify(displays, null, 4))
}