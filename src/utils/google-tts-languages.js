const _languages = [
    { code: "af-ZA",       name: "Afrikaans" },
    { code: "sq",          name: "Albanian" },
    { code: "ar-AE",       name: "Arabic" },
    { code: "hy",          name: "Armenian" },
    { code: "bn-BD",       name: "Bengali (Bangladesh)" },
    { code: "bn-IN",       name: "Bengali (India)" },
    { code: "bs",          name: "Bosnian" },
    { code: "my",          name: "Burmese (Myanmar)" },
    { code: "ca-ES",       name: "Catalan" },
    { code: "cmn-Hant-TW", name: "Chinese" },
    { code: "hr-HR",       name: "Croatian" },
    { code: "cs-CZ",       name: "Czech" },
    { code: "da-DK",       name: "Danish" },
    { code: "nl-NL",       name: "Dutch" },
    { code: "en-AU",       name: "English (Australia)" },
    { code: "en-GB",       name: "English (United Kingdom)" },
    { code: "en-US",       name: "English" },
    { code: "eo",          name: "Esperanto" },
    { code: "et",          name: "Estonian" },
    { code: "fil-PH",      name: "Filipino" },
    { code: "fi-FI",       name: "Finnish" },
    { code: "fr-FR",       name: "French" },
    { code: "fr-CA",       name: "French (Canada)" },
    { code: "de-DE",       name: "German" },
    { code: "el-GR",       name: "Greek" },
    { code: "gu",          name: "Gujarati" },
    { code: "hi-IN",       name: "Hindi" },
    { code: "hu-HU",       name: "Hungarian" },
    { code: "is-IS",       name: "Icelandic" },
    { code: "id-ID",       name: "Indonesian" },
    { code: "it-IT",       name: "Italian" },
    { code: "ja-JP",       name: "Japanese (Japan)" },
    { code: "kn",          name: "Kannada" },
    { code: "km",          name: "Khmer" },
    { code: "ko-KR",       name: "Korean" },
    { code: "la",          name: "Latin" },
    { code: "lv",          name: "Latvian" },
    { code: "mk",          name: "Macedonian" },
    { code: "ml",          name: "Malayalam" },
    { code: "mr",          name: "Marathi" },
    { code: "ne",          name: "Nepali" },
    { code: "nb-NO",       name: "Norwegian" },
    { code: "pl-PL",       name: "Polish" },
    { code: "pt-BR",       name: "Portuguese" },
    { code: "ro-RO",       name: "Romanian" },
    { code: "ru-RU",       name: "Russian" },
    { code: "sr-RS",       name: "Serbian" },
    { code: "si",          name: "Sinhala" },
    { code: "sk-SK",       name: "Slovak" },
    { code: "es-MX",       name: "Spanish (Mexico)" },
    { code: "es-ES",       name: "Spanish (Spain)" },
    { code: "sw",          name: "Swahili" },
    { code: "sv-SE",       name: "Swedish" },
    { code: "ta",          name: "Tamil" },
    { code: "te",          name: "Telugu" },
    { code: "th-TH",       name: "Thai" },
    { code: "tr-TR",       name: "Turkish" },
    { code: "uk-UA",       name: "Ukrainian" },
    { code: "ur",          name: "Urdu" },
    { code: "vi-VN",       name: "Vietnamese" },
    { code: "cy",          name: "Welsh" }
];
  
function find(language) {
    return _languages.find(l => ((l.code.toLowerCase() === language.toLowerCase()) || (l.name.toLowerCase() === language.toLowerCase())));
}

function list() {
    return _languages;
}

const languages = [];
languages.find = find.bind(languages);
languages.list = list.bind(languages);
module.exports = languages;