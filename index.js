const { Client, GatewayIntentBits, EmbedBuilder, PermissionsBitField } = require('discord.js');
const { TOKEN } = require('./config');
const { joinVoiceChannel } = require('@discordjs/voice'); 
const ms = require('ms');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates
    ]
});

const prefix = '.';

client.on('messageCreate', async (message) => {
    if (!message.content.startsWith(prefix) || message.author.bot) return;
    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // Ban 
    if (command === 'ban') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
            return message.reply({ embeds: [new EmbedBuilder().setColor('Red').setTitle('İzin reddedildi').setDescription('❌ Bu komutu kullanmak için yeterli yetkiniz yok!')] });
        }
        const user = message.mentions.members.first();
        if (!user) return message.reply({ embeds: [new EmbedBuilder().setColor('Yellow').setTitle('Kullanıcı bulunamadı').setDescription('❌ Banlamak için birini etiketleyin!')] });
        await user.ban();
        message.channel.send({ embeds: [new EmbedBuilder().setColor('Red').setTitle('Kullanıcı banlandı').setDescription(`✅ ${user.user.tag} başarıyla banlandı!`)] });
    }
    
    // KICK
    if (command === 'kick') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
            return message.reply({ embeds: [new EmbedBuilder().setColor('Red').setTitle('İzin reddedildi').setDescription('❌ Bu komutu kullanmak için yeterli yetkiniz yok!')] });
        }
        const user = message.mentions.members.first();
        if (!user) return message.reply({ embeds: [new EmbedBuilder().setColor('Yellow').setTitle('Kullanıcı bulunamadı').setDescription('❌ Lütfen bir kullanıcı etiketleyin!')] });
        await user.kick();
        message.channel.send({ embeds: [new EmbedBuilder().setColor('Orange').setTitle('Kullanıcı atıldı').setDescription(`✅ ${user.user.tag} başarıyla atıldı!`)] });
    }

    
    // MUTE
    if (command === 'mute') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
            return message.reply({ embeds: [new EmbedBuilder().setColor('Red').setTitle('İzin reddedildi').setDescription('❌ Bu komutu kullanmak için yeterli yetkiniz yok!')] });
        }
        const user = message.mentions.members.first();
        if (!user) return message.reply({ embeds: [new EmbedBuilder().setColor('Yellow').setTitle('Kullanıcı bulunamadı').setDescription('❌ Susutturmak için birini etiketleyin!')] });
    
        const timeArg = args[1]; 
        if (!timeArg) return message.reply({ embeds: [new EmbedBuilder().setColor('Yellow').setTitle('Süre belirtilmedi').setDescription('❌ Lütfen geçerli bir süre belirtin!')] });
    
        const duration = ms(timeArg);
        if (!duration) return message.reply({ embeds: [new EmbedBuilder().setColor('Yellow').setTitle('Geçersiz süre').setDescription('❌ Geçerli bir süre girin (örn: 1m, 2h, 1d)!')] });
    
        try {
            const currentTimeout = user.communicationDisabledUntilTimestamp || 0; 
            const newTimeout = currentTimeout + duration;
    
            await user.timeout(newTimeout);
    
            message.channel.send({ embeds: [new EmbedBuilder().setColor('Blue').setTitle('Kullanıcı Susturuldu').setDescription(`✅ ${user.user.tag} ${ms(duration, { long: true })} boyunca susturuldu!`)] });
        } catch (error) {
            console.error('Susturma hatası:', error);
            message.channel.send({ embeds: [new EmbedBuilder().setColor('Red').setTitle('Hata').setDescription('❌ Kullanıcıyı sustururken bir hata oluştu!')] });
        }
    }
    
    // UNMUTE
    if (command === 'unmute') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
            return message.reply({ embeds: [new EmbedBuilder().setColor('Red').setTitle('İzin reddedildi').setDescription('❌ Bu komutu kullanmak için yeterli yetkiniz yok!')] });
        }
        const user = message.mentions.members.first();
        if (!user) return message.reply({ embeds: [new EmbedBuilder().setColor('Yellow').setTitle('Kullanıcı bulunamadı').setDescription('❌ Susturulmuş birini etiketleyin!')] });
    
        if (user.communicationDisabledUntilTimestamp === 0 || !user.communicationDisabledUntilTimestamp) {
            return message.reply({ embeds: [new EmbedBuilder().setColor('Yellow').setTitle('Kullanıcı Zaten Susturulmamış').setDescription('❌ Bu kullanıcı zaten susturulmamış!')] });
        }
    
        try {
            await user.timeout(null); 
            message.channel.send({ embeds: [new EmbedBuilder().setColor('Blue').setTitle('Kullanıcı Susturması Kaldırıldı').setDescription(`✅ ${user.user.tag} susturması kaldırıldı!`)] });
        } catch (error) {
            console.error('Unmute hatası:', error);
            message.channel.send({ embeds: [new EmbedBuilder().setColor('Red').setTitle('Hata').setDescription('❌ Kullanıcıyı sustururken bir hata oluştu!')] });
        }
    }
    
    // sunucu infosu
    if (command === 'info') {
        const { guild } = message;
    
        const owner = await guild.fetchOwner();
        const totalMembers = guild.memberCount;
        const botCount = guild.members.cache.filter(member => member.user.bot).size;
        const roleCount = guild.roles.cache.size;
        const boostCount = guild.premiumSubscriptionCount || 0;
        const serverIcon = guild.iconURL({ dynamic: true, size: 1024 });
    
        const textChannels = guild.channels.cache.filter(channel => channel.type === 0).size;
        const voiceChannels = guild.channels.cache.filter(channel => channel.type === 2).size;
        const categories = guild.channels.cache.filter(channel => channel.type === 4).size;
        
        const infoEmbed = new EmbedBuilder()
            .setColor('Blue')
            .setTitle(`**${guild.name} | Sunucu Bilgileri**`)
            .setThumbnail(serverIcon)
            .addFields(
                { name: ' **Sunucu Sahibi**', value: `${owner.user.tag}`, inline: false },
                { name: ' **Sunucu ID**', value: `\`${guild.id}\``, inline: false },
                { name: ' **Oluşturulma Tarihi**', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:D>`, inline: false },
                { name: ` **Kanal Sayısı [${textChannels + voiceChannels + categories}]**`, value: `📝 \`${textChannels}\` Yazı | 🔊 \`${voiceChannels}\` Ses | 📂 \`${categories}\` Kategori`, inline: false },
                { name: ' **Üye Sayısı**', value: `\`${totalMembers}\``, inline: true },
                { name: ' **Rol Sayısı**', value: `\`${roleCount}\``, inline: true },
                { name: ' **Boost Sayısı**', value: `\`${boostCount}\``, inline: true }
            )
            .setFooter({ text: `Komutu kullanan: ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
            .setTimestamp();
    
        message.channel.send({ embeds: [infoEmbed] });
    }
    
    // AVATAR
    if (command === 'avatar') {
        const user = message.mentions.users.first() || message.author;
    
        try {
            const member = await message.guild.members.fetch(user.id);
            const avatarURL = user.displayAvatarURL({ dynamic: true, size: 1024 });
            const bannerURL = user.banner ? user.bannerURL({ dynamic: true, size: 1024 }) : null;
    
            const avatarEmbed = new EmbedBuilder()
                .setColor('Blue')
                .setTitle(`${user.tag} Kullanıcısının Avatarı`)
                .setImage(avatarURL)
                .setFooter({ text: `komutu kullanan: ${message.author.tag}`, iconURL: message.author.displayAvatarURL() });
    
            if (bannerURL) {
                avatarEmbed.addFields({ name: ' **Banner**', value: `[Resmi Aç](${bannerURL})` });
                avatarEmbed.setThumbnail(bannerURL);
            }
    
            message.channel.send({ embeds: [avatarEmbed] });
    
        } catch (error) {
            console.error('Avatar komutunda hata:', error);
            message.channel.send({ embeds: [new EmbedBuilder().setColor('Red').setTitle('Hata').setDescription('❌ Kullanıcı avatarı getirilirken hata oluştu!')] });
        }
    }
    
    // SES
    if (command === 'ses') {
        const voiceChannels = message.guild.channels.cache.filter(channel => channel.type === 2); 
        let totalUsersInVoice = 0;
    
        voiceChannels.forEach(channel => {
            totalUsersInVoice += channel.members.size; 
        });
    
        const voiceEmbed = new EmbedBuilder()
            .setColor('Blue')
            .setTitle(' Ses Kanalı Bilgisi')
            .setDescription(` **Seslerdeki üye sayısı:** \`${totalUsersInVoice}\``)
            .setFooter({ text: `Komutu kullanan: ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
            .setTimestamp();
    
        message.channel.send({ embeds: [voiceEmbed] });
    }
    

    // YARDIM 
    if (command === 'yardim') {
        const helpEmbed = new EmbedBuilder()
            .setColor('Blue')
            .setTitle('Yardım Menüsü')
            .setDescription('Mevcut komutlar aşağıda listelenmiştir:')
            .addFields(
                { name: '.ban @kullanıcı', value: 'Belirtilen kullanıcıyı yasaklar.', inline: false },
                { name: '.kick @kullanıcı', value: 'Belirtilen kullanıcıyı atar.', inline: false },
                { name: '.mute @kullanıcı', value: 'Belirtilen kullanıcıyı susturur.', inline: false },
                { name: '.cek @kullanıcı', value: 'Etiketlenen kullanıcıyı bulunduğun ses kanalına çeker.', inline: false },
                { name: '.avatar @kullanıcı', value: 'Etiketlenen kişinin avatarını gösterir. kendi avatarınızada bakabilirsiniz', inline: false },
                { name: '.nuke', value: 'Komutu kullandığınız kanala nuke atar.', inline: false },
                { name: '.yardim', value: 'Tüm komutları listeler.', inline: false },
                { name: '.afk', value: 'Bot bulunduğunuz ses kanalına girip afk atar.', inline: false },
                { name: '.ses', value: 'Seslerdeki aktif üye sayısını gösterir.', inline: false },
                { name: '.info', value: 'Sunucu bilgilerini gösterir.', inline: false }
            )
            .setFooter({ text: `Komutu kullanan: ${message.author.tag}`, iconURL: message.author.displayAvatarURL() });

        message.channel.send({ embeds: [helpEmbed] });
    }

    // NUKE
    if (command === 'nuke') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
            return message.reply({
                embeds: [new EmbedBuilder()
                    .setColor('Red')
                    .setTitle('İzin Reddedildi')
                    .setDescription('❌ Bu komutu kullanmak için yeterli yetkiniz yok!')
                    .setFooter({ text: `Komutu kullanan: ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
                    .setTimestamp()]
            });
        }

        const channel = message.channel;
        const channelPosition = channel.position;

        try {
            const newChannel = await channel.clone();
            await channel.delete();

            await newChannel.setPosition(channelPosition);

            await newChannel.send({
                embeds: [new EmbedBuilder()
                    .setColor('Blue')
                    .setTitle('Kanal Nukelendi')
                    .setDescription(`✅ Bu kanal ${message.author.tag} tarafından nukelendi.`)
                    .setFooter({ text: `Komutu kullanan: ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
                    .setTimestamp()]
            });

            await newChannel.permissionOverwrites.edit(newChannel.guild.roles.everyone, {
                CreatePublicThreads: false,
                CreatePrivateThreads: false
            });

        } catch (error) {
            console.error('Kanal nukelenirken hata:', error);
            message.author.send('Kanalı nukelerken bir hata oluştu.');
        }
    }

    // AFK 
    if (command === 'afk') {
        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel) {
            return message.reply({ embeds: [new EmbedBuilder().setColor('Red').setTitle('Ses Kanalı Bulunamadı').setDescription('❌ Önce bir ses kanalına katılmalısınız!')] });
        }
        try {
            joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: voiceChannel.guild.id,
                adapterCreator: voiceChannel.guild.voiceAdapterCreator,
                selfMute: true,
                selfDeaf: true 
            });
            message.channel.send({ embeds: [new EmbedBuilder().setColor('Blue').setTitle('AFK Modu Açıldı').setDescription(`✅ **${message.author.tag}** için AFK modu etkinleştirildi!`)] });
        } catch (error) {
            console.error('AFK moduna girerken hata:', error);
            message.channel.send({ embeds: [new EmbedBuilder().setColor('Red').setTitle('Hata').setDescription('❌ AFK moduna geçerken bir hata oluştu!')] });
        }
    }
});

//  Token Kontrol
if (!TOKEN) {
    console.error('❌ Bot tokeni eksik! Lütfen config.js dosyanızı kontrol edin.');
    process.exit(1);
}

client.login(TOKEN).catch(err => {
    console.error('❌ Giriş başarısız:', err);
    process.exit(1);
});
