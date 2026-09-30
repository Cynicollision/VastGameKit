// Encodes RGBA pixels as a PNG, with no dependencies beyond Node.
import { deflateSync } from 'node:zlib';

const CrcTable = new Uint32Array(256).map((_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) {
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    return c >>> 0;
});

function crc32(bytes) {
    let crc = 0xffffffff;
    for (const byte of bytes) {
        crc = CrcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
    const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(typeAndData));
    return Buffer.concat([length, typeAndData, crc]);
}

// pixels: width * height * 4 bytes of RGBA, by row.
export function encodePng(width, height, pixels) {
    const header = Buffer.alloc(13);
    header.writeUInt32BE(width, 0);
    header.writeUInt32BE(height, 4);
    header[8] = 8; // bits per channel
    header[9] = 6; // RGBA
    header[10] = header[11] = header[12] = 0;

    // each row starts with filter type 0 (none).
    const rows = Buffer.alloc(height * (width * 4 + 1));
    for (let y = 0; y < height; y++) {
        rows[y * (width * 4 + 1)] = 0;
        Buffer.from(pixels.buffer, pixels.byteOffset + y * width * 4, width * 4).copy(rows, y * (width * 4 + 1) + 1);
    }

    return Buffer.concat([
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        chunk('IHDR', header),
        chunk('IDAT', deflateSync(rows, { level: 9 })),
        chunk('IEND', Buffer.alloc(0)),
    ]);
}
