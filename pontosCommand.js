const fs = require('fs');
const { EmbedBuilder } = require('discord.js');
const userPointsFile = './userPoints.json';

module.exports = {
  data: {
    name: 'pontos',
    description: 'Mostra o top 10 de pontos no servidor com tema natalino.',
  },

  async execute(interaction) {
    try {
      const data = JSON.parse(fs.readFileSync(userPointsFile, 'utf8'));
      const topUsers = Object.entries(data)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10);

      const topList = topUsers
        .map(([userId, points], index) => `**${index + 1}. <@${userId}>** - ${points} pontos 🎄`)
        .join('\n');

      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle('🎅 Top 10 Pontos do Servidor 🎄')
        .setDescription(topList || 'Nenhum dado de pontos disponível.')
        .setFooter({ text: '🎁 Continue participando e ganhe mais pontos!' })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Erro ao processar o comando pontos:', error);
      await interaction.reply({ content: 'Houve um erro ao buscar os pontos.', ephemeral: true });
    }
  },
};
