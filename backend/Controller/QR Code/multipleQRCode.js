import QRCode from 'qrcode';
import fs from 'fs';

class QRCodeBatchGenerator {
    constructor(entries) {
        this.entries = entries; // Array of { text, filename }
        this.options = {
            errorCorrectionLevel: 'H',
            type: 'image/jpeg',
            quality: 1,
        };
    }

    async generateAll() {
        for (const entry of this.entries) {
            try {
                const buffer = await QRCode.toBuffer(entry.text, this.options);
                fs.writeFileSync(entry.filename, buffer);
                console.log(`QR code generated and saved as ${entry.filename}`);
            } catch (error) {
                console.error(`Error generating QR code for ${entry.filename}:`, error);
            }
        }
    }
}

// Usage example
const qrEntries = [
    {
        text: 'https://ecss.org.sg/product/%e9%9f%b3%e4%b9%90%e7%a5%9d%e7%a6%8f%e7%a4%be%e5%8c%ba%e5%9b%9b%e5%bc%a6%e7%90%b4%e7%8f%adcommunity-ukulele-mandarin-l2act-hub/',
        filename: '音乐祝福社区四弦琴班Community Ukulele – Mandarin L2A (CT Hub).jpg',
    },
    {
        text: 'https://ecss.org.sg/product/%e9%9f%b3%e4%b9%90%e7%a5%9d%e7%a6%8f%e7%a4%be%e5%8c%ba%e5%9b%9b%e5%bc%a6%e7%90%b4%e7%8f%adcommunity-ukulele-mandarin-l2bct-hub/',
        filename: '音乐祝福社区四弦琴班 Community Ukulele – Mandarin L2B (CT Hub).jpg',
    }
];

const generator = new QRCodeBatchGenerator(qrEntries);
generator.generateAll();
