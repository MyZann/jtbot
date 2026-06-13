const TelegramBot = require('node-telegram-bot-api')

const token = '8999455251:AAFkmFjMu3dd02IAESeg0JzyreCAFZ2eT5o'
const ownerId = 7340265605

const bot = new TelegramBot(token)

let authorizedUsers = [ownerId]

function generateKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 16; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length)
    result += chars[randomIndex]
  }
  return result
}

module.exports = async (request, response) => {
  try {
    const body = request.body

    if (body && body.message) {
      const msg = body.message
      const chatId = msg.chat.id
      const text = msg.text

      if (text === '/start') {
        if (authorizedUsers.includes(chatId)) {
          const options = {
            reply_markup: {
              inline_keyboard: [[{ text: 'Buat Key', callback_data: 'buat_key' }]]
            }
          }
          await bot.sendMessage(chatId, 'Selamat datang di Layanan Generator Key Silakan gunakan tombol di bawah ini', options)
        } else {
          const options = {
            reply_markup: {
              inline_keyboard: [[{ text: 'Minta Akses', callback_data: 'minta_akses' }]]
            }
          }
          await bot.sendMessage(chatId, 'Kamu belum memiliki akses ke layanan ini Silakan ajukan permintaan ke administrator', options)
        }
      }
    }

    if (body && body.callback_query) {
      const query = body.callback_query
      const chatId = query.message.chat.id
      const messageId = query.message.message_id
      const data = query.data
      const username = query.from.username || query.from.first_name || 'Tanpa Nama'

      if (data === 'minta_akses') {
        if (authorizedUsers.includes(chatId)) {
          await bot.sendMessage(chatId, 'Kamu sudah memiliki akses')
        } else {
          await bot.sendMessage(chatId, 'Permintaan kamu berhasil dikirim ke administrator Mohon tunggu persetujuan')
          const adminOptions = {
            reply_markup: {
              inline_keyboard: [
                [{ text: 'Terima', callback_data: 'terima_' + chatId }],
                [{ text: 'Tolak', callback_data: 'tolak_' + chatId }]
              ]
            }
          }
          await bot.sendMessage(ownerId, 'Permintaan akses baru dari ' + username + ' ID ' + chatId + ' Pilih tindakan', adminOptions)
        }
      }

      if (data.startsWith('terima_')) {
        if (chatId === ownerId) {
          const targetId = parseInt(data.split('_')[1])
          if (!authorizedUsers.includes(targetId)) {
            authorizedUsers.push(targetId)
          }
          await bot.editMessageText('Akses disetujui untuk ID ' + targetId, { chat_id: chatId, message_id: messageId })
          const userOptions = {
            reply_markup: {
              inline_keyboard: [[{ text: 'Buat Key', callback_data: 'buat_key' }]]
            }
          }
          await bot.sendMessage(targetId, 'Administrator menyetujui permintaan kamu Silakan buat key', userOptions)
        }
      }

      if (data.startsWith('tolak_')) {
        if (chatId === ownerId) {
          const targetId = parseInt(data.split('_')[1])
          await bot.editMessageText('Akses ditolak untuk ID ' + targetId, { chat_id: chatId, message_id: messageId })
          await bot.sendMessage(targetId, 'Maaf administrator menolak permintaan akses kamu')
        }
      }

      if (data === 'buat_key') {
        if (authorizedUsers.includes(chatId)) {
          const rawKey = generateKey()
          const formatKey = rawKey.slice(0, 4) + '-' + rawKey.slice(4, 8) + '-' + rawKey.slice(8, 12) + '-' + rawKey.slice(12, 16)
          const options = {
            reply_markup: {
              inline_keyboard: [[{ text: 'Buat Key Baru', callback_data: 'buat_key' }]]
            }
          }
          await bot.sendMessage(chatId, 'Key berhasil dibuat\n\n' + formatKey, options)
        } else {
          await bot.sendMessage(chatId, 'Kamu tidak memiliki akses Silakan ketik /start untuk meminta akses kembali')
        }
      }

      await bot.answerCallbackQuery(query.id)
    }

    response.status(200).send('OK')
  } catch (error) {
    console.error(error)
    response.status(500).send('Terjadi kesalahan')
  }
}

