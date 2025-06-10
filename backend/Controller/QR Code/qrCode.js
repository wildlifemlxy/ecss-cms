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
            const filename = `衍纸的乐趣 Fun with Paper Quilling – Fun with Paper Quilling Brighton Connection (Pasir Ris West Wellness Centre).jpg`; 
            fs.writeFileSync(filename, buffer);
            console.log(`QR code generated and saved as ${filename}`);
        } catch (error) {
            console.error('Error generating QR code:', error);
        }
    }
}

// Usage
const qrCodeGenerator = new QRCodeGenerator(`https://ecss.org.sg/product/%e8%a1%8d%e7%ba%b8%e7%9a%84%e4%b9%90%e8%b6%a3fun-with-paper-quilling-fun-with-paper-quilling-brighton-connectionpasir-ris-west-wellness-centre-copy/`);
qrCodeGenerator.generate();
