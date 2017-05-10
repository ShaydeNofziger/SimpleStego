# Simple-Stego
A basic proof-of-concept example of hiding information in a basic PNG image.

## Pre-reqs
* The [OpenCV](http://opencv.org) library is installed.
* `npm install` should take care of the rest.

## Running
To encode: `node index.js encode /path/to/cover/image.png "[MESSAGE TEXT]"`
To decode: `node index.js decode /path/to/cover/image.png /path/to/stego/object.png`

## How it works
This app uses a very basic algorithm for hiding the text in the PNG image data.

First, the message text is split into its individual characters.

Then, each character's integer code is determined, and that value is converted to a binary string.

Finally, the binary string for the entire message is iterated through. For each bit in the binary string, its cooresponding pixel's (beginning at (0,0) for the first bit of the string) RGB value is incremented by the value of the bit (either 1 or 0 in binary).

To further obfuscate the message, the value to update (R, G, or B) rotates with each pixel. 

## Example of the encoding process

Character | CharacterCode | BinaryString |
-|-|-|
"H" | 72 | 1001000

Say the first character of our message is `H`. We want to write its binary string, `1001000` to the image pixel data. Here's how that looks:

* For each bit in the binary string:
  * Get the next untouched pixel, beginning at (0,0)
  * Increment the R, G, or B value by the integer value of the bit (1 or 0)
    * Which of R, G, or B is incremented is calculated by calculating the current pixel number modulo 3 (the zeroeth pixel is (0,0), the 100th pixel is (0, 100), the 101st pixel is (1, 0), etc.).
    * Red `if currPixel % 3 == 0`
    * Green `if currPixel % 3 == 1`
    * Blue `if currPixel % 3 == 2`


## The Decoding process
To decode a hidden message using this algorithm, the original cover image is compared against the stego-object to determine which pixels have been altered. The message binary string is reconstructed and the encoding process happens in reverse.
