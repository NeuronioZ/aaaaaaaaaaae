const fs = require('fs');
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const charadaCommand = require('./charadaCommand'); // Importando o comando charada
const pontosCommand = require('./pontosCommand'); // Importando o comando pontos

const TOKEN = 'token'; // Substitua pelo token do bot
const CLIENT_ID = 'id'; // Substitua pelo CLIENT_ID

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Variáveis globais
let secretWord = null;
let wordAnswered = false;
let userPoints = {};
const userPointsFile = './userPoints.json';

const loadUserPoints = () => {
  if (fs.existsSync(userPointsFile)) {
    userPoints = JSON.parse(fs.readFileSync(userPointsFile, 'utf-8'));
  } else {
    fs.writeFileSync(userPointsFile, JSON.stringify(userPoints, null, 2));
  }
};

const normalizeText = (text) => text
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase();

const rest = new REST({ version: '9' }).setToken(TOKEN);

// Comandos do bot
const commands = [
  pontosCommand.data, // Comando pontos
  charadaCommand.data, // Comando charada
];

// Registro de comandos no Discord
(async () => {
  try {
    console.log('Iniciando registro de comandos...');
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log('Comandos registrados com sucesso!');
  } catch (error) {
    console.error('Erro ao registrar comandos:', error);
  }
})();

// Quando o bot estiver pronto
client.once('ready', () => {
  console.log(`Bot logado como ${client.user.tag}`);
  loadUserPoints(); // Carrega os pontos dos usuários no início
});

// Listener de interação de comandos
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  // Executa o comando /pontos
  if (interaction.commandName === 'pontos') {
    await pontosCommand.execute(interaction);
  }

  // Comando /charada
  else if (interaction.commandName === 'charada') {
    const { options, user } = interaction;
    const requiredRoleId = '1242981733792743474';
    const member = await interaction.guild.members.fetch(user.id);

    if (member.roles.cache.has(requiredRoleId)) {
      secretWord = options.getString('word');
      const messageToSend = options.getString('mensagem');
      wordAnswered = false;

      await interaction.reply({ content: 'A charada foi definida!', ephemeral: true });
      await interaction.channel.send(messageToSend);
    } else {
      return interaction.reply({ content: 'Você não tem permissão para usar esse comando.', ephemeral: true });
    }
  }
});

// Listener para respostas de mensagens
client.on('messageCreate', async (message) => {
  if (message.author.bot || wordAnswered || !secretWord) return;

  const normalizedMessage = normalizeText(message.content);
  const normalizedSecretWord = normalizeText(secretWord);

  if (normalizedMessage === normalizedSecretWord) {
    const userId = message.author.id;
    const currentPoints = userPoints[userId] || 0;
    userPoints[userId] = currentPoints + 1;

    await message.channel.send(`🎉 Parabéns, ${message.author.username}! Você acertou a charada e agora tem ${currentPoints + 1} ponto(s). Veja o Top do Servidor com /pontos!`);
    await message.react('🎉');
    fs.writeFileSync(userPointsFile, JSON.stringify(userPoints, null, 2));

    wordAnswered = true;
    secretWord = null;
  }
});

// Iniciando o bot
client.login(TOKEN);
