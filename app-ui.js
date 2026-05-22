const AppUI = window.AppUI = {
    originalBuffer: null,
    stegoBuffer: null,
    originalFileName: "",

    audioPlayer: null,
    currentPlayingBtn: null,

    handleEmbedFileLoad: (event) => {
        const file = event.target.files[0];
        if (!file) return;
        AppUI.originalFileName = file.name;
        document.getElementById('embed-file-name').value = file.name;

        const reader = new FileReader();
        reader.onload = (e) => {
            AppUI.originalBuffer = e.target.result; // ArrayBuffer
            try {
                const wav = new WavProcessor(AppUI.originalBuffer.slice(0)); // Перевірка валідності
                const capacityBytes = Math.floor((wav.parsed.dataLength / 2) / 8);
                document.getElementById('embed-stats').innerHTML =
                    `Файл завантажено. Максимальна місткість: <span class="term-highlight">${capacityBytes} байт</span>.`;
            } catch (err) {
                document.getElementById('embed-stats').innerHTML = `<span class="term-rose">Помилка: ${err.message}</span>`;
                AppUI.originalBuffer = null;
            }
        };
        reader.readAsArrayBuffer(file);
    },

    handleExtractFileLoad: (event) => {
        const file = event.target.files[0];
        if (!file) return;
        document.getElementById('extract-file-name').value = file.name;

        const reader = new FileReader();
        reader.onload = (e) => {
            AppUI.stegoBuffer = e.target.result;
        };
        reader.readAsArrayBuffer(file);
    },

    executeEmbedding: () => {
        if (!AppUI.originalBuffer) return alert("Оберіть оригінальний аудіофайл.");
        const secretText = document.getElementById('embed-secret-text').value;
        if (!secretText) return alert("Введіть повідомлення для приховування.");

        const password = document.getElementById('embed-password').value;

        try {
            // Копіюємо буфер, щоб не зіпсувати оригінал у пам'яті
            const bufferCopy = AppUI.originalBuffer.slice(0);
            const processor = new WavProcessor(bufferCopy);

            const result = AudioStegoService.embed(processor, secretText, password);
            AppUI.stegoBuffer = bufferCopy; // Зберігаємо для графіків

            const usedBytes = result.usedBits / 8;
            const capacityBytes = result.capacityBits / 8;
            const percent = ((usedBytes / capacityBytes) * 100).toFixed(4);

            document.getElementById('embed-stats').innerHTML = `
                        <div style="color: var(--accent-mint); font-weight: bold; margin-bottom: 0.5rem;">[+] Операція успішна</div>
                        <div>> Використано: <span class="term-highlight">${result.usedBits} біт (${usedBytes} байт)</span></div>
                        <div>> Загальна місткість: ${result.capacityBits} біт (${capacityBytes} байт)</div>
                        <div>> Файл заповнено на: <span class="term-amber">${percent}%</span></div>
                    `;

            // Збереження файлу
            const link = document.createElement("a");
            link.href = URL.createObjectURL(result.blob);
            link.download = "stego_" + AppUI.originalFileName;
            link.click();

        } catch (err) {
            alert("Помилка кодування: " + err.message);
        }
    },

    executeExtraction: () => {
        if (!AppUI.stegoBuffer) return alert("Оберіть стего-файл.");
        const password = document.getElementById('extract-password').value;

        try {
            const processor = new WavProcessor(AppUI.stegoBuffer.slice(0));
            const extracted = AudioStegoService.extract(processor, password);

            document.getElementById('extract-terminal').value = extracted;
        } catch (err) {
            alert("Помилка декодування: " + err.message);
        }
    },

    drawWaveforms: () => {
        if (!AppUI.originalBuffer || !AppUI.stegoBuffer) {
            return alert("Для порівняння потрібно спочатку завантажити оригінал і виконати вбудовування!");
        }

        // Виставляємо розмір canvas під ширину контейнера
        const canvases = document.querySelectorAll('canvas.waveform');
        canvases.forEach(c => {
            c.width = c.parentElement.clientWidth - 2; // мінус border
            c.height = 120;
        });

        const origWav = new WavProcessor(AppUI.originalBuffer.slice(0));
        const stegoWav = new WavProcessor(AppUI.stegoBuffer.slice(0));

        WaveformVisualizer.drawWaveform('canvas-orig', origWav.getInt16AudioData(), '#3b82f6');
        WaveformVisualizer.drawWaveform('canvas-stego', stegoWav.getInt16AudioData(), '#14b8a6');
        WaveformVisualizer.drawDifference('canvas-diff', origWav.getInt16AudioData(), stegoWav.getInt16AudioData());
    },

    // Аудіо плеєр
    togglePlayOriginal: () => { AppUI.playAudioBuffer(AppUI.originalBuffer, 'btn-play-orig'); },
    togglePlayStego: () => { AppUI.playAudioBuffer(AppUI.stegoBuffer, 'btn-play-stego'); },

    playAudioBuffer: (buffer, btnId) => {
        if (!buffer) return alert("Аудіо недоступне.");

        const btn = document.getElementById(btnId);

        // Якщо вже грає поточний, зупиняємо
        if (AppUI.currentPlayingBtn === btn) {
            AppUI.stopAudio();
            return;
        }

        AppUI.stopAudio(); // Зупиняємо будь-який інший

        const blob = new Blob([buffer], { type: "audio/wav" });
        AppUI.audioPlayer = new Audio(URL.createObjectURL(blob));

        AppUI.audioPlayer.onended = () => { AppUI.stopAudio(); };

        AppUI.audioPlayer.play();
        btn.classList.add('playing');
        btn.textContent = '⏹';
        AppUI.currentPlayingBtn = btn;
    },

    stopAudio: () => {
        if (AppUI.audioPlayer) {
            AppUI.audioPlayer.pause();
            AppUI.audioPlayer = null;
        }
        if (AppUI.currentPlayingBtn) {
            AppUI.currentPlayingBtn.classList.remove('playing');
            AppUI.currentPlayingBtn.textContent = '▶';
            AppUI.currentPlayingBtn = null;
        }
    }
};