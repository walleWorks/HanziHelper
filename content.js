function loadStyles() {
  const link = document.createElement('link');
  link.href = chrome.runtime.getURL('styles.css');
  link.type = 'text/css';
  link.rel = 'stylesheet';
  document.head.appendChild(link);
}

loadStyles();

let characterData = null;
let currentUtterance = null;
let writer;  // 声明一个全局变量来存储HanziWriter实例

// 加载JSON数据
async function loadCharacterData() {
  try {
    const response = await fetch(chrome.runtime.getURL('word.json'));
    characterData = await response.json();
    console.log('Character data loaded successfully');
  } catch (error) {
    console.error('Error loading character data:', error);
  }
}

// 在扩展加载时立即加载数据
loadCharacterData();

// 朗读文本
async function speakText(text, isEnglish = false) {
  if ('speechSynthesis' in window) {
    // 如果有正在进行的朗读，先停止它
    if (currentUtterance) {
      speechSynthesis.cancel();
    }

    // 加载保存的设置
    chrome.storage.sync.get({
      selectedChineseVoice: 0,
      selectedEnglishVoice: 0,
      rate: 1,
      pitch: 1
    }, function(items) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = isEnglish ? 'en-US' : 'zh-CN';
      utterance.rate = parseFloat(items.rate);
      utterance.pitch = parseFloat(items.pitch);
      
      // 获取可用的声音
      const voices = speechSynthesis.getVoices();
      const selectedVoiceIndex = isEnglish ? items.selectedEnglishVoice : items.selectedChineseVoice;
      const availableVoices = voices.filter(voice => voice.lang.includes(isEnglish ? 'en' : 'zh'));
      
      if (availableVoices[selectedVoiceIndex]) {
        utterance.voice = availableVoices[selectedVoiceIndex];
      }

      currentUtterance = utterance;
      speechSynthesis.speak(utterance);
    });
  } else {
    console.log('Text-to-speech not supported in this browser.');
  }
}

// 停止朗读
function stopSpeaking() {
  if (currentUtterance) {
    speechSynthesis.cancel();
    currentUtterance = null;
  }
}

// 修改事件监听器，排除已经弹出的信息框
document.addEventListener('mouseup', function(event) {
  console.log('Mouse up event triggered');
  if (event.target.closest('.char-info-popup')) {
    console.log('Click inside existing popup, ignoring');
    return;
  }

  const selectedText = window.getSelection().toString().trim();
  console.log('Selected text:', selectedText);
  if (selectedText.length === 1 && /[\u4e00-\u9fa5]/.test(selectedText)) {
    console.log('Valid Chinese character selected');
    showInfoPopup(selectedText);
  } else {
    console.log('Not a single Chinese character');
  }
});

function getCharInfo(character) {
  if (!characterData) {
    console.error('Character data not loaded yet');
    return null;
  }

  const charInfo = characterData.find(item => item.word === character);
  if (!charInfo) {
    console.error('Character not found:', character);
    return null;
  }

  return {
    pinyin: charInfo.pinyin,
    strokes: charInfo.strokes,
    radicals: charInfo.radicals,
    translation: charInfo.translation || 'Translation not available'
  };
}

// 修改showInfoPopup函数,移除停止朗读按钮
async function showInfoPopup(character) {
  console.log('showInfoPopup called with character:', character);
  const info = getCharInfo(character);
  if (!info) {
    console.log('No info found for character');
    return;
  }

  console.log('Character info:', info);

  // Remove any existing popups
  const existingPopup = document.querySelector('.char-info-popup');
  if (existingPopup) {
    existingPopup.remove();
  }

  const popup = document.createElement('div');
  popup.className = 'char-info-popup';
  popup.innerHTML = `
    <h3>${character}</h3>
    <p><strong data-i18n="pinyin"></strong>: ${info.pinyin} <span class="speaker-icon" data-text="${character}">🔊</span></p>
    <p><strong data-i18n="strokes"></strong>: ${info.strokes}</p>
    <p><strong data-i18n="radicals"></strong>: ${info.radicals}</p>
    <p><strong data-i18n="english"></strong>: ${info.translation} <span class="speaker-icon" data-text="${info.translation}">🔊</span></p>
    <div id="character-target-div"></div>
  `;

  // Position the popup
  const selection = window.getSelection();
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  
  const popupWidth = 300; // Estimate the popup width
  const popupHeight = 200; // Estimate the popup height
  
  let left = rect.left + window.scrollX;
  let top = rect.bottom + window.scrollY;

  // Check if the popup would go off the right edge of the viewport
  if (left + popupWidth > window.innerWidth) {
    left = window.innerWidth - popupWidth - 10; // 10px margin
  }

  // Check if the popup would go off the bottom edge of the viewport
  if (top + popupHeight > window.innerHeight) {
    top = rect.top - popupHeight + window.scrollY;
  }

  popup.style.left = `${left}px`;
  popup.style.top = `${top}px`;

  document.body.appendChild(popup);
  console.log('Popup appended to body');

  // Translate the popup content
  translatePopup(popup);

  // Add event listeners for speaker icons
  const speakerIcons = popup.querySelectorAll('.speaker-icon');
  speakerIcons.forEach(icon => {
    icon.addEventListener('click', function() {
      const text = this.getAttribute('data-text');
      const isEnglish = this.previousElementSibling.textContent.includes(chrome.i18n.getMessage("english"));
      speakText(text, isEnglish);
    });
  });

  // Add event listener for clicking outside the popup
  document.addEventListener('mousedown', function closePopup(e) {
    if (!popup.contains(e.target)) {
      popup.remove();
      document.removeEventListener('mousedown', closePopup);
    }
  });

  // Initialize HanziWriter
  if (typeof HanziWriter !== 'undefined') {
    HanziWriter.create('character-target-div', character, {
      width: 100,
      height: 100,
      padding: 0,
      strokeColor: '#4CAF50',
      showOutline: true,
      strokeAnimationSpeed: 1,
      delayBetweenStrokes: 50,
      drawingWidth: 2,
      showCharacter: false
    }).animateCharacter();
  } else {
    console.log('HanziWriter is not defined');
  }
}

function translatePopup(popup) {
  const elementsToTranslate = popup.querySelectorAll('[data-i18n]');
  elementsToTranslate.forEach(element => {
    const key = element.getAttribute('data-i18n');
    element.textContent = chrome.i18n.getMessage(key) || key;
  });
}

function speakCharacter(character) {
  const utterance = new SpeechSynthesisUtterance(character);
  utterance.lang = 'zh-CN'; // Set language to Chinese

  // Use saved TTS settings
  chrome.storage.sync.get({
    selectedVoice: 0,
    rate: 1,
    pitch: 1
  }, function(items) {
    if (availableVoices && availableVoices.length > items.selectedVoice) {
      utterance.voice = availableVoices[items.selectedVoice];
    }
    utterance.rate = items.rate;
    utterance.pitch = items.pitch;
    
    speechSynthesis.speak(utterance);
  });
}

let availableVoices = [];

function loadVoices() {
  availableVoices = speechSynthesis.getVoices().filter(voice => voice.lang.includes('zh'));
}

speechSynthesis.onvoiceschanged = loadVoices;
loadVoices();

// 确保在文档加载完成后初始语音合成
document.addEventListener('DOMContentLoaded', function() {
  if ('speechSynthesis' in window) {
    speechSynthesis.onvoiceschanged = function() {
      // 语音列表已加载，可以在这里执行其他初始化操作
    };
  }
});

if ('speechSynthesis' in window) {
  speechSynthesis.onvoiceschanged = function() {
    console.log('Voices loaded:', speechSynthesis.getVoices());
  };
}