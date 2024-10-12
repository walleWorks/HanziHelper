window.onerror = function(message, source, lineno, colno, error) {
  console.error('Global error:', message, 'at', source, 'line', lineno, 'column', colno, 'Error object:', error);
};

function getMessage(key) {
  return chrome.i18n.getMessage(key) || key;
}

let availableChineseVoices = [];
let availableEnglishVoices = [];

// 加载可用的声音
function loadVoices() {
  const voices = speechSynthesis.getVoices();
  availableChineseVoices = voices.filter(voice => voice.lang.includes('zh'));
  availableEnglishVoices = voices.filter(voice => voice.lang.includes('en'));
  
  populateVoiceSelector('chinese-voice-selector', availableChineseVoices);
  populateVoiceSelector('english-voice-selector', availableEnglishVoices);
  
  loadSavedOptions();
  
  document.getElementById('chinese-voice-selector').previousElementSibling.textContent = getMessage("chineseVoice");
  document.getElementById('english-voice-selector').previousElementSibling.textContent = getMessage("englishVoice");
  document.getElementById('rate').previousElementSibling.textContent = getMessage("speechRate");
  document.getElementById('pitch').previousElementSibling.textContent = getMessage("speechPitch");
}

function populateVoiceSelector(selectorId, voices) {
  const voiceSelector = document.getElementById(selectorId);
  voiceSelector.innerHTML = '';
  voices.forEach((voice, index) => {
    const option = document.createElement('option');
    option.value = index;
    option.textContent = `${voice.name} (${voice.lang})`;
    voiceSelector.appendChild(option);
  });
}

// 加载保存的选项
function loadSavedOptions() {
  chrome.storage.sync.get({
    selectedChineseVoice: 0,
    selectedEnglishVoice: 0,
    rate: 1,
    pitch: 1
  }, function(items) {
    const elements = {
      'chinese-voice-selector': items.selectedChineseVoice,
      'english-voice-selector': items.selectedEnglishVoice,
      'rate': items.rate,
      'pitch': items.pitch,
      'pitch-value': items.pitch
    };

    for (const [id, value] of Object.entries(elements)) {
      const element = document.getElementById(id);
      if (element) {
        if (element.tagName === 'SELECT' || element.type === 'range') {
          element.value = value;
        } else {
          element.textContent = value;
        }
      }
    }
  });
}

// 保存选项
function saveOptions() {
  const selectedChineseVoice = document.getElementById('chinese-voice-selector').value;
  const selectedEnglishVoice = document.getElementById('english-voice-selector').value;
  const rate = document.getElementById('rate').value;
  const pitch = document.getElementById('pitch').value;
  
  chrome.storage.sync.set({
    selectedChineseVoice: selectedChineseVoice,
    selectedEnglishVoice: selectedEnglishVoice,
    rate: rate,
    pitch: pitch
  }, function() {
    const status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(function() {
      status.textContent = '';
    }, 750);
  });
}

// 更新显示的值
function updateValue(sliderId) {
  const slider = document.getElementById(sliderId);
  const output = document.getElementById(sliderId + '-value');
  output.textContent = slider.value;
}

document.addEventListener('DOMContentLoaded', loadVoices);
speechSynthesis.onvoiceschanged = loadVoices;
document.getElementById('save').addEventListener('click', saveOptions);
document.getElementById('rate').addEventListener('input', () => updateValue('rate'));
document.getElementById('pitch').addEventListener('input', () => updateValue('pitch'));

function openTab(evt, tabName) {
  var tabcontent = document.getElementsByClassName("tabcontent");
  for (var i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }
  var tablinks = document.getElementsByClassName("tablinks");
  for (var i = 0; i < tablinks.length; i++) {
    tablinks[i].classList.remove("active");
  }
  document.getElementById(tabName).style.display = "block";
  evt.currentTarget.classList.add("active");
}

// 添加这个函数来初始化页面
function initializePage() {
  loadVoices();
  document.getElementById('save').addEventListener('click', saveOptions);
  document.getElementById('rate').addEventListener('input', () => updateValue('rate'));
  document.getElementById('pitch').addEventListener('input', () => updateValue('pitch'));
  // 获取所有需要翻译的元素
  const elementsToTranslate = document.querySelectorAll('[data-i18n]');

  // 遍历元素并翻译
  elementsToTranslate.forEach(element => {
    const key = element.getAttribute('data-i18n');
    element.textContent = chrome.i18n.getMessage(key) || key;
  });

  // 为标签按钮添加事件监听器
  document.querySelectorAll('.tablinks').forEach(button => {
    button.addEventListener('click', (event) => openTab(event, event.target.getAttribute('data-tab')));
  });

  document.title = chrome.i18n.getMessage("settings");

}



// 确保 DOM 完全加载后再执行初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializePage);
} else {
  initializePage();
}

// 更新 UI 元素的文本
document.getElementById('save').textContent = getMessage("saveSettings");
document.querySelector('h1').textContent = getMessage("settings");
document.querySelector('h2').textContent = getMessage("aboutHanziHelper");

// 更新其他文本元素
// ...

// 如果有任何警告或错误消息，也要更新它们
function showStatus(message) {
  const status = document.getElementById('status');
  status.textContent = getMessage(message);
  // ... 其余代码保持不变
}

document.addEventListener('DOMContentLoaded', function() {
  // 获取所有需要翻译的元素
  const elementsToTranslate = document.querySelectorAll('[data-i18n]');
  
  // 遍历元素并翻译
  elementsToTranslate.forEach(element => {
    const key = element.getAttribute('data-i18n');
    element.textContent = chrome.i18n.getMessage(key);
  });
});

function setElementText(id, text) {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = text;
  } else {
    console.error('Element not found:', id);
  }
}

function setI18nText(id, messageKey) {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = chrome.i18n.getMessage(messageKey) || messageKey;
  } else {
    console.error('Element not found:', id);
  }
}

function updateUIText() {
  const elements = {
    'save': "saveSettings",
    'page-title': "settings",
    'basicSettings': "basicSettings",
    'about': "about",
    'voiceSettings': "voiceSettings"
  };

  for (const [id, messageKey] of Object.entries(elements)) {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = getMessage(messageKey);
    }
  }

  const h2Elements = document.querySelectorAll('h2');
  h2Elements.forEach(h2 => {
    const key = h2.getAttribute('data-i18n');
    if (key) {
      h2.textContent = getMessage(key);
    }
  });
}

document.addEventListener('DOMContentLoaded', function() {
  updateUIText();
  // Other initialization code...
});
