const express = require('express');
//const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysocket/baileys');
const { makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys')

const QRCode = require('qrcode');
//const { Boom } = require('@hapi/boom');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

app.use(express.static('public'));

let qrCodeDataURL = null;

app.get('/qr', async (req, res) => {
    res.send(qrCodeDataURL);
});

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys')

    sock = makeWASocket({
        // can provide additional config here
        printQRInTerminal: true,
        auth: state
    })

    sock.ev.on('connection.update', async (update) => {
        const { connection, qr } = update;

        if (qr) {
            qrCodeDataURL = await QRCode.toDataURL(qr);
        }

        if (connection === 'close') {
            const shouldReconnect = (update.lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('connection closed due to', update.lastDisconnect?.error, ', reconnecting', shouldReconnect);
            // reconnect if not logged out
            if (shouldReconnect) {
                startSock();
            }
        } else if (connection === 'open') {
            console.log('opened connection');
        }
    });

    await sock.readMessages();
};

connectToWhatsApp();

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});