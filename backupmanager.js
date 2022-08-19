const { config } = require("process");
const Discord = require("discord.js");
backup = require("discord-backup");
const settings = require("./settings.json");
const premium = require("./premium.json");
client = new Discord.Client();

client.on('ready', () => {
    client.user.setActivity('b!help', { type: 'WATCHING' })
});

client.on("ready", () => {
    console.log("BackupManager is ready.");
});

client.on("message", async message => {
    let command = message.content.toLowerCase().slice(settings.prefix.length).split(" ")[0];

    let args = message.content.split(" ").slice(1);
    if (!message.content.startsWith(settings.prefix) || message.author.bot || !message.guild) return;

    if(command === "create"){
        const guild = message.guild
        if(message.author.id != guild.ownerID){
            return message.channel.send(":x: | You must be the owner of this server to request a backup!");
        }
        backup.create(message.guild, {
            jsonBeautify: true
        }).then((backupData) => {
            message.author.send("The backup has been created! To load it, type this command on the server of your choice: `"+settings.prefix+"load "+backupData.id+"`!");
            message.channel.send(":white_check_mark: Backup successfully created. The backup ID was sent in dm!");
        });
    }

    if(command === "create1"){ //Allows the user ID mentioned below to create a server backup.
        if (message.author.id != 816470172097183785) { //Edit a customer user ID here
            return message.channel.send(":x: | You must be the owner of this bot to use this command!")
        }
        message.channel.send('Creating the backup, please wait...')
        backup.create(message.guild, {
            maxMessagesPerChannel: 9999,
            jsonBeautify: true,
            saveImages: "base64"
        }).then((backupData) => {
            console.log(`Backup created of ${message.guild.name} (${message.guild.id}) with ID: ${backupData.id}`);
            message.author.send("The backup has been created! To load it, type this command on the server of your choice: `"+settings.prefix+"load "+backupData.id+"`!");
            message.channel.send(":white_check_mark: Backup successfully created. The backup ID was sent in dm!");
        });
    }

    if(command === "autobackup"){
        const guild = message.guild
        if(message.author.id != guild.ownerID){
            message.channel.send(':x: | You are not the owner of this Discord server.');
            return;
        }
        if(premium.owner.includes(message.author.id)){
            let serverID = args[0];
            const guild = message.guild
            if(serverID != guild.id){
                message.channel.send(":x: | You must provide the ID of this server!");
                return;
            }
            if(!serverID){
                message.channel.send(":x: | You must provide a server ID!");
                return;
            }
            setInterval(() => {
                backup.create(guild, {
                    jsonBeautify: true
                }).then((backupData) => {
                    message.author.send("An automatic backup has been made. To load it, type this command on the server of your choice: `"+settings.prefix+"load "+backupData.id+"`!");
                })
            }, 1800000); //BACKUP INTERVAL
            message.channel.send(':white_check_mark: | Auto-Backup is now enabled! A backup will be made every 30 minutes.');
        } else {
            message.channel.send(':x: | You are not a premium user. DM papenecklace#0001 to upgrade.');
            return;
        }
    }
    
    if(command === "load"){
        const guild = client.guilds.cache.get(message.guild.id);
        if(message.author.id != message.guild.owner.id){
            return message.channel.send(":x: | You must be the owner of this server to load a backup!");
        }
        let backupID = args[0];
        if(!backupID){
            return message.channel.send(":x: | You must specify a valid backup ID!");
        }
        backup.fetch(backupID).then(async () => {
            message.channel.send(":warning: | When the backup is loaded, all the channels, roles, etc. will be replaced! Type `-confirm` to confirm!");
                await message.channel.awaitMessages(m => (m.author.id === message.author.id) && (m.content === "-confirm"), {
                    max: 1,
                    time: 20000,
                    errors: ["time"]
                }).catch((err) => {
                    message.channel.send(":x: | Time's up! Cancelled backup loading!");
                    return;
                });
                message.author.send(":white_check_mark: | Start loading the backup!");
                backup.load(backupID, message.guild, {
                    maxMessagesPerChannel: 9999,
                }).then(() => {
                    backup.remove(backupID);
                }).catch((err) => {
                    return message.author.send(":x: | Sorry, an error occurred... Please check that I have administrator permissions!");
                });
        }).catch((err) => {
            console.log(err);
            return message.channel.send(":x: | No backup found for `"+backupID+"`!");
        });
    }

    if(command === "info"){
        let backupID = args[0];
        if(!backupID){
            return message.channel.send(":x: | You must specify a valid backup ID!");
        }
        backup.fetch(backupID).then((backupInfos) => {
            const date = new Date(backupInfos.data.createdTimestamp);
            const yyyy = date.getFullYear().toString(), mm = (date.getMonth()+1).toString(), dd = date.getDate().toString();
            const formatedDate = `${yyyy}/${(mm[1]?mm:"0"+mm[0])}/${(dd[1]?dd:"0"+dd[0])}`;
            let embed = new Discord.MessageEmbed()
                .setAuthor("Backup Information")
                .addField("Backup ID", backupInfos.id, false)
                .addField("Server ID", backupInfos.data.guildID, false)
                .addField("Size", `${backupInfos.size} kb`, false)
                .addField("Created at", formatedDate, false)
                .setColor("#FF0000");
            message.channel.send(embed);
        }).catch((err) => {
            return message.channel.send(":x: | No backup found for `"+backupID+"`!");
        });
    }
    if(command === "help"){
        let embed = new Discord.MessageEmbed()
        .setColor('#0099DFF')
        .setTitle('Help')
        .setDescription('This displays all available commands')
        .setThumbnail('https://cdn.discordapp.com/avatars/799983205528764446/ddd8b4e4590d4863da30094fc54fb029.png')
        .addFields(
            { name: 'Auto-Backups', value: 'To have this bot create automatic backups every hour, please DM papernecklace#0001.' },
            { name: '\u200B', value: '\u200B' },
            { name: 'Create', value: 'Create a backup of the current server. **Server owner only**', inline: true },
            { name: 'Load', value: 'Load a backup to the current server. This overrides everything. **Server owner only**', inline: true },
            { name: 'Info', value: 'Show information about a backup. Include the backup ID when running the command.', inline: true },
            { name: '\u200B', value: '\u200B' },
        )
        .setTimestamp()
        .setFooter('BackupManager, your data at hand', 'https://cdn.discordapp.com/avatars/799983205528764446/ddd8b4e4590d4863da30094fc54fb029.png');
        message.channel.send(embed);
    }

});
client.login(settings.token);
