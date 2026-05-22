const WaveformVisualizer = window.WaveformVisualizer = {
    drawWaveform: (canvasId, int16Data, colorHex) => {
        const canvas = document.getElementById(canvasId);
        const ctx = canvas.getContext('2d', { alpha: false });

        // Для швидкодії, якщо аудіо велике, беремо лише частину для візуалізації
        const renderLimit = Math.min(int16Data.length, 5000000);
        const step = Math.ceil(renderLimit / canvas.width);
        const amp = canvas.height / 2;

        ctx.fillStyle = '#070a12';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = colorHex;

        ctx.beginPath();
        ctx.moveTo(0, amp);

        for (let i = 0; i < canvas.width; i++) {
            let min = 1.0;
            let max = -1.0;

            for (let j = 0; j < step; j++) {
                const datum = int16Data[(i * step) + j];
                if (datum !== undefined) {
                    const val = datum / 32768.0; // Нормалізація 16-bit
                    if (val < min) min = val;
                    if (val > max) max = val;
                }
            }

            ctx.fillRect(i, amp + (min * amp), 1, Math.max(1, (max - min) * amp));
        }
    },

    drawDifference: (canvasId, origData, stegoData) => {
        const canvas = document.getElementById(canvasId);
        const ctx = canvas.getContext('2d', { alpha: false });

        const renderLimit = Math.min(origData.length, 5000000);
        const step = Math.ceil(renderLimit / canvas.width);
        const amp = canvas.height / 2;

        ctx.fillStyle = '#070a12';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#e11d48'; // Rose

        for (let i = 0; i < canvas.width; i++) {
            let maxDiff = 0;
            for (let j = 0; j < step; j++) {
                const idx = (i * step) + j;
                if (idx < renderLimit) {
                    const diff = Math.abs(stegoData[idx] - origData[idx]);
                    if (diff > maxDiff) maxDiff = diff;
                }
            }
            // Різниця LSB становить максимум 1, тому множимо на масштаб для видимості
            const diffHeight = Math.max(1, maxDiff * 40);
            ctx.fillRect(i, amp - (diffHeight / 2), 1, diffHeight);
        }
    }
};