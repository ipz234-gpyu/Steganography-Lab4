class WavProcessor {
    constructor(arrayBuffer) {
        this.buffer = arrayBuffer;
        this.dataView = new DataView(arrayBuffer);
        this.parsed = this.parseHeader();
    }

    parseHeader() {
        const dv = this.dataView;

        // Перевірка RIFF
        if (this.readString(0, 4) !== 'RIFF') throw new Error("Не валідний WAV файл (немає RIFF).");
        if (this.readString(8, 4) !== 'WAVE') throw new Error("Не валідний WAV файл (немає WAVE).");

        let offset = 12;
        let format = null;
        let dataOffset = -1;
        let dataLength = -1;

        while (offset < dv.byteLength) {
            const chunkId = this.readString(offset, 4);
            const chunkSize = dv.getUint32(offset + 4, true);

            if (chunkId === 'fmt ') {
                format = {
                    audioFormat: dv.getUint16(offset + 8, true),
                    numChannels: dv.getUint16(offset + 10, true),
                    sampleRate: dv.getUint32(offset + 12, true),
                    bitsPerSample: dv.getUint16(offset + 22, true)
                };
            } else if (chunkId === 'data') {
                dataOffset = offset + 8;
                dataLength = chunkSize;
                break; // Data chunk знайдено
            }
            offset += 8 + chunkSize;
        }

        if (!format || dataOffset === -1) throw new Error("Файл пошкоджено (не знайдено fmt або data).");
        if (format.audioFormat !== 1 || format.bitsPerSample !== 16) {
            throw new Error("Підтримуються тільки 16-бітні PCM WAV файли.");
        }

        return { format, dataOffset, dataLength };
    }

    readString(offset, length) {
        let str = '';
        for (let i = 0; i < length; i++) str += String.fromCharCode(this.dataView.getUint8(offset + i));
        return str;
    }

    // Повертає Uint8Array суто з аудіоданими для модифікації LSB
    getAudioDataBuffer() {
        return new Uint8Array(this.buffer, this.parsed.dataOffset, this.parsed.dataLength);
    }

    // Повертає 16-бітні семпли для малювання графіків
    getInt16AudioData() {
        return new Int16Array(this.buffer, this.parsed.dataOffset, this.parsed.dataLength / 2);
    }

    createModifiedBlob(newAudioDataView) {
        // newAudioDataView - це модифікований Uint8Array. 
        // Оскільки він ділить буфер з оригіналом (якщо ми модифікували in-place), ми можемо просто повернути весь буфер.
        return new Blob([this.buffer], { type: "audio/wav" });
    }
}

window.WavProcessor = WavProcessor;