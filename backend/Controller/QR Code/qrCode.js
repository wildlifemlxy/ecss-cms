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
            const filename = `日本和谐粉彩基础班 Nagomi Pastel Art Basic L2 (CT Hub).jpg`; 
            fs.writeFileSync(filename, buffer);
            console.log(`QR code generated and saved as ${filename}`);
        } catch (error) {
            console.error('Error generating QR code:', error);
        }
    }
}

// Usage
const qrCodeGenerator = new QRCodeGenerator(`https://ecss.org.sg/product/%E6%97%A5%E6%9C%AC%E5%92%8C%E8%B0%90%E7%B2%89%E5%BD%A9%E5%9F%BA%E7%A1%80%E7%8F%ADnagomi-pastel-art-basic-l2/`);
qrCodeGenerator.generate();
