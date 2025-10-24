const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

// ============================================
// KONFIGURASI - GANTI SESUAI DATA ANDA
// ============================================

// TOKEN dari BotFather - GANTI INI!
const TELEGRAM_TOKEN = '8366924969:AAEMWmbOTnAg61U2x9YshQyE5vH8FjYpib0';

// URL dari Apps Script yang sudah di-deploy - GANTI INI!
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw7ZrqDd6kjoo-5e3odLoAFLtqlwEs0Ys0RW3rtrbOe8jxs_QTx1q3jmbIB_U8ZDi-_JQ/exec';

// ============================================
// INISIALISASI BOT
// ============================================
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

console.log('⏳ Memulai Bot Telegram Pencarian SA...');

// ============================================
// FUNGSI PENCARIAN DATA
// ============================================
async function searchData(searchTerm) {
  try {
    const response = await axios.get(APPS_SCRIPT_URL, {
      params: { search: searchTerm },
      timeout: 10000 // Timeout 10 detik
    });
    
    return response.data;
  } catch (error) {
    console.error('Error mengambil data:', error.message);
    throw error;
  }
}

// ============================================
// HANDLER BOT TELEGRAM
// ============================================

// Perintah /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const firstName = msg.from.first_name || 'User';
  
  const welcomeMessage = `
🤖 *Selamat Datang, ${firstName}!*

Saya adalah *Bot Pencarian Service Area (SA)*

Saya dapat membantu Anda mencari data berdasarkan:
📌 *TRACK ID* (Kolom A)
📌 *SC ID* (Kolom E)

*━━━━━━━━━━━━━━━━━━━━*

*📖 Cara Penggunaan:*

Ketik: \`/cari\` diikuti TRACK ID atau SC ID

*Contoh:*
\`/cari TRK12345\`
\`/cari SC001\`
\`/cari 123456\`

*━━━━━━━━━━━━━━━━━━━━*

*ℹ️ Informasi yang ditampilkan:*
✅ Customer Name
✅ Status
✅ Detail
✅ Engineer Memo

Ketik /help untuk bantuan lebih lanjut.
  `;
  
  bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
});

// Perintah /help
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  
  const helpMessage = `
📖 *PANDUAN LENGKAP BOT PENCARIAN SA*

*━━━━━━━━━━━━━━━━━━━━*

*🤖 Perintah yang Tersedia:*

/start - Memulai bot dan melihat intro
/help - Menampilkan panduan ini
/cari [ID] - Mencari data SA

*━━━━━━━━━━━━━━━━━━━━*

*🔍 Cara Mencari Data:*

Format: \`/cari [TRACK_ID atau SC_ID]\`

*Contoh pencarian yang benar:*
✅ \`/cari TRK12345\`
✅ \`/cari SC001\`
✅ \`/cari 123456\`

*Contoh pencarian yang salah:*
❌ \`/cari\` (tanpa ID)
❌ \`cari TRK001\` (tanpa /)

*━━━━━━━━━━━━━━━━━━━━*

*📊 Data yang Ditampilkan:*

• TRACK ID (Kolom A)
• SC ID (Kolom E)
• Customer Name (Kolom C)
• Status (Kolom H)
• Detail (Kolom I)
• Engineer Memo (Kolom J)

*━━━━━━━━━━━━━━━━━━━━*

*💡 Tips:*
• Pencarian tidak case-sensitive
• Pastikan ID yang dimasukkan benar
• Bot akan memberitahu jika data tidak ditemukan

Jika ada masalah, hubungi admin!
  `;
  
  bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
});

// Perintah /cari
bot.onText(/\/cari (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const searchTerm = match[1].trim();
  const userName = msg.from.first_name || 'User';

  console.log(`[${new Date().toLocaleString()}] ${userName} mencari: ${searchTerm}`);

  // Kirim pesan loading
  const loadingMsg = await bot.sendMessage(chatId, '🔍 Mencari data, mohon tunggu...');

  try {
    const result = await searchData(searchTerm);

    if (!result.success) {
      bot.editMessageText(
        `❌ *Data Tidak Ditemukan*\n\n` +
        `Tidak ada data untuk ID: \`${searchTerm}\`\n\n` +
        `*Kemungkinan penyebab:*\n` +
        `• TRACK ID atau SC ID salah\n` +
        `• Data belum ada di spreadsheet\n` +
        `• Terdapat typo dalam pengetikan\n\n` +
        `Silakan periksa kembali dan coba lagi.`,
        {
          chat_id: chatId,
          message_id: loadingMsg.message_id,
          parse_mode: 'Markdown',
        }
      );
      return;
    }

    const data = result.data;

    // Format pesan hasil pencarian dengan tampilan lebih baik
    const resultMessage = `
✅ *DATA DITEMUKAN*

*━━━━━━━━━━━━━━━━━━━━*

*🔖 TRACK ID:*
\`${data.trackId}\`

*🆔 SC ID:*
\`${data.scId}\`

*━━━━━━━━━━━━━━━━━━━━*

*👤 Customer Name:*
${data.customerName}

*━━━━━━━━━━━━━━━━━━━━*

*📊 Status:*
${data.status}

*━━━━━━━━━━━━━━━━━━━━*

*📝 Detail:*
${data.detail}

*━━━━━━━━━━━━━━━━━━━━*

*🔧 Engineer Memo:*
${data.engineerMemo}

*━━━━━━━━━━━━━━━━━━━━*

_Pencarian pada: ${new Date().toLocaleString('id-ID')}_
    `;

    bot.editMessageText(resultMessage, {
      chat_id: chatId,
      message_id: loadingMsg.message_id,
      parse_mode: 'Markdown',
    });

    console.log(`[${new Date().toLocaleString()}] Data ditemukan untuk: ${searchTerm}`);

  } catch (error) {
    console.error('Error:', error);
    bot.editMessageText(
      '❌ *Terjadi Kesalahan*\n\n' +
      'Maaf, terjadi kesalahan saat mengambil data.\n\n' +
      '*Kemungkinan penyebab:*\n' +
      '• Koneksi internet bermasalah\n' +
      '• Server Google Sheets sedang sibuk\n' +
      '• Konfigurasi API bermasalah\n\n' +
      'Silakan coba lagi dalam beberapa saat.',
      {
        chat_id: chatId,
        message_id: loadingMsg.message_id,
        parse_mode: 'Markdown',
      }
    );
  }
});

// Perintah /cari tanpa parameter
bot.onText(/\/cari$/, (msg) => {
  const chatId = msg.chat.id;
  
  bot.sendMessage(
    chatId,
    '⚠️ *Format Pencarian Salah*\n\n' +
    'Anda harus memasukkan TRACK ID atau SC ID setelah perintah /cari\n\n' +
    '*Contoh yang benar:*\n' +
    '\`/cari TRK12345\`\n' +
    '\`/cari SC001\`\n\n' +
    'Ketik /help untuk panduan lengkap.',
    { parse_mode: 'Markdown' }
  );
});

// Handler untuk pesan yang tidak dikenali
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  // Abaikan jika pesan adalah perintah yang sudah ditangani
  if (text && text.startsWith('/')) {
    return;
  }

  // Abaikan jika bukan text message
  if (!text) {
    return;
  }

  bot.sendMessage(
    chatId,
    '❓ *Perintah Tidak Dikenali*\n\n' +
    `Maaf, saya tidak mengerti pesan: "${text}"\n\n` +
    '*Perintah yang tersedia:*\n' +
    '/start - Memulai bot\n' +
    '/help - Melihat panduan\n' +
    '/cari [ID] - Mencari data\n\n' +
    'Ketik /help untuk informasi lebih lengkap.',
    { parse_mode: 'Markdown' }
  );
});

// ============================================
// JALANKAN BOT
// ============================================

bot.on('polling_error', (error) => {
  console.error('❌ Polling error:', error.message);
});

// Ketika bot berhasil terhubung
bot.getMe().then((botInfo) => {
  console.log('✅ Bot berhasil terhubung!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🤖 Bot Name: ${botInfo.first_name}`);
  console.log(`👤 Username: @${botInfo.username}`);
  console.log(`🆔 Bot ID: ${botInfo.id}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🟢 Bot sedang berjalan...');
  console.log('📝 Menunggu perintah dari user...');
  console.log('⚠️  Tekan Ctrl+C untuk menghentikan bot');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━');
}).catch((error) => {
  console.error('❌ Gagal menghubungkan bot!');
  console.error('Error:', error.message);
  console.error('\n💡 Pastikan TOKEN bot Anda benar!');
  process.exit(1);
});