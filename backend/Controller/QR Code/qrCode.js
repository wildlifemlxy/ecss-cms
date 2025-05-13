import QRCode from 'qrcode';
import fs from 'fs';

class QRCodeGenerator {
    constructor(text) {
        this.text = text;
        this.options = {
            errorCorrectionLevel: 'H', // High error correction
            type: 'image/jpeg', // Output type
            quality: 1, // JPEG quality (0 to 1)
        };
    }

    // Method to generate QR code and save it as a JPG file
    async generate() {
        try {
            // Generate QR code as a buffer
            const buffer = await QRCode.toBuffer(this.text, this.options);

            // Save the buffer to a JPG file
            const filename = `时光步道 - 走过中巴鲁 Tiong Bahru Heritage Trail (TNCC).jpg`; 
            fs.writeFileSync(filename, buffer);
            console.log(`QR code generated and saved as ${filename}`);
        } catch (error) {
            console.error('Error generating QR code:', error);
        }
    }
}

// Usage
const qrCodeGenerator = new QRCodeGenerator(`https://ecss.org.sg/product/%e6%97%b6%e5%85%89%e6%ad%a5%e9%81%93-%e8%b5%b0%e8%bf%87%e4%b8%ad%e5%b7%b4%e9%b2%81tiong-bahru-heritage-trailtampines-north-community-centre/`);
qrCodeGenerator.generate();
