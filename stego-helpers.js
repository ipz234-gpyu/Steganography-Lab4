const StegoHelpers = window.StegoHelpers = {
    textToBitArray: (text) => {
        const bytes = new TextEncoder().encode(text);
        const bits = new Uint8Array(bytes.length * 8);
        let bitIdx = 0;
        for (let i = 0; i < bytes.length; i++) {
            for (let j = 7; j >= 0; j--) {
                bits[bitIdx++] = ((bytes[i] >> j) & 1);
            }
        }
        return bits;
    },

    // Хешування строки для seed
    generateSeed: (str) => {
        let h = 1779033703 ^ str.length;
        for (let i = 0; i < str.length; i++) {
            h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
            h = (h << 13) | (h >>> 19);
        }
        h = Math.imul(h ^ (h >>> 16), 2246822507);
        h = Math.imul(h ^ (h >>> 13), 3266489909);
        return (h ^= h >>> 16) >>> 0;
    },

    // Генератор псевдовипадкових чисел Mulberry32
    mulberry32: (a) => {
        return function () {
            let t = a += 0x6D2B79F5;
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        }
    },

    // Генерація масиву індексів
    getSampleIndexSequence: (maxIndex, password) => {
        const indices = new Int32Array(maxIndex);
        for (let i = 0; i < maxIndex; i++) indices[i] = i;

        if (password && password.length > 0) {
            const seed = StegoHelpers.generateSeed(password);
            const prng = StegoHelpers.mulberry32(seed);
            // Алгоритм Фішера-Йєтса (Швидка та ефективна тасовка масиву індексів)
            for (let i = maxIndex - 1; i > 0; i--) {
                const j = Math.floor(prng() * (i + 1));
                const temp = indices[i];
                indices[i] = indices[j];
                indices[j] = temp;
            }
        }
        return indices;
    }
};