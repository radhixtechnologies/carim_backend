const {reverseFormatFacture} = require("./utils");
const Sedad = require("./models/sedad")


module.exports = function initSocket(io) {
  io.on('connection', (socket) => {
    console.log('🔌 Connected:', socket.id);

    socket.on('join_sedad', async (id_facture) => {
      console.log(`🧾 Sedad ${id_facture} joined by ${socket.id}`);
    const idF= reverseFormatFacture(id_facture)
      await Sedad.update(
        { socketId: socket.id },
        { where: { "id_facture":idF } }
      );
    });

    socket.on('disconnect', async () => {
      console.log('❌ Disconnected:', socket.id);

      await Sedad.update(
        { socketId: '' },
        { where: { socketId: socket.id } }
      );
    });
  });
};
