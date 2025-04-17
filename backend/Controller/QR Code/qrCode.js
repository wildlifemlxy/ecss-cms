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
            const filename = '自杀预防意识 Suicide Prevention Awareness (CT Hub).jpg'; 
            fs.writeFileSync(filename, buffer);
            console.log(`QR code generated and saved as ${filename}`);
        } catch (error) {
            console.error('Error generating QR code:', error);
        }
    }
}

// Usage
const qrCodeGenerator = new QRCodeGenerator('https://ecss.org.sg/product/%e7%a7%af%e6%9e%81%e6%b2%9f%e9%80%9a%e7%9a%84%e8%89%ba%e6%9c%af%e5%bb%ba%e7%ab%8b%e5%b9%b8%e7%a6%8f%e5%ae%b6%e5%ba%adart-of-positive-communication-builds-happy-homespasir-ris-west-wellness-centre/');
qrCodeGenerator.generate();
