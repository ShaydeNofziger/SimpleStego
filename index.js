const cv = require('opencv');

/**
 * Hide a message in an image.
 * @param {Buffer} bufMessage        the message to encode in the cover image
 * @param {String} originalImagePath the path to the cover image
 */
function writeHiddenImage(bufMessage, originalImagePath) {
    cv.readImage(originalImagePath, (err, im) => {
        im.save('./output/original.png');
        let width = im.width();
        let height = im.height();

        currBufIndex = 0;
        let row = 0;
        let col = 0;
        while (currBufIndex < bufMessage.length) {
            const startRow = row;
            const startCol = col;
            const utfValue = bufMessage[currBufIndex];
            const currCharacter = String.fromCharCode(utfValue);
            const utfValueBinary = (utfValue >>> 0).toString(2);
            const binUtfArray = utfValueBinary.split('');
            const currPixelValues = im.pixel(row, col);

            console.log('***********************************');
            console.log(`Processing character:\t"${currCharacter}"`);
            console.log(`UTF Value (hex):\t${utfValue}`);
            console.log(`UTF value (binary):\t${utfValueBinary}`);
            while (binUtfArray.length < 9) binUtfArray.unshift(0);
            binUtfArray.forEach((binNumber, index) => {
                const loc = index % 3;
                let newValue = currPixelValues[loc] + parseInt(binNumber);
                im.set(row, col, newValue, loc);
                col++;
                if (col >= width) {
                    row += 1;
                    col = 0;
                }
                if (row > height) {
                    throw new Error('Cover image must have larger dimension than hidden message image');
                }
            });
            console.log(`Starting pixel:\t\t(${startRow}, ${startCol})`);
            console.log(`Ending pixel:\t\t(${row}, ${col - 1})`);
            console.log('***********************************');
            currBufIndex ++;
        }
        im.save('./output/hidden.png');
        console.log('Information hiding complete! Output stored at: "./output/hidden.png"');
    });
}

/**
 * Decode a message from a hidden image.
 * Compares original to cover to determine which pixels were modified.
 * @param {String} originalImagePath the path to the original cover image
 * @param {String} hiddenImagePath   the path to the image file being decoded
 */
function decodeHiddenImage(originalImagePath, hiddenImagePath) {
    console.log(`Decoding hidden message`);
    console.log(`Cover image path:\t\t${originalImagePath}`);
    console.log(`Hidden image path:\t\t${hiddenImagePath}`);

    // open the hidden image
    cv.readImage(hiddenImagePath, (err, hidden) => {
        // open the cover image
        cv.readImage(originalImagePath, (err, original) => {
            const originalWidth = original.width();
            const originalHeight = original.height();
            let messageBinArray = [];
            let currPixel = 0;

            // iterate through each pixel in the hidden and cover images.
            for (let row = 0; row < originalHeight; row++) {
                for(let col = 0; col < originalWidth; col++) {
                    // a pixel is an array of integers representing RGB values:
                    // [ R, G, B ] where R,G,B are between 0 and 255
                    let orgPixelColors = original.pixel(row, col);
                    let newPixelColors = hidden.pixel(row, col);
                    // if theres a difference in the pixel's R, G, or B value, push a '1'.
                    // otherwise, push a '0'.
                    if (newPixelColors[currPixel % 3] - orgPixelColors[currPixel % 3] !== 0) {
                        messageBinArray.push(1);
                    }
                    else {
                        messageBinArray.push(0);
                    }
                    // we increment only 1 of the R,G, or B values depending
                    // on which pixel we're at. Move on to the next pixel.
                    currPixel++;
                }
            }
            let charBinString = '';
            let messageCharArray = [];
            // iterate through the array of binary values.
            // a character is encoded using an 8 bit binary string.
            // Every 9th iteration, parse the character from its UTF charcode.
            messageBinArray.forEach((binNumber, index) => {
                if (index % 9 === 0) {
                    if (charBinString !== '') {
                        // convert from binary to integer
                        let charUtf = parseInt(charBinString, 2);
                        // get the character from the charcode and add it to the message character array.
                        messageCharArray.push(String.fromCharCode(charUtf));
                    }
                    // reset the string for the next set of chars.
                    charBinString = '';
                } else {
                    charBinString = charBinString.concat(binNumber.toString());
                }
            });
            // make a string from the message character array
            const decodedMessage = messageCharArray.join('');
            console.log(`The binary message string is:\t${messageBinArray.slice(0, 100).join('')}...`);
            console.log(`The hidden message is:\t\t"${decodedMessage}"`);
        });
    });
}

if (process.argv.length < 5) {
    console.log('Insufficient number of arguments!');
    process.exit(1);
}

const operation = process.argv[2];

if (operation === 'encode') {
    const imageFilePath = process.argv[3];
    const message = new Buffer(process.argv[4], 'utf8');
    console.log(`Hiding "${process.argv[4]}" in image at "${imageFilePath}"`);
    writeHiddenImage(message, imageFilePath);
} else if (operation === 'decode') {
    const originalImageFilePath = process.argv[3];
    const hiddenImageFilePath = process.argv[4];
    decodeHiddenImage(originalImageFilePath, hiddenImageFilePath);
} else {
    console.log('Operation must be "encode" or "decode"');
    process.exit(1);
}
