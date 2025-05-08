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
        text: 'https://ecss.org.sg/product/%e6%99%ba%e8%83%bd%e6%89%8b%e6%9c%ba%e6%91%84%e5%bd%b1%e7%8f%ad-smartphone-photographytampines-253-centre/',
        filename: '智能手机摄影 Smartphone Photography (Tampines 253 Centre).jpg',
    },
    {
        text: 'https://ecss.org.sg/product/%e5%81%a5%e5%ba%b7%e5%bf%83%e7%81%b5%ef%bc%8c%e5%81%a5%e5%ba%b7%e7%94%9f%e6%b4%bb-%e4%b8%ad%e6%96%87healthy-minds-for-healthy-lives-mandarintampines-253-centre/',
        filename: '健康心灵, 健康生活 Healthy Minds, Healthy Lives – Mandarin (Tampines 253 Centre).jpg',
    },
    {
        text: 'https://ecss.org.sg/product/%e7%96%97%e6%84%88%e5%9f%ba%e7%a1%80%e7%b4%a0%e6%8f%8ftherapeutic-basic-line-worktampines-253-centre/',
        filename: '疗愈基础素描 Therapeutic Basic Line Work (Tampines 253 Centre).jpg',
    }
];

const generator = new QRCodeBatchGenerator(qrEntries);
generator.generateAll();
