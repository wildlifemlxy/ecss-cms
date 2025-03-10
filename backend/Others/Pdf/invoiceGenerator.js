const PDFDocument = require('pdfkit');
const axios = require('axios');
const sharp = require('sharp'); // Import sharp for image processing
const path = require('path');

class invoiceGenerator {
    constructor() {}
    
    getCurrentDateTime() {
        const now = new Date();

        // Define an array of full month names
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June', 
            'July', 'August', 'September', 'October', 'November', 'December'
        ];

        // Get day, month, year, hours, and minutes
        const day = String(now.getDate()).padStart(2, '0'); // Ensure two digits
        const month = monthNames[now.getMonth()]; // Get full month name using the month index
        const year = now.getFullYear();

        const hours = String(now.getHours()).padStart(2, '0'); // 24-hour format
        const minutes = String(now.getMinutes()).padStart(2, '0'); // Ensure two digits
        const seconds = String(now.getSeconds()).padStart(2, '0'); // Ensure two digits

        // Format date and time
        const formattedDate = `${day} ${month.substring(0,3)} ${year}`; // Full month name
        const formattedTime = `${hours}:${minutes}:${seconds}`;

        return {
            date: formattedDate,
            time: formattedTime,
        };
    }    getCurrentDateTime() {
        const now = new Date();

        // Define an array of full month names
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June', 
            'July', 'August', 'September', 'October', 'November', 'December'
        ];

        // Get day, month, year, hours, and minutes
        const day = String(now.getDate()).padStart(2, '0'); // Ensure two digits
        const month = monthNames[now.getMonth()]; // Get full month name using the month index
        const year = now.getFullYear();

        const hours = String(now.getHours()).padStart(2, '0'); // 24-hour format
        const minutes = String(now.getMinutes()).padStart(2, '0'); // Ensure two digits
        const seconds = String(now.getSeconds()).padStart(2, '0'); // Ensure two digits

        // Format date and time
        const formattedDate = `${day} ${month.substring(0,3)} ${year}`; // Full month name
        const formattedTime = `${hours}:${minutes}:${seconds}`;

        return {
            date: formattedDate,
            time: formattedTime,
        };
    }

    getInvoiceCurrentDateTime() {
        const now = new Date();

        // Define an array of full month names
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June', 
            'July', 'August', 'September', 'October', 'November', 'December'
        ];

        // Get day, month, year, hours, and minutes
        const day = String(now.getDate()).padStart(2, '0'); // Ensure two digits
        const month = monthNames[now.getMonth()]; // Get full month name using the month index
        const year = now.getFullYear();

        const hours = String(now.getHours()).padStart(2, '0'); // 24-hour format
        const minutes = String(now.getMinutes()).padStart(2, '0'); // Ensure two digits
        const seconds = String(now.getSeconds()).padStart(2, '0'); // Ensure two digits

        // Format date and time
        const formattedDate = `${day} ${month} ${year}`; // Full month name
        const formattedTime = `${hours}:${minutes}:${seconds}`;

        return {
            date: formattedDate,
            time: formattedTime,
        };
    }

    async addHeader(doc, invoiceNumber) {
        const imagePath = "https://ecss.org.sg/wp-content/uploads/2025/01/featured_image.png";
        
        try {
            // Set Title "Invoice"
            const fontPathBold = path.join(__dirname, '../../fonts/ARIALBD.TTF'); // Path to your bold font file
            const fontPathRegular = path.join(__dirname, '../../fonts/ARIAL.TTF'); // Path to your regular font file
            const pageWidth = doc.page.width; // Get page width
            const fontWidth = doc.widthOfString("INVOICE", { font: fontPathBold, fontSize: 24 }); // Get width of the text
            
            const centerX = (pageWidth - fontWidth) / 4; // Calculate the X position to center the text
            const currentY = 10; // Set the Y position (you can adjust this as needed)
            
            doc.font(fontPathBold)
                .fontSize(24) // Ensure you are using font size 24
                .text("INVOICE", centerX - 50, currentY, { align: 'center' }); // Align text to the center
            
            doc.moveDown(1); // Adjust this as needed to add space below
                
            // Fetch the image as a buffer
            const response = await axios.get(imagePath, { responseType: 'arraybuffer' });
            const imageBuffer = Buffer.from(response.data);
    
            // Use sharp to get the image dimensions
            const { width, height } = await sharp(imageBuffer).metadata();
    
            // Set the left and right margins in points
            const leftMargin = (2.54 * 28.35) / 2; // 2.54 cm to points
            const rightMargin = 15.93; // Right margin in points
    
            // Calculate the effective image width
            const imageWidth = doc.page.width - leftMargin - rightMargin; // Full width minus margins
            const imageHeight = (height / width) * imageWidth; // Maintain aspect ratio
    
            // Scale the image down to 25% of its original size
            const scale = 0.1; // 25% scale
            const scaledImageWidth = imageWidth * scale;
            const scaledImageHeight = imageHeight * scale;
    
            // Add the image to the document with the left margin
            doc.image(imageBuffer, leftMargin, doc.y, {
                width: scaledImageWidth, // Set the scaled image width
                height: scaledImageHeight, // Set the scaled image height
                align: 'left', // Align the image to the left
                valign: 'top' // Align the image to the top
            });
    
            // Set the starting X position for the text (to the right of the image)
            const textX = leftMargin + scaledImageWidth + 10; // Add a little space between the image and text
            let textY = doc.y; // This will ensure the text starts at the same Y position as the image
    
            // Add the text beside the logo (En Community Services Society)
            doc.font(fontPathBold).fontSize(12).text("En Community Services Society", textX, textY);
            textY += 15; // Add vertical offset for the next line
            doc.font(fontPathRegular).fontSize(12).text("UEN - T03SS0051L", textX, textY);
            textY += 15; // Add vertical offset for the next line
            doc.font(fontPathBold).fontSize(12).text("Mailing Address:", textX, textY);
            textY += 15; // Add vertical offset for the next line
            doc.font(fontPathRegular).fontSize(12).text("2 Kallang Avenue, CT Hub #06-14", textX, textY);
            textY += 15; // Add vertical offset for the next line
            doc.font(fontPathRegular).fontSize(12).text("Singapore 339407", textX, textY);
            textY += 15; // Add vertical offset for the next line
            doc.font(fontPathRegular).fontSize(12).text("Tel - 67886625", textX, textY);
            textY += 15; // Add vertical offset for the next line
            doc.font(fontPathRegular).fontSize(12).text("Email : encom@ecss.org.sg", textX, textY);
    
            // Add the invoice details line by line
            const newTextX = textX + 410; // Adjust X position for the new set of text (beside the first block)
    
            // Set the starting Y position for the invoice details
            let currentYInvoice = textY-(15*6); // Start a bit lower than the last Y position
    
          // Add "INVOICE DATE:"
            doc.font(fontPathRegular).text("INVOICE DATE: " + this.getCurrentDateTime().date, newTextX, currentYInvoice);
            currentYInvoice += 15; // Move down for the next line

            // Add gap after odd line (even line should have a gap)
            currentYInvoice += 15; // Increase Y to add space for the next line (even line gap)

            // Add "INVOICE NO."
            doc.font(fontPathRegular).text("INVOICE NO.: "+invoiceNumber, newTextX, currentYInvoice);
            currentYInvoice += 15; // Move down for the next line

            // Add gap after odd line (even line should have a gap)
            currentYInvoice += 15; // Increase Y to add space for the next line (even line gap)


            // Move down after the image and text
            doc.moveDown(2); // Adjust this as needed to add space below
        } catch (error) {
            console.error('Error fetching the image:', error);
        }
    }
    
    addFooter = async (doc, y) => {
        const fontPathRegular = path.join(__dirname, '../../fonts/ARIAL.TTF'); // Path to your regular font file
    
        const leftMargin = 2.54 * 28.35; // 2.54 cm to points
        const textX = leftMargin-40; // Adjust 'leftMargin' to align the text properly
    
        // Set the font and size for the notes
        doc.font(fontPathRegular).fontSize(11);
    
        // Add each note line with consistent vertical spacing
        doc.text(
            "NOTES: 1. Participant is responsible to apply for SkillsFuture Credit claim before the start date of the course.",
            textX,
            y
        );
        y += 15; // Add vertical offset for the next line
    
        doc.text(
            "               2. Should the application for SFC claims be rejected by SkillsFuture Singapore, full subsidised fees will be payable by cash.",
            textX,
            y);
        y += 15; // Add vertical offset for the next line
    
        doc.text(
            "               3. Cash payment may be made by cash or cheque at our office, or PayNow to our UEN T03SS0051L.",
            textX,
            y
        );
        y += 15; // Add vertical offset for the next line
    
        doc.text(
            "               4. NSA subsidy is applicable to Singaporean or Singapore PR aged 50 and above.",
            textX,
            y
        );
        y += 15; // Add vertical offset for the next line
    
        doc.text(
            "               5. This is a computer generated invoice and requires no signature.",
            textX,
            y
        );
        y += 15; // Add vertical offset for the next lin
    };
    
    formatDate(dateStr) {
        const parts = dateStr.split(' ');
        const day = parts[0]; // '23'
        const month = parts[1]; // 'January'
        const year = parts[2]; // '2025'

        // Convert the full month name to a 3-letter abbreviation
        const monthAbbr = month.substring(0, 3); // 'Jan'

        // Return the formatted date as dd-mmm-yyyy
        return `${day}-${monthAbbr}-${year}`;
    }
        
    async addBody(doc, array, currentPage, totalPages, name, receiptNo) {
        const leftMargin = 2.54 * 28.35; // 2.54 cm to points
        const rightMargin = 15.93; // Right margin in points
    
        const fontPathBold = path.join(__dirname, '../../fonts/ARIALBD.TTF'); // Path to your bold font file
        const fontPathRegular = path.join(__dirname, '../../fonts/ARIAL.TTF'); // Path to your regular font file
        const fontPathTimesRegular = path.join(__dirname, '../../fonts/timesNewRoman.ttf'); // Path to your Times New Roman font file
    
        // Store the current y position
        let currentY = doc.y;
    
        // First Text
        doc.font(fontPathBold).fontSize(12).text("REGISTRATION OF NSA COURSES ELIGIBLE FOR SKILLSFUTURE CREDIT", leftMargin + 100, currentY);
        currentY += 15; // Manually adjust the Y position after the first text
    
        doc.moveDown(0.5);
    
        // Create the course table
        this.createCourseTable(doc, array, "Course Ref. No. ", "Course Title", "Start Date", "End Date", "Full Course Fee (S$)", "Subsidised Fee Payable (S$)");
        currentY = doc.y; // Update currentY to the bottom of the table
    
        doc.moveDown(15);
    
        // Second Text
        doc.font(fontPathBold).fontSize(12).text("PARTICIPANT'S PARTICULARS AND CLAIM", leftMargin + 200, currentY+30);
        currentY += 13; // Manually adjust the Y position after the second text
    
        doc.moveDown(0.5);
    
        // Create the participants table (uncomment if needed)
        this.createParticipantsTable(doc, array, "NRIC. No. ", "Name of Participant", "Full Course Fee (S$)", "Subsidised Fee Payable (S$)", "Cash", "SFC Claim");
        
    }
    

    courseReferenceCode(course) {
        //The Rest Note of Life – Mandarin 14-Feb
        console.log("Course Name: ", course);
    
        const courseMap = {
            "TCM – Don’t be a friend of Chronic Diseases": "TGS-2021008576",
            "Nagomi Pastel Art Basic": "TGS-2022011919",
            "Therapeutic Watercolour Painting for Beginners ": "TGS-2022015736",
            "Chinese Calligraphy Intermediate": "TGS-2022011921",
            "Chinese Calligraphy Basic": "TGS-2022011920",
            "Nagomi Pastel Art Appreciation": "TGS-2022011920",
            "Community Ukulele – Mandarin": "TGS-2021008564",
            "Community Singing – Mandarin": "TGS-2021008563",
            "Self-Care TCM Wellness – Mandarin": "TGS-2021008561",
            "Hanyu Pinyin for Beginners": "TGS-2021008571",
            "The Rest Note of Life – Mandarin": "TGS-2022015736",
            "TCM Diet & Therapy": "TGS-2021008570",
            "Therapeutic Basic Line Work": "TGS-2024047927",
            "Healthy Minds, Healthy Lives – Mandarin": "",
            "Therapeutic Basic Line Work": "TGS-2022015736"
        };
    
       // Check for exact match
        if (courseMap[course]) {
            return courseMap[course];
        }
    
        // If no match, return a default value
        return "";
    }
    
    
    async createCourseTable(doc, array, header1, header2, header3, header4, header5, header6) {
        const fontPathBold = path.join(__dirname, '../../fonts/ARIALBD.TTF'); 
        const fontPathRegular = path.join(__dirname, '../../fonts/ARIAL.TTF'); 
    
        const leftMargin = 2.54 * 28.35 - 60; 
        const tableTop = doc.y; 
        const rowHeight = 35; 
        const borderExternalThickness = 2; 
        const borderInternalThickness = 1; 
        const headerHeight = rowHeight; 
    
        const headerWidths = [
            doc.widthOfString(header1),
            doc.widthOfString(header2),
            doc.widthOfString(header3),
            doc.widthOfString(header4),
            doc.widthOfString(header5),
            doc.widthOfString(header6),
        ];
    
        const columnWidths = {
            courseRef: Math.min(headerWidths[0], 100), 
            courseTitle: Math.max(headerWidths[1], 275),
            startDate: Math.max(headerWidths[2], 80),
            endDate: Math.max(headerWidths[3], 80),
            fullCourse: Math.min(headerWidths[4], 145),
            subsidised: Math.min(headerWidths[5], 140)
        };
    
        const totalTableWidth = columnWidths.courseRef + columnWidths.courseTitle + columnWidths.startDate + columnWidths.endDate + columnWidths.fullCourse + columnWidths.subsidised-10;
    
        const columnPositions = {
            courseRef: leftMargin,
            courseTitle: leftMargin + columnWidths.courseRef-10,
            startDate: leftMargin + columnWidths.courseRef + columnWidths.courseTitle,
            endDate: leftMargin + columnWidths.courseRef + columnWidths.courseTitle + columnWidths.startDate,
            fullCourse: leftMargin + columnWidths.courseRef + columnWidths.courseTitle + columnWidths.startDate + columnWidths.endDate,
            subsidised: leftMargin + columnWidths.courseRef + columnWidths.courseTitle + columnWidths.startDate + columnWidths.endDate + columnWidths.fullCourse,
        };
    
        doc.rect(leftMargin, tableTop, totalTableWidth, headerHeight).fill('#FBFBFB');
    
        doc.fontSize(10).fillColor('black').font(fontPathBold);
        doc.text(header1, columnPositions.courseRef + columnWidths.courseRef / 2 - headerWidths[0] / 2+2, tableTop + 12);
        doc.text(header2, columnPositions.courseTitle + columnWidths.courseTitle / 2 - headerWidths[1] / 2, tableTop + 12);
        doc.text(header3, columnPositions.startDate + columnWidths.startDate / 2 - headerWidths[2] / 2, tableTop + 12);
        doc.text(header4, columnPositions.endDate + columnWidths.endDate / 2 - headerWidths[3] / 2, tableTop + 12);
        doc.text(header5, columnPositions.fullCourse + columnWidths.fullCourse / 2 - headerWidths[4] / 2, tableTop + 12);
        doc.text(header6, columnPositions.subsidised  + columnWidths.subsidised / 2 - headerWidths[5] / 2+12, tableTop + 2);
    
        doc.lineWidth(borderExternalThickness)
            .moveTo(leftMargin, tableTop + headerHeight)
            .lineTo(leftMargin + totalTableWidth, tableTop + headerHeight)
            .stroke('black');
    
        for (let column in columnPositions) {
            doc.lineWidth(borderInternalThickness)
                .moveTo(columnPositions[column], tableTop)
                .lineTo(columnPositions[column], tableTop + headerHeight)
                .stroke('black');
        }
    
        let currentY = tableTop + headerHeight; 
        doc.fontSize(9).fillColor('black').font(fontPathRegular);
        array.forEach((item, index) => {
            console.log("Course Reference Code:", this.courseReferenceCode(item.course.courseEngName));
            doc.text(this.courseReferenceCode(item.course.courseEngName), columnPositions.courseRef + 2, currentY + 3)
            doc.text(item.course.courseEngName, columnPositions.courseTitle + 2, currentY + 3, { maxWidth: headerWidths[1]});
            const durationParts = item.course.courseDuration.split('-');
            const startDate = durationParts[0].trim(); // '23 January 2025'
            const endDate = durationParts[1].trim(); // '23 January 2025'

            const formattedStartDate = this.formatDate(startDate);
            const formattedEndDate = this.formatDate(endDate);

            doc.text(formattedStartDate, columnPositions.startDate+ 5, currentY + 3); 
            doc.text(formattedEndDate, columnPositions.endDate+ 5, currentY + 3); 
            const coursePrice = parseFloat(item.course.coursePrice.replace('$', '').trim());
            const totalPrice = coursePrice * 5;
            doc.text(`$     ${totalPrice.toFixed(2)}`, columnPositions.fullCourse+ 5, currentY + 3); 
            doc.text(`$     ${coursePrice.toFixed(2)}`, columnPositions.subsidised+ 5, currentY + 3); 
        
            // Draw borders for the first row
            if (index === 0) {
                doc.lineWidth(borderInternalThickness)
                    .moveTo(leftMargin, currentY + rowHeight)
                    .lineTo(leftMargin + totalTableWidth, currentY + rowHeight)
                    .stroke('black');
        
                for (let column in columnPositions) {
                    doc.lineWidth(borderInternalThickness)
                        .moveTo(columnPositions[column], currentY)
                        .lineTo(columnPositions[column], currentY + rowHeight)
                        .stroke('black');
                }
            }
        
            // Draw borders for the remaining rows except the last row
            if (index > 0 && index < array.length - 1) {
                doc.lineWidth(borderInternalThickness)
                    .moveTo(leftMargin, currentY + rowHeight)
                    .lineTo(leftMargin + totalTableWidth, currentY + rowHeight)
                    .stroke('black');
            }
        
            currentY += rowHeight; 
        });
                  
        doc.lineWidth(borderInternalThickness)
        .moveTo(leftMargin, tableTop) // Start from the left margin at the top
        .lineTo(leftMargin + totalTableWidth, tableTop) // End at the right margin at the top
        .stroke('black');    
        
        doc.lineWidth(borderInternalThickness)
        .moveTo(leftMargin + totalTableWidth, tableTop) // Starting from the top-right corner
        .lineTo(leftMargin + totalTableWidth, currentY + rowHeight) // Ending at the bottom-right corner
        .stroke('black');
        
        // Add the last row with specific border logic
        const invoiceText = 'Invoice Total';
        doc.font(fontPathBold).text(invoiceText, columnPositions.fullCourse + 10, currentY + 10); 
        
        const payablePrice = array.reduce((acc, item) => {
            const coursePrice = parseFloat(item.course.coursePrice.replace('$', '').trim());
            return acc + coursePrice;
        }, 0);

        doc.text(`$${payablePrice.toFixed(2)}`, columnPositions.subsidised + 10, currentY + 10);

        // Draw borders only for the 4th, 5th, and 6th columns
        ['endDate', 'subsidised'].forEach((column) => {
            const position = columnPositions[column];
            doc.lineWidth(borderInternalThickness)
                .moveTo(position, currentY) // Start from the last row start
                .lineTo(position, currentY + rowHeight) // Extend to the last row height
                .stroke('black');
        });
        
        // Draw the bottom border for the last row (for the last 3 columns: endDate, subsidised, and totalPrice)
        doc.lineWidth(borderInternalThickness)
            .moveTo(columnPositions.endDate, currentY + rowHeight) // Starting from the endDate column
            .lineTo(columnPositions.subsidised + columnWidths.subsidised-10, currentY + rowHeight) // Extending to the end of the subsidised column
            .stroke('black');
    }

    async createParticipantsTable(doc, array, header1, header2, header3, header4, header5, header6) {
        const fontPathBold = path.join(__dirname, '../../fonts/ARIALBD.TTF');
        const fontPathRegular = path.join(__dirname, '../../fonts/ARIAL.TTF');
    
        const leftMargin = 1 * 28.35-5; // Left margin
        const tableTop = doc.y; // Top position of the table
        const rowHeight = 30; // Row height
        const borderInternalThickness = 1; // Border thickness
        const headerHeight = rowHeight; // Header row height
    
        const headerWidths = [
            doc.widthOfString(header1),
            doc.widthOfString(header2),
            doc.widthOfString(header3),
            doc.widthOfString(header4),
            doc.widthOfString(header5),
            doc.widthOfString(header6),
        ];

        const columnWidths = {
            nric: Math.max(headerWidths[0], 100),
            pName: Math.max(headerWidths[1], 135),
            fullCourse: Math.max(headerWidths[2], 100),
            subsidised: Math.max(headerWidths[3], 100),
            cash: Math.max(headerWidths[4], 100),
            sFCClaim: Math.max(headerWidths[5], 100),
        };
    
        const totalTableWidth =
            columnWidths.nric +
            columnWidths.pName +
            columnWidths.fullCourse +
            columnWidths.subsidised +
            columnWidths.cash +
            columnWidths.sFCClaim+45;
    
        const columnPositions = {
            nric: leftMargin,
            pName: leftMargin + columnWidths.nric,
            fullCourse: leftMargin + columnWidths.nric + columnWidths.pName,
            subsidised: leftMargin + columnWidths.nric + columnWidths.pName + columnWidths.fullCourse,
            cash: leftMargin + columnWidths.nric + columnWidths.pName + columnWidths.fullCourse + columnWidths.subsidised,
            sFCClaim: leftMargin + columnWidths.nric + columnWidths.pName + columnWidths.fullCourse + columnWidths.subsidised + columnWidths.cash,
        };
    
        doc.fontSize(10).fillColor('black').font(fontPathBold);
    
        // Draw table headers
        Object.entries(columnPositions).forEach(([key, position], index) => {
            doc.text(
                [header1, header2, header3, header4, header5, header6][index],
                position + columnWidths[key] / 2 - headerWidths[index] / 2,
                tableTop + 10
            );
        });
    
        // Draw header borders
        doc.lineWidth(borderInternalThickness)
            .moveTo(leftMargin, tableTop)
            .lineTo(leftMargin + totalTableWidth, tableTop)
            .stroke('black');
    
        doc.moveTo(leftMargin, tableTop + headerHeight)
            .lineTo(leftMargin + totalTableWidth, tableTop + headerHeight)
            .stroke('black');
    
        // Draw vertical column borders
        Object.values(columnPositions).forEach((position) => {
            doc.moveTo(position, tableTop)
                .lineTo(position, tableTop + headerHeight)
                .stroke('black');
        });
    
        let currentY = tableTop + headerHeight;
        doc.fontSize(10).fillColor('black').font(fontPathRegular);
    
        // Draw table rows
        array.forEach((item, index) => {
            // Draw text in columns
            doc.text(item.participant.nric, columnPositions.nric + 5, currentY + 10);
            doc.text(item.participant.name, columnPositions.pName + 5, currentY + 10);
    
            const coursePrice = parseFloat(item.course.coursePrice.replace('$', '').trim());
            const totalPrice = coursePrice * 5;
            doc.text(`$ ${totalPrice.toFixed(2)}`, columnPositions.fullCourse + 5, currentY + 10);
            doc.text(`$ ${coursePrice.toFixed(2)}`, columnPositions.subsidised + 5, currentY + 10);
            doc.text('-', columnPositions.cash + 5, currentY + 10);
            doc.text(`$ ${coursePrice.toFixed(2)}`, columnPositions.sFCClaim + 5, currentY + 10);
    
            // Draw row borders
            doc.lineWidth(borderInternalThickness)
                .moveTo(leftMargin, currentY)
                .lineTo(leftMargin + totalTableWidth, currentY)
                .stroke('black');
    
            // Draw vertical borders for each column
            Object.values(columnPositions).forEach((position) => {
                doc.moveTo(position, currentY)
                    .lineTo(position, currentY + rowHeight)
                    .stroke('black');
            });
    
            currentY += rowHeight;
        });
    
        // Draw final bottom border
        doc.lineWidth(borderInternalThickness)
            .moveTo(leftMargin, currentY)
            .lineTo(leftMargin + totalTableWidth, currentY)
            .stroke('black');
    
            doc.lineWidth(borderInternalThickness)
            .moveTo(leftMargin + totalTableWidth, tableTop)
            .lineTo(leftMargin + totalTableWidth, currentY)
            .stroke('black');
    }
    

    async addContent(doc, array, name, receiptNo) {
        console.log("Add Content:", name);
        
        // Initial header addition for the first page
        await this.addHeader(doc, receiptNo); // Add header to the first page
    
        doc.moveDown(3);
    
        // Add body content for the first page
        await this.addBody(doc, array, name, receiptNo);
    
        // Adjust the vertical position for the footer
        const footerY = doc.y+45; // 20 units below the current position
    
        // Add footer content
        await this.addFooter(doc, footerY);
    }
    async generateInvoice(res, array, name, receiptNo) {
        console.log(array, name, receiptNo);
    
        try {
            console.log("Staff Name:", name);
            // Set headers for PDF
            const filename = `Moses.pdf`;
    
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    
            // Set cache headers to allow permanent access
            res.setHeader('Cache-Control', 'public, max-age=315360000'); // Cache for 10 years (in seconds)
            res.setHeader('Expires', new Date(Date.now() + 315360000 * 1000).toUTCString()); // Expires in 10 years
    
            // Log headers just before sending the response
            console.log('Sending headers:', {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `inline; filename="${filename}"`,
                'Cache-Control': 'public, max-age=315360000',
                'Expires': new Date(Date.now() + 315360000 * 1000).toUTCString()
            });
    
            // Set paper orientation to landscape
            const doc = new PDFDocument({ layout: 'landscape' });
    
            // Add error listener
            doc.on('error', (err) => {
                console.error('Error while generating PDF:', err);
                res.status(500).json({ error: 'Error generating PDF' });
            });
    
            doc.pipe(res);
    
            // Ensure addContent is called correctly with await
            await this.addContent(doc, array, name, receiptNo);
    
            // Finalize the document
            doc.end();
    
            // Listen for the finish event
            res.on('finish', () => {
                console.log('PDF response sent successfully.');
            });
    
        } catch (error) {
            console.error('Error in PDF generation:', error);
            res.status(500).json({ error: 'An unexpected error occurred' });
        }
    }    
}    

module.exports = invoiceGenerator;
