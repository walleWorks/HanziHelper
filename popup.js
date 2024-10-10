let characterData = null;

// Load character data
async function loadCharacterData() {
  try {
    const response = await fetch(chrome.runtime.getURL('word.json'));
    characterData = await response.json();
    console.log('Character data loaded successfully');
  } catch (error) {
    console.error('Error loading character data:', error);
  }
}

// Display character information
function displayCharInfo(character) {
  const info = getCharInfo(character);
  if (!info) return;

  const charInfoDiv = document.getElementById('character-info');
  charInfoDiv.innerHTML = `
    <h3>${character}</h3>
    <p><strong data-i18n="pinyin"></strong>: ${info.pinyin} <span class="speaker-icon" data-text="${character}">🔊</span></p>
    <p><strong data-i18n="strokes"></strong>: ${info.strokes}</p>
    <p><strong data-i18n="radicals"></strong>: ${info.radicals}</p>
    <p><strong data-i18n="english"></strong>: ${info.translation} <span class="speaker-icon" data-text="${info.translation}">🔊</span></p>
  `;

  translatePage(); // 翻译新添加的内容

  // 为喇叭图标添加点击事件
  const speakerIcons = charInfoDiv.querySelectorAll('.speaker-icon');
  speakerIcons.forEach(icon => {
    icon.addEventListener('click', function() {
      const text = this.getAttribute('data-text');
      const isEnglish = this.previousElementSibling.textContent.includes('英文');
      speakText(text, isEnglish);
    });
  });

  const animationDiv = document.getElementById('character-animation');
  animationDiv.innerHTML = '';
  if (typeof HanziWriter !== 'undefined') {
    HanziWriter.create('character-animation', character, {
      width: 100,
      height: 100,
      padding: 5,
      strokeColor: '#4CAF50',
      showOutline: true,
      strokeAnimationSpeed: 1,
      delayBetweenStrokes: 50,
      drawingWidth: 2,
      showCharacter: false
    }).animateCharacter();
  }
}

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

function speakText(text, isEnglish = false) {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = isEnglish ? 'en-US' : 'zh-CN';
    
    // 从存储中获取保存的语音设置
    chrome.storage.sync.get({
      selectedChineseVoice: 0,
      selectedEnglishVoice: 0,
      rate: 1,
      pitch: 1
    }, function(items) {
      const voices = speechSynthesis.getVoices();
      const selectedVoiceIndex = isEnglish ? items.selectedEnglishVoice : items.selectedChineseVoice;
      const availableVoices = voices.filter(voice => voice.lang.includes(isEnglish ? 'en' : 'zh'));
      
      if (availableVoices[selectedVoiceIndex]) {
        utterance.voice = availableVoices[selectedVoiceIndex];
      }
      
      utterance.rate = parseFloat(items.rate);
      utterance.pitch = parseFloat(items.pitch);
      
      speechSynthesis.speak(utterance);
    });
  } else {
    console.log('Text-to-speech not supported in this browser.');
  }
}

function translatePage() {
  document.title = chrome.i18n.getMessage("extName");

  const elementsToTranslate = document.querySelectorAll('[data-i18n]');
  elementsToTranslate.forEach(element => {
    const key = element.getAttribute('data-i18n');
    element.textContent = chrome.i18n.getMessage(key) || key;
  });
}

function getMessage(key) {
  return chrome.i18n.getMessage(key) || key;
}


document.addEventListener('DOMContentLoaded', function() {
  loadCharacterData();
  translatePage();

  const input = document.getElementById('character-input');
  input.placeholder = chrome.i18n.getMessage("inputPlaceholder");

  input.addEventListener('keyup', function(event) {
    if (event.key === 'Enter') {
      const inputText = this.value.trim();
      const character = inputText.charAt(0); // Only take the first character
      if (/[\u4e00-\u9fa5]/.test(character)) {
        displayCharInfo(character);
        this.value = character; // Update input to show only the first character
      } else {
        alert(chrome.i18n.getMessage("invalidCharacter"));
      }
    }
  });

  // 添加关于-设置链接的事件监听器
  const aboutSettingsLink = document.getElementById('about-settings');
  aboutSettingsLink.textContent = chrome.i18n.getMessage("aboutSettings");
  aboutSettingsLink.addEventListener('click', function(e) {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  });
});

function switchLanguage(lang) {
  // 更新语言设置
  chrome.i18n.setLocale(lang);
  // 重新翻译页面
  translatePage();
  // 重新加载字符信息（如果有的话）
  const input = document.getElementById('character-input');
  if (input.value) {
    displayCharInfo(input.value);
  }
}
