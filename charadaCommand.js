const fs = require('fs');
const { EmbedBuilder } = require('discord.js');
const userPointsFile = './userPoints.json';

let secretWord = null;
let wordAnswered = false;
let userPoints = {};

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

module.exports = {
  data: {
    name: 'charada',
    description: 'Define uma charada e envia uma mensagem com a palavra secreta.',
    options: [
      {
        name: 'word',
        description: 'A palavra secreta da charada',
        type: 3, // Tipo string
        required: true,
      },
      {
        name: 'mensagem',
        description: 'Mensagem que será enviada junto à charada',
        type: 3, // Tipo string
        required: true,
      },
    ],
  },

  async execute(interaction) {
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
  },

  // Função para verificar se a resposta está correta
  checkAnswer: async (message) => {
    if (message.author.bot || wordAnswered) return;

    const normalizedMessage = normalizeText(message.content);
    const normalizedSecretWord = normalizeText(secretWord);

    if (secretWord && normalizedMessage === normalizedSecretWord) {
      const userId = message.author.id;
      const currentPoints = userPoints[userId] || 0;
      userPoints[userId] = currentPoints + 1;

      await message.channel.send(`🎉 Parabéns, ${message.author.username}! Você acertou a charada e agora tem ${currentPoints + 1} ponto(s). Veja o Top do Servidor com /pontos!`);
      await message.react('🎉');
      fs.writeFileSync(userPointsFile, JSON.stringify(userPoints, null, 2));

      wordAnswered = true;
      secretWord = null;
    }
  },
};
