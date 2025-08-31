// Global variables
let currentMorseCode = '';
let audioContext;
let isPlaying = false;

// Character counter
document.addEventListener('DOMContentLoaded', function() {
    const inputText = document.getElementById('inputText');
    const charCount = document.getElementById('charCount');
    
    inputText.addEventListener('input', function() {
        charCount.textContent = this.value.length;
        updateAllResults();
    });
    
    // Add click-to-copy functionality to all output boxes
    const outputBoxes = document.querySelectorAll('.output-box');
    outputBoxes.forEach(box => {
        box.addEventListener('click', function() {
            if (this.textContent.trim() && !this.textContent.includes('will appear here')) {
                copyToClipboard(this.textContent);
                showCopyFeedback(this);
            }
        });
    });
});

// Morse code mapping
const morseCode = {
    'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.',
    'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..',
    'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.',
    'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
    'Y': '-.--', 'Z': '--..', '0': '-----', '1': '.----', '2': '..---',
    '3': '...--', '4': '....-', '5': '.....', '6': '-....', '7': '--...',
    '8': '---..', '9': '----.', ' ': '/', '.': '.-.-.-', ',': '--..--',
    '?': '..--..', "'": '.----.', '!': '-.-.--', '/': '-..-.', '(': '-.--.',
    ')': '-.--.-', '&': '.-...', ':': '---...', ';': '-.-.-.', '=': '-...-',
    '+': '.-.-.', '-': '-....-', '_': '..--.-', '"': '.-..-.', '$': '...-..-',
    '@': '.--.-.'
};

// Clear input function
function clearInput() {
    document.getElementById('inputText').value = '';
    document.getElementById('charCount').textContent = '0';
    
    // Clear all outputs
    const outputBoxes = document.querySelectorAll('.output-box');
    outputBoxes.forEach(box => {
        const defaultTexts = {
            'translationOutput': 'Translation will appear here...',
            'morseOutput': 'Morse code will appear here...',
            'binaryOutput': 'Binary code will appear here...',
            'hexOutput': 'Hexadecimal code will appear here...',
            'base64Output': 'Base64 encoded text will appear here...',
            'asciiOutput': 'ASCII values will appear here...',
            'rot13Output': 'ROT13 encoded text will appear here...',
            'urlOutput': 'URL encoded text will appear here...'
        };
        
        box.textContent = defaultTexts[box.id] || 'Output will appear here...';
        box.classList.remove('success', 'error', 'copied');
    });
    
    document.getElementById('allResults').textContent = 'Convert some text to see all results here...';
    currentMorseCode = '';
}

// Copy to clipboard function
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (err) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        return successful;
    }
}

// Show copy feedback
function showCopyFeedback(element) {
    element.classList.add('copied');
    setTimeout(() => {
        element.classList.remove('copied');
    }, 2000);
}

// Language translation (using a free translation API)
async function translateText() {
    const text = document.getElementById('inputText').value.trim();
    const targetLang = document.getElementById('targetLanguage').value;
    const output = document.getElementById('translationOutput');
    
    if (!text) {
        output.textContent = 'Please enter some text to translate.';
        output.classList.add('error');
        setTimeout(() => output.classList.remove('error'), 3000);
        return;
    }
    
    output.classList.add('loading');
    output.textContent = 'Translating...';
    
    try {
        // Using MyMemory Translation API (free tier)
        const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${targetLang}`);
        const data = await response.json();
        
        if (data.responseStatus === 200) {
            output.textContent = data.responseData.translatedText;
            output.classList.add('success');
            setTimeout(() => output.classList.remove('success'), 3000);
        } else {
            throw new Error('Translation failed');
        }
    } catch (error) {
        output.textContent = 'Translation service unavailable. Please try again later.';
        output.classList.add('error');
        setTimeout(() => output.classList.remove('error'), 3000);
    } finally {
        output.classList.remove('loading');
        updateAllResults();
    }
}

// Convert to Morse code
function convertToMorse() {
    const text = document.getElementById('inputText').value.trim().toUpperCase();
    const output = document.getElementById('morseOutput');
    
    if (!text) {
        output.textContent = 'Please enter some text to convert.';
        output.classList.add('error');
        setTimeout(() => output.classList.remove('error'), 3000);
        return;
    }
    
    let morse = '';
    for (let char of text) {
        if (morseCode[char]) {
            morse += morseCode[char] + ' ';
        } else if (char === ' ') {
            morse += '/ ';
        } else {
            morse += '? '; // Unknown character
        }
    }
    
    currentMorseCode = morse.trim();
    output.textContent = currentMorseCode;
    output.classList.add('success');
    setTimeout(() => output.classList.remove('success'), 3000);
    updateAllResults();
}

// Play Morse code audio
async function playMorse() {
    if (!currentMorseCode || isPlaying) return;
    
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        isPlaying = true;
        
        const playBtn = document.getElementById('playMorseBtn');
        playBtn.innerHTML = '<i class="fas fa-stop"></i> Playing...';
        playBtn.disabled = true;
        
        const dotDuration = 100; // milliseconds
        const dashDuration = 300;
        const gapDuration = 100;
        const letterGapDuration = 300;
        const wordGapDuration = 700;
        
        let currentTime = audioContext.currentTime;
        
        for (let i = 0; i < currentMorseCode.length; i++) {
            const char = currentMorseCode[i];
            
            if (char === '.') {
                playTone(600, currentTime, dotDuration / 1000);
                currentTime += (dotDuration + gapDuration) / 1000;
            } else if (char === '-') {
                playTone(600, currentTime, dashDuration / 1000);
                currentTime += (dashDuration + gapDuration) / 1000;
            } else if (char === ' ') {
                currentTime += letterGapDuration / 1000;
            } else if (char === '/') {
                currentTime += wordGapDuration / 1000;
            }
        }
        
        setTimeout(() => {
            isPlaying = false;
            playBtn.innerHTML = '<i class="fas fa-play"></i> Play Audio';
            playBtn.disabled = false;
        }, currentTime * 1000);
        
    } catch (error) {
        console.error('Audio not supported:', error);
        isPlaying = false;
        const playBtn = document.getElementById('playMorseBtn');
        playBtn.innerHTML = '<i class="fas fa-play"></i> Play Audio';
        playBtn.disabled = false;
    }
}

function playTone(frequency, startTime, duration) {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    
    oscillator.start(startTime);
    oscillator.stop(startTime + duration);
}

// Convert to binary
function convertToBinary() {
    const text = document.getElementById('inputText').value.trim();
    const output = document.getElementById('binaryOutput');
    
    if (!text) {
        output.textContent = 'Please enter some text to convert.';
        output.classList.add('error');
        setTimeout(() => output.classList.remove('error'), 3000);
        return;
    }
    
    let binary = '';
    for (let i = 0; i < text.length; i++) {
        const charCode = text.charCodeAt(i);
        const binaryChar = charCode.toString(2).padStart(8, '0');
        binary += binaryChar + ' ';
    }
    
    output.textContent = binary.trim();
    output.classList.add('success');
    setTimeout(() => output.classList.remove('success'), 3000);
    updateAllResults();
}

// Convert to hexadecimal
function convertToHex() {
    const text = document.getElementById('inputText').value.trim();
    const output = document.getElementById('hexOutput');
    
    if (!text) {
        output.textContent = 'Please enter some text to convert.';
        output.classList.add('error');
        setTimeout(() => output.classList.remove('error'), 3000);
        return;
    }
    
    let hex = '';
    for (let i = 0; i < text.length; i++) {
        const charCode = text.charCodeAt(i);
        const hexChar = charCode.toString(16).toUpperCase().padStart(2, '0');
        hex += hexChar + ' ';
    }
    
    output.textContent = hex.trim();
    output.classList.add('success');
    setTimeout(() => output.classList.remove('success'), 3000);
    updateAllResults();
}

// Convert to Base64
function convertToBase64() {
    const text = document.getElementById('inputText').value.trim();
    const output = document.getElementById('base64Output');
    
    if (!text) {
        output.textContent = 'Please enter some text to convert.';
        output.classList.add('error');
        setTimeout(() => output.classList.remove('error'), 3000);
        return;
    }
    
    try {
        const base64 = btoa(unescape(encodeURIComponent(text)));
        output.textContent = base64;
        output.classList.add('success');
        setTimeout(() => output.classList.remove('success'), 3000);
    } catch (error) {
        output.textContent = 'Error encoding to Base64.';
        output.classList.add('error');
        setTimeout(() => output.classList.remove('error'), 3000);
    }
    
    updateAllResults();
}

// Convert to ASCII values
function convertToASCII() {
    const text = document.getElementById('inputText').value.trim();
    const output = document.getElementById('asciiOutput');
    
    if (!text) {
        output.textContent = 'Please enter some text to convert.';
        output.classList.add('error');
        setTimeout(() => output.classList.remove('error'), 3000);
        return;
    }
    
    let ascii = '';
    for (let i = 0; i < text.length; i++) {
        const charCode = text.charCodeAt(i);
        ascii += `${text[i]}: ${charCode}\n`;
    }
    
    output.textContent = ascii.trim();
    output.classList.add('success');
    setTimeout(() => output.classList.remove('success'), 3000);
    updateAllResults();
}

// Convert to ROT13
function convertToROT13() {
    const text = document.getElementById('inputText').value.trim();
    const output = document.getElementById('rot13Output');
    
    if (!text) {
        output.textContent = 'Please enter some text to convert.';
        output.classList.add('error');
        setTimeout(() => output.classList.remove('error'), 3000);
        return;
    }
    
    let rot13 = '';
    for (let i = 0; i < text.length; i++) {
        let char = text[i];
        if (char >= 'A' && char <= 'Z') {
            rot13 += String.fromCharCode(((char.charCodeAt(0) - 65 + 13) % 26) + 65);
        } else if (char >= 'a' && char <= 'z') {
            rot13 += String.fromCharCode(((char.charCodeAt(0) - 97 + 13) % 26) + 97);
        } else {
            rot13 += char;
        }
    }
    
    output.textContent = rot13;
    output.classList.add('success');
    setTimeout(() => output.classList.remove('success'), 3000);
    updateAllResults();
}

// Convert to URL encoding
function convertToURL() {
    const text = document.getElementById('inputText').value.trim();
    const output = document.getElementById('urlOutput');
    
    if (!text) {
        output.textContent = 'Please enter some text to convert.';
        output.classList.add('error');
        setTimeout(() => output.classList.remove('error'), 3000);
        return;
    }
    
    const urlEncoded = encodeURIComponent(text);
    output.textContent = urlEncoded;
    output.classList.add('success');
    setTimeout(() => output.classList.remove('success'), 3000);
    updateAllResults();
}

// Update all results summary
function updateAllResults() {
    const text = document.getElementById('inputText').value.trim();
    const allResultsDiv = document.getElementById('allResults');
    
    if (!text) {
        allResultsDiv.textContent = 'Convert some text to see all results here...';
        return;
    }
    
    // Get all current outputs
    const outputs = {
        'Original Text': text,
        'Translation': document.getElementById('translationOutput').textContent,
        'Morse Code': document.getElementById('morseOutput').textContent,
        'Binary': document.getElementById('binaryOutput').textContent,
        'Hexadecimal': document.getElementById('hexOutput').textContent,
        'Base64': document.getElementById('base64Output').textContent,
        'ASCII Values': document.getElementById('asciiOutput').textContent,
        'ROT13': document.getElementById('rot13Output').textContent,
        'URL Encoded': document.getElementById('urlOutput').textContent
    };
    
    let allResults = '';
    for (const [type, result] of Object.entries(outputs)) {
        if (result && !result.includes('will appear here') && !result.includes('Please enter') && !result.includes('Translation service')) {
            allResults += `=== ${type} ===\n${result}\n\n`;
        }
    }
    
    allResultsDiv.textContent = allResults || 'Convert some text to see all results here...';
}

// Copy all results
async function copyAllResults() {
    const allResults = document.getElementById('allResults').textContent;
    
    if (allResults && !allResults.includes('Convert some text')) {
        const success = await copyToClipboard(allResults);
        const button = document.querySelector('.copy-all-btn');
        
        if (success) {
            const originalHTML = button.innerHTML;
            button.innerHTML = '<i class="fas fa-check"></i> Copied!';
            button.style.background = 'linear-gradient(135deg, #48bb78, #38a169)';
            
            setTimeout(() => {
                button.innerHTML = originalHTML;
                button.style.background = 'linear-gradient(135deg, #805ad5, #9f7aea)';
            }, 2000);
        }
    }
}

// Auto-convert functions for real-time updates
function autoConvertAll() {
    const text = document.getElementById('inputText').value.trim();
    if (!text) return;
    
    // Auto-convert non-API dependent conversions
    convertToMorse();
    convertToBinary();
    convertToHex();
    convertToBase64();
    convertToASCII();
    convertToROT13();
    convertToURL();
}

// Enhanced input listener for real-time conversion
document.addEventListener('DOMContentLoaded', function() {
    const inputText = document.getElementById('inputText');
    let timeout;
    
    inputText.addEventListener('input', function() {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            if (this.value.trim()) {
                autoConvertAll();
            }
        }, 500); // Debounce for 500ms
    });
});

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + Enter to translate
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        translateText();
    }
    
    // Ctrl/Cmd + Shift + C to clear
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        clearInput();
    }
    
    // Ctrl/Cmd + Shift + A to copy all
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        copyAllResults();
    }
});

// Additional language options (you can extend this list)
const languageNames = {
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'it': 'Italian',
    'pt': 'Portuguese',
    'ru': 'Russian',
    'ja': 'Japanese',
    'ko': 'Korean',
    'zh': 'Chinese (Simplified)',
    'ar': 'Arabic',
    'hi': 'Hindi',
    'th': 'Thai',
    'vi': 'Vietnamese',
    'tr': 'Turkish',
    'pl': 'Polish',
    'nl': 'Dutch',
    'sv': 'Swedish',
    'da': 'Danish',
    'no': 'Norwegian',
    'fi': 'Finnish'
};

// Alternative translation service (in case primary fails)
async function fallbackTranslate(text, targetLang) {
    try {
        // Using LibreTranslate (if available)
        const response = await fetch('https://libretranslate.com/translate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                q: text,
                source: 'en',
                target: targetLang,
                format: 'text'
            })
        });
        
        const data = await response.json();
        return data.translatedText;
    } catch (error) {
        throw new Error('Fallback translation failed');
    }
}

// Enhanced binary conversion with different formats
function convertToBinaryAdvanced() {
    const text = document.getElementById('inputText').value.trim();
    const output = document.getElementById('binaryOutput');
    
    if (!text) {
        output.textContent = 'Please enter some text to convert.';
        output.classList.add('error');
        setTimeout(() => output.classList.remove('error'), 3000);
        return;
    }
    
    let result = 'Space-separated: ';
    for (let i = 0; i < text.length; i++) {
        const charCode = text.charCodeAt(i);
        const binaryChar = charCode.toString(2).padStart(8, '0');
        result += binaryChar + ' ';
    }
    
    result += '\n\nContinuous: ';
    for (let i = 0; i < text.length; i++) {
        const charCode = text.charCodeAt(i);
        const binaryChar = charCode.toString(2).padStart(8, '0');
        result += binaryChar;
    }
    
    output.textContent = result;
    output.classList.add('success');
    setTimeout(() => output.classList.remove('success'), 3000);
    updateAllResults();
}

// Add tooltips and help text
function addTooltips() {
    const cards = document.querySelectorAll('.converter-card');
    
    const tooltips = {
        0: 'Translate text to different languages using online translation services',
        1: 'Convert text to Morse code with audio playback capability',
        2: 'Convert text to binary (base-2) representation',
        3: 'Convert text to hexadecimal (base-16) representation',
        4: 'Encode text using Base64 encoding',
        5: 'Show ASCII decimal values for each character',
        6: 'Apply ROT13 cipher (rotate each letter by 13 positions)',
        7: 'URL encode text for safe use in web addresses'
    };
    
    cards.forEach((card, index) => {
        if (tooltips[index]) {
            card.title = tooltips[index];
        }
    });
}

// Initialize tooltips when page loads
document.addEventListener('DOMContentLoaded', addTooltips);

// Error handling for network requests
window.addEventListener('online', function() {
    console.log('Connection restored');
});

window.addEventListener('offline', function() {
    console.log('Connection lost - some features may not work');
});

// Performance optimization: debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Apply debouncing to auto-convert
const debouncedAutoConvert = debounce(autoConvertAll, 300);
