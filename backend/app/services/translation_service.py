from typing import Dict, Optional
from app.core.config import settings
from concurrent.futures import ThreadPoolExecutor
import threading

try:
    import translators as ts
    TRANSLATORS_AVAILABLE = True
except ImportError:
    TRANSLATORS_AVAILABLE = False
    ts = None

try:
    from deep_translator import GoogleTranslator, single_detection
    DEEP_TRANSLATOR_AVAILABLE = True
except ImportError:
    DEEP_TRANSLATOR_AVAILABLE = False
    GoogleTranslator = None
    single_detection = None

try:
    from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
    import torch
    TRANSFORMERS_AVAILABLE = True
except ImportError:
    TRANSFORMERS_AVAILABLE = False
    AutoTokenizer = None
    AutoModelForSeq2SeqLM = None
    torch = None


class TranslationService:
    """Сервис для перевода текста"""
    
    def __init__(self):
        self.model = None
        self.tokenizer = None
        self.model_name = settings.NLLB_MODEL
        self.use_fast_translator = True
        
        self.language_codes = {
            "ru": "ru",
            "kk": "kk",
            "en": "en",
            "de": "de",
            "fr": "fr",
            "es": "es",
            "zh": "zh",
        }
        
        self.nllb_codes = {
            "ru": "rus_Cyrl",
            "kk": "kaz_Cyrl",
            "en": "eng_Latn",
            "de": "deu_Latn",
            "fr": "fra_Latn",
            "es": "spa_Latn",
            "zh": "zho_Hans",
            "it": "ita_Latn",
            "pt": "por_Latn",
            "ar": "arb_Arab",
            "tr": "tur_Latn",
            "auto": "eng_Latn",
        }
    
    def load_model(self):
        """Загрузка модели NLLB"""
        if not TRANSFORMERS_AVAILABLE:
            raise ImportError("Transformers не установлен. Установите: pip install transformers")
        if self.model is None or self.tokenizer is None:
            self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)
            self.model = AutoModelForSeq2SeqLM.from_pretrained(
                self.model_name,
                torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32
            )
            
            if torch.cuda.is_available():
                self.model = self.model.cuda()
            else:
                self.model = self.model.cpu()
            
            self.model.eval()
        return self.model, self.tokenizer
    
    def detect_language(self, text: str) -> str:
        """Определение языка текста"""
        cyrillic_chars = sum(1 for char in text if '\u0400' <= char <= '\u04FF')
        latin_chars = sum(1 for char in text if char.isalpha() and ord(char) < 128)
        
        if cyrillic_chars > latin_chars:
            if any(char in text for char in ['ә', 'ғ', 'қ', 'ң', 'ө', 'ұ', 'ү', 'һ', 'і']):
                return "kk"
            return "ru"
        return "en"
    
    def translate_fast(
        self,
        text: str,
        source_language: Optional[str] = None,
        target_language: str = "ru"
    ) -> str:
        """Перевод текста через внешний API"""
        if source_language == target_language:
            return text
        
        if TRANSLATORS_AVAILABLE:
            try:
                if source_language is None or source_language == "auto":
                    source_language = "auto"
                
                src_code = self.language_codes.get(source_language, "auto") if source_language != "auto" else "auto"
                tgt_code = self.language_codes.get(target_language, "ru")
                
                apis_to_try = ['google', 'bing', 'yandex']
                
                for api in apis_to_try:
                    try:
                        translated = ts.translate_text(
                            text,
                            translator=api,
                            from_language=src_code,
                            to_language=tgt_code,
                            timeout=10
                        )
                        if translated and translated != text:
                            return translated.strip()
                    except Exception:
                        continue
            except Exception:
                pass
        
        if DEEP_TRANSLATOR_AVAILABLE:
            try:
                if source_language is None:
                    source_language = self.detect_language(text)
                
                src_code = self.language_codes.get(source_language, "auto")
                tgt_code = self.language_codes.get(target_language, "ru")
                
                translator = GoogleTranslator(source=src_code, target=tgt_code)
                translated = translator.translate(text)
                return translated.strip()
            except Exception:
                pass
        
        return text
    
    def translate(
        self,
        text: str,
        source_language: Optional[str] = None,
        target_language: str = "ru"
    ) -> str:
        """Перевод текста на целевой язык"""
        if self.use_fast_translator and DEEP_TRANSLATOR_AVAILABLE:
            return self.translate_fast(text, source_language, target_language)
        else:
            return self.translate_slow(text, source_language, target_language)
    
    def translate_slow(
        self,
        text: str,
        source_language: Optional[str] = None,
        target_language: str = "ru"
    ) -> str:
        """Перевод текста через NLLB модель"""
        model, tokenizer = self.load_model()
        
        if source_language is None:
            source_language = self.detect_language(text)
        
        src_code = self.language_codes.get(source_language, "eng_Latn")
        tgt_code = self.language_codes.get(target_language, "rus_Cyrl")
        
        if source_language == target_language:
            return text
        
        tokenizer.src_lang = src_code
        tokenizer.tgt_lang = tgt_code
        
        tokenizer.set_src_lang_special_tokens(src_code)
        tokenizer.set_tgt_lang_special_tokens(tgt_code)
        
        inputs = tokenizer(text, return_tensors="pt", padding=True, truncation=True, max_length=512)
        
        if torch.cuda.is_available():
            inputs = {k: v.cuda() for k, v in inputs.items()}
            model = model.cuda()
        
        lang_id_map = {
            "rus_Cyrl": 256147,
            "kaz_Cyrl": 256089,
            "eng_Latn": 256047,
            "deu_Latn": 256006,
            "fra_Latn": 256007,
            "spa_Latn": 256008,
            "zho_Hans": 256010,
        }
        
        try:
            tokenizer.tgt_lang = tgt_code
            tokenizer.set_tgt_lang_special_tokens(tgt_code)
            encoded = tokenizer.encode("", add_special_tokens=True)
            if len(encoded) > 0:
                tgt_lang_id = encoded[0]
            else:
                tgt_lang_id = lang_id_map.get(tgt_code, 256147)
        except Exception:
            tgt_lang_id = lang_id_map.get(tgt_code, 256147)
        
        words = text.split()
        if len(words) > 100:
            text = " ".join(words[:100])
            inputs = tokenizer(text, return_tensors="pt", padding=True, truncation=True, max_length=256)
            if torch.cuda.is_available():
                inputs = {k: v.cuda() for k, v in inputs.items()}
        
        with torch.no_grad():
            generated_tokens = model.generate(
                **inputs,
                forced_bos_token_id=tgt_lang_id,
                max_length=min(80, len(text.split()) * 2),
                max_new_tokens=60,
                num_beams=1,
                early_stopping=True,
                do_sample=False,
            )
        
        translated_text = tokenizer.batch_decode(generated_tokens, skip_special_tokens=True)[0]
        
        return translated_text.strip()
    
    def translate_multiple(
        self,
        text: str,
        source_language: Optional[str] = None,
        target_languages: list = ["ru", "kk", "en"]
    ) -> Dict[str, str]:
        """Перевод текста на несколько языков"""
        translations = {}
        
        seen = set()
        unique_languages = []
        for lang in target_languages:
            if lang not in seen:
                seen.add(lang)
                unique_languages.append(lang)
        
        if not unique_languages:
            return translations
        
        if source_language is None:
            source_language = self.detect_language(text)
        
        languages_to_translate = []
        for target_lang in unique_languages:
            if source_language == target_lang:
                translations[target_lang] = text
            else:
                languages_to_translate.append(target_lang)
        
        if not languages_to_translate:
            return translations
        
        if TRANSLATORS_AVAILABLE:
            def translate_one_fast(target_lang: str, idx: int) -> tuple:
                try:
                    translated = self.translate_fast(text, source_language, target_lang)
                    return (target_lang, translated)
                except Exception:
                    return (target_lang, text)
            
            with ThreadPoolExecutor(max_workers=min(len(languages_to_translate), 5)) as executor:
                futures = [
                    executor.submit(translate_one_fast, lang, idx+1)
                    for idx, lang in enumerate(languages_to_translate)
                ]
                for future in futures:
                    target_lang, translated_text = future.result()
                    translations[target_lang] = translated_text
            
            return translations
        
        if not TRANSFORMERS_AVAILABLE:
            for target_lang in languages_to_translate:
                translations[target_lang] = text
            return translations
        
        words = text.split()
        if len(words) > 100:
            text = " ".join(words[:100])
        
        try:
            model, tokenizer = self.load_model()
        except Exception:
            for target_lang in languages_to_translate:
                translations[target_lang] = text
            return translations
        
        src_code = self.nllb_codes.get(source_language, "eng_Latn")
        tokenizer.src_lang = src_code
        tokenizer.set_src_lang_special_tokens(src_code)
        
        inputs = tokenizer(text, return_tensors="pt", padding=True, truncation=True, max_length=128)
        if torch.cuda.is_available():
            inputs = {k: v.cuda() for k, v in inputs.items()}
            model = model.cuda()
        
        def translate_one_optimized(target_lang: str, idx: int) -> tuple:
            try:
                tgt_code = self.nllb_codes.get(target_lang, "rus_Cyrl")
                
                tokenizer.tgt_lang = tgt_code
                tokenizer.set_tgt_lang_special_tokens(tgt_code)
                
                lang_id_map = {
                    "rus_Cyrl": 256147,
                    "kaz_Cyrl": 256089,
                    "eng_Latn": 256047,
                    "deu_Latn": 256006,
                    "fra_Latn": 256007,
                    "spa_Latn": 256008,
                    "zho_Hans": 256010,
                }
                tgt_lang_id = lang_id_map.get(tgt_code, 256147)
                
                with torch.no_grad():
                    generated_tokens = model.generate(
                        **inputs,
                        forced_bos_token_id=tgt_lang_id,
                        max_new_tokens=100,
                        num_beams=1,
                        do_sample=False,
                    )
                
                translated_text = tokenizer.batch_decode(generated_tokens, skip_special_tokens=True)[0]
                return (target_lang, translated_text.strip())
            except Exception:
                return (target_lang, text)
        
        with ThreadPoolExecutor(max_workers=min(len(languages_to_translate), 3)) as executor:
            futures = [
                executor.submit(translate_one_optimized, lang, idx+1)
                for idx, lang in enumerate(languages_to_translate)
            ]
            
            for future in futures:
                target_lang, translated_text = future.result()
                translations[target_lang] = translated_text
        
        return translations


translation_service = TranslationService()

