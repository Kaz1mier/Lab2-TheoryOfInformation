function cleanBinary(str) {
    return str.replace(/[^01]/g, '');
}

document.addEventListener("DOMContentLoaded", () => {
    const seedInput = document.getElementById("seed");
    const counter = document.getElementById("seedCount");
    const fileInput = document.getElementById('fileInput');
    const encryptBtn = document.getElementById('encryptBtn');
    const decryptBtn = document.getElementById('decryptBtn');
    const inputBitsField = document.getElementById('inputBits');
    const keyBitsField = document.getElementById('keyBits');
    const outputBitsField = document.getElementById('outputBits');


    function clearBitFields() {
        if (inputBitsField) inputBitsField.value = '';
        if (keyBitsField) keyBitsField.value = '';
        if (outputBitsField) outputBitsField.value = '';
    }

    function updateButtonsState() {
        const seed = cleanBinary(seedInput.value);
        const isSeedValid = seed.length === 24;
        const isFileSelected = fileInput.files.length > 0;

        if (encryptBtn) {
            encryptBtn.disabled = !(isSeedValid && isFileSelected);
        }
        if (decryptBtn) {
            decryptBtn.disabled = !(isSeedValid && isFileSelected);
        }
    }

    seedInput.addEventListener("input", () => {
        let value = seedInput.value.replace(/[^01]/g, '');

        if (value.length > 24) {
            value = value.slice(0, 24);
        }
        if (value.length < 24) {
            counter.style.color = "red";
        } else {
            counter.style.color = "lightgreen";
        }
        seedInput.value = value;
        counter.textContent = `${value.length} / 24`;

        clearBitFields();

        updateButtonsState();
    });

    if (fileInput) {
        fileInput.addEventListener('change', () => {
            clearBitFields();
            updateButtonsState();
        });
    }

    updateButtonsState();
});

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

    reader.onload = async function(e) {
        try {
            let bytes = new Uint8Array(e.target.result);
            let inputBits = bytesToBits(bytes);
            let key = generateLFSR(seed, inputBits.length);
            let outputBits = xorBits(inputBits, key);

            document.getElementById('inputBits').value = inputBits.join('');
            document.getElementById('keyBits').value = key.join('');
            document.getElementById('outputBits').value = outputBits.join('');

            let outBytes = bitsToBytes(outputBits);
            let blob = new Blob([outBytes]);
            let originalFileName = fileInput.files[0].name;
            let prefix = isEncrypt ? "enc_" : "dec_";
            let suggestedFileName = prefix + originalFileName;

            let fileExtension = originalFileName.includes('.') ?
                originalFileName.split('.').pop() : '';

            if ('showSaveFilePicker' in window) {
                try {
                    const opts = {
                        suggestedName: suggestedFileName,
                        types: [{
                            description: 'All Files',
                            accept: {
                                'application/octet-stream': ['.bin', '.dat', fileExtension ? `.${fileExtension}` : ''].filter(ext => ext)
                            }
                        }]
                    };

                    const fileHandle = await window.showSaveFilePicker(opts);
                    const writable = await fileHandle.createWritable();
                    await writable.write(blob);
                    await writable.close();
                } catch (err) {
                    if (err.name !== 'AbortError') {
                        console.error('Ошибка сохранения:', err);
                        alert(`Ошибка сохранения: ${err.message || 'Неизвестная ошибка'}`);
                    }
                }
            } else {
                let url = URL.createObjectURL(blob);
                let a = document.createElement('a');
                a.href = url;
                a.download = suggestedFileName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                setTimeout(() => URL.revokeObjectURL(url), 100);
            }
        } catch (error) {
            console.error('Общая ошибка:', error);
            alert(`Ошибка обработки: ${error.message}`);
        }
    };

    reader.readAsArrayBuffer(fileInput.files[0]);
}