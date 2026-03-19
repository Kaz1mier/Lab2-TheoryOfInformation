
function cleanBinary(str) {
    return str.replace(/[^01]/g, '');
}

function generateLFSR(seed, length) {
    let reg = seed.split('').map(Number);
    let taps = [23, 3, 2, 0];

    let result = [];

    for (let i = 0; i < length; i++) {
        let newBit = taps.reduce((acc, t) => acc ^ reg[t], 0);

        result.push(reg[reg.length - 1]);

        reg.pop();
        reg.unshift(newBit);
    }

    return result;
}

function bytesToBits(bytes) {
    let bits = [];
    for (let byte of bytes) {
        for (let i = 7; i >= 0; i--) {
            bits.push((byte >> i) & 1);
        }
    }
    return bits;
}


function bitsToBytes(bits) {
    let bytes = [];
    for (let i = 0; i < bits.length; i += 8) {
        let byte = 0;
        for (let j = 0; j < 8; j++) {
            byte = (byte << 1) | (bits[i + j] || 0);
        }
        bytes.push(byte);
    }
    return new Uint8Array(bytes);
}

function xorBits(a, b) {
    return a.map((bit, i) => bit ^ b[i]);
}

function processFile(isEncrypt) {
    let fileInput = document.getElementById('fileInput');
    let seedInput = document.getElementById('seed');

    if (!fileInput.files.length) {
        alert("Выберите файл");
        return;
    }

    let seed = cleanBinary(seedInput.value);

    if (seed.length !== 24) {
        alert("Начальное состояние должно быть 24 бита");
        return;
    }

    let reader = new FileReader();

    reader.onload = function(e) {
        let bytes = new Uint8Array(e.target.result);

        let inputBits = bytesToBits(bytes);

        let key = generateLFSR(seed, inputBits.length);

        let outputBits = xorBits(inputBits, key);

        document.getElementById('inputBits').value = inputBits.join('');
        document.getElementById('keyBits').value = key.join('');
        document.getElementById('outputBits').value = outputBits.join('');

        let outBytes = bitsToBytes(outputBits);

        let blob = new Blob([outBytes]);
        let url = URL.createObjectURL(blob);

        let a = document.createElement('a');
        a.href = url;
        a.download = isEncrypt ? "encrypted.bin" : "decrypted.bin";
        a.click();
    };

    reader.readAsArrayBuffer(fileInput.files[0]);
}