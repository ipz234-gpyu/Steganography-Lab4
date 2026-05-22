const AudioStegoService = window.AudioStegoService = {
    embed: (wavProcessor, secretText, password) => {
        const audioData = wavProcessor.getAudioDataBuffer();
        const totalSamples = Math.floor(audioData.byteLength / 2); // 16-bit = 2 bytes per sample

        // Додаємо EndOfMessageMarker (\0)
        const messageBits = StegoHelpers.textToBitArray(secretText + '\0');

        if (messageBits.length > totalSamples) {
            throw new Error(`Файл замалий. Потрібно семплів: ${messageBits.length}, є: ${totalSamples}`);
        }

        const indices = StegoHelpers.getSampleIndexSequence(totalSamples, password);

        for (let i = 0; i < messageBits.length; i++) {
            const sampleIndex = indices[i];
            const byteIndex = sampleIndex * 2; // Беремо молодший байт (Little Endian)

            if (messageBits[i] === 1) {
                audioData[byteIndex] |= 1;    // Встановити LSB в 1
            } else {
                audioData[byteIndex] &= 254;  // Встановити LSB в 0 (254 = 11111110)
            }
        }

        return {
            usedBits: messageBits.length,
            capacityBits: totalSamples,
            blob: wavProcessor.createModifiedBlob()
        };
    },

    extract: (wavProcessor, password) => {
        const audioData = wavProcessor.getAudioDataBuffer();
        const totalSamples = Math.floor(audioData.byteLength / 2);

        const indices = StegoHelpers.getSampleIndexSequence(totalSamples, password);

        const extractedBytes = [];
        let currentByte = 0;
        let collectedBits = 0;

        for (let i = 0; i < totalSamples; i++) {
            const sampleIndex = indices[i];
            const byteIndex = sampleIndex * 2;

            const extractedBit = audioData[byteIndex] & 1;
            currentByte = (currentByte << 1) | extractedBit;
            collectedBits++;

            if (collectedBits === 8) {
                if (currentByte === 0) break; // EndOfMessageMarker
                extractedBytes.push(currentByte);
                currentByte = 0;
                collectedBits = 0;
            }
        }

        return new TextDecoder("utf-8").decode(new Uint8Array(extractedBytes));
    }
};