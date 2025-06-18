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
            const filename = `自然保护与可持续性发展学习之旅 Nature & Sustainability Learning Journey (Tampines North Community Centre).jpg`; 
            fs.writeFileSync(filename, buffer);
            console.log(`QR code generated and saved as ${filename}`);
        } catch (error) {
            console.error('Error generating QR code:', error);
        }
    }
}

// Usage
const qrCodeGenerator = new QRCodeGenerator(`https://ecss.org.sg/product/%e8%87%aa%e7%84%b6%e4%bf%9d%e6%8a%a4%e4%b8%8e%e5%8f%af%e6%8c%81%e7%bb%ad%e6%80%a7%e5%8f%91%e5%b1%95%e5%ad%a6%e4%b9%a0%e4%b9%8b%e6%97%85nature-sustainability-learning-journeytampines-north-community/`);
qrCodeGenerator.generate();
