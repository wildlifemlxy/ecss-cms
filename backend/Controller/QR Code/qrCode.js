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
            const filename = `健康心灵, 健康生活 Healthy Minds for Healthy Lives (Pasir Ris West Wellness Centre).jpg`; 
            fs.writeFileSync(filename, buffer);
            console.log(`QR code generated and saved as ${filename}`);
        } catch (error) {
            console.error('Error generating QR code:', error);
        }
    }
}

// Usage
const qrCodeGenerator = new QRCodeGenerator(`https://ecss.org.sg/product/%e5%81%a5%e5%ba%b7%e5%bf%83%e7%81%b5%ef%bc%8c%e5%81%a5%e5%ba%b7%e7%94%9f%e6%b4%bbhealthy-minds-for-healthy-lives-mandarin-prw/`);
qrCodeGenerator.generate();
