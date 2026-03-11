/**
 * Dicționar local de traduceri RO ↔ EN ↔ RU
 * Domeniu: mobilier, design interior, recenzii clienți
 * Fără API extern – traduceri naturale, nu mot-à-mot
 */

// ─── Dicționar de cuvinte și expresii ────────────────────────────────────────

const PHRASES_RO_EN = {
  // Nume de produse / descrieri galerie
  'camera copii': "Children's room",
  'cameră copii': "Children's room",
  'cameră de zi': 'Living room',
  'camera de zi': 'Living room',
  'living mobila': 'Living room furniture',
  'living mobilier': 'Living room furniture',
  'mobilier living': 'Living room furniture',
  'mobilier dormitor': 'Bedroom furniture',
  'mobilier bucătărie': 'Kitchen furniture',
  'mobilier birou': 'Office furniture',
  'mobilier baie': 'Bathroom furniture',
  'mobilier copii': "Children's furniture",
  'mobilier hol': 'Hallway furniture',
  'mobilier grădină': 'Garden furniture',
  'spațiu comercial': 'Commercial space',
  'spatiu comercial': 'Commercial space',
  'poza baie': 'Bathroom',
  'bucătărie modernă': 'Modern kitchen',
  'bucatarie moderna': 'Modern kitchen',
  'bucătărie clasică': 'Classic kitchen',
  'dormitor modern': 'Modern bedroom',
  'dormitor clasic': 'Classic bedroom',
  'living modern': 'Modern living room',
  'birou modern': 'Modern office',
  'baie modernă': 'Modern bathroom',
  'hol intrare': 'Entrance hall',
  'dulap dormitor': 'Bedroom wardrobe',
  'dulap hol': 'Hallway wardrobe',
  'set mobilier': 'Furniture set',
  'masă dining': 'Dining table',
  'masă de lucru': 'Work desk',
  'scaun birou': 'Office chair',
  'pat dormitor': 'Bedroom bed',
  'pat copii': "Children's bed",
  'comodă dormitor': 'Bedroom dresser',
  'noptieră dormitor': 'Bedroom nightstand',
  'raft perete': 'Wall shelf',
  'bibliotecă living': 'Living room bookcase',
  'mobilier la comandă': 'Custom furniture',
  'mobilier personalizat': 'Custom furniture',
  'mobilier pe comandă': 'Custom-made furniture',
  'proiect individual': 'Individual project',
  'țara de origine': 'Country of origin',
  'tara de origine': 'Country of origin',
  'formă bucătărie': 'Kitchen layout',
  'forma bucatarie': 'Kitchen layout',
  'material fațadă': 'Facade material',
  'material fasada': 'Facade material',
  'materiale fațadă': 'Facade materials',
  'material carcasă': 'Frame material',
  'material carcasa': 'Frame material',
  'sistem deschidere': 'Opening mechanism',
  'tip sertare': 'Drawer type',
  'tip sertare / glisiere': 'Drawer type / Slides',
  'termen de fabricare': 'Production time',
  'termen fabricare': 'Production time',
  'calitate superioară': 'Premium quality',
  'calitate înaltă': 'High quality',
  'calitate premium': 'Premium quality',
  'produs în moldova': 'Made in Moldova',
  'fabricat în moldova': 'Manufactured in Moldova',
  'la comandă': 'Custom-made',

  // Recenzii – fraze tipice
  'foarte mulțumit de calitate': 'Very satisfied with the quality',
  'foarte multumit de calitate': 'Very satisfied with the quality',
  'foarte mulțumită de calitate': 'Very satisfied with the quality',
  'mobilier frumos': 'Beautiful furniture',
  'mobilier de calitate': 'Quality furniture',
  'mobilier frumos si de calitate': 'Beautiful, quality furniture',
  'mobilier frumos și de calitate': 'Beautiful, quality furniture',
  'foarte mulțumit': 'Very satisfied',
  'foarte multumit': 'Very satisfied',
  'foarte mulțumită': 'Very satisfied',
  'foarte mulțumiți': 'Very satisfied',
  'sunt mulțumit': "I'm satisfied",
  'sunt mulțumită': "I'm satisfied",
  'suntem mulțumiți': "We're satisfied",
  'calitate excelentă': 'Excellent quality',
  'calitate bună': 'Good quality',
  'de calitate': 'quality',
  'recomand cu încredere': 'I highly recommend',
  'recomand cu incredere': 'I highly recommend',
  'le recomand': 'I recommend them',
  'îi recomand': 'I recommend them',
  'vă recomand': 'I recommend them',
  'cu mare plăcere': 'With great pleasure',
  'foarte profesioniști': 'Very professional',
  'foarte profesionist': 'Very professional',
  'echipă profesionistă': 'Professional team',
  'echipa profesionista': 'Professional team',
  'bună ziua': 'Hello',
  'buna ziua': 'Hello',
  'mulțumesc frumos': 'Thank you very much',
  'multumesc frumos': 'Thank you very much',
  'mulțumesc mult': 'Thank you very much',
  'pe viitor': 'In the future',
  'am comandat mobilier': 'I ordered furniture',
  'am comandat o bucătărie': 'I ordered a kitchen',
  'si sunt multumit': 'and I am satisfied',
  'și sunt mulțumit': 'and I am satisfied',
  'si sunt multumita': 'and I am satisfied',
  'și sunt mulțumită': 'and I am satisfied',
  'si suntem multumiti': 'and we are satisfied',
  'și suntem mulțumiți': 'and we are satisfied',
  'am comandat': 'I ordered',
  'am primit': 'I received',
  'a fost livrat': 'It was delivered',
  'a fost montat': 'It was installed',
  'livrare rapidă': 'Fast delivery',
  'livrare rapida': 'Fast delivery',
  'montaj rapid': 'Quick installation',
  'montaj profesional': 'Professional installation',
  'preț bun': 'Good price',
  'pret bun': 'Good price',
  'preț corect': 'Fair price',
  'pret corect': 'Fair price',
  'raport calitate preț': 'Quality-price ratio',
  'raport calitate-preț': 'Quality-price ratio',
  'totul a fost': 'Everything was',
  'mobilier de calitate': 'Quality furniture',
  'arată foarte bine': 'Looks great',
  'arata foarte bine': 'Looks great',
  'arată excelent': 'Looks excellent',
  'ne place foarte mult': 'We love it',
  'îmi place foarte mult': 'I love it',
  'nu am nicio problemă': 'No issues at all',
  'fără probleme': 'No issues',
  'în termen': 'On time',
  'la timp': 'On time',
  'conform așteptărilor': 'As expected',
  'a depășit așteptările': 'Exceeded expectations',
  'peste așteptări': 'Beyond expectations',
};

const PHRASES_RO_RU = {
  'camera copii': 'Детская комната',
  'cameră copii': 'Детская комната',
  'cameră de zi': 'Гостиная',
  'camera de zi': 'Гостиная',
  'living mobila': 'Мебель для гостиной',
  'living mobilier': 'Мебель для гостиной',
  'mobilier living': 'Мебель для гостиной',
  'mobilier dormitor': 'Мебель для спальни',
  'mobilier bucătărie': 'Кухонная мебель',
  'mobilier birou': 'Офисная мебель',
  'mobilier baie': 'Мебель для ванной',
  'mobilier copii': 'Детская мебель',
  'mobilier hol': 'Мебель для прихожей',
  'mobilier grădină': 'Садовая мебель',
  'spațiu comercial': 'Коммерческое помещение',
  'spatiu comercial': 'Коммерческое помещение',
  'poza baie': 'Ванная комната',
  'bucătărie modernă': 'Современная кухня',
  'bucatarie moderna': 'Современная кухня',
  'bucătărie clasică': 'Классическая кухня',
  'dormitor modern': 'Современная спальня',
  'dormitor clasic': 'Классическая спальня',
  'living modern': 'Современная гостиная',
  'birou modern': 'Современный офис',
  'baie modernă': 'Современная ванная',
  'hol intrare': 'Прихожая',
  'dulap dormitor': 'Шкаф для спальни',
  'dulap hol': 'Шкаф для прихожей',
  'set mobilier': 'Комплект мебели',
  'masă dining': 'Обеденный стол',
  'masă de lucru': 'Рабочий стол',
  'scaun birou': 'Офисное кресло',
  'pat dormitor': 'Кровать',
  'pat copii': 'Детская кровать',
  'comodă dormitor': 'Комод',
  'noptieră dormitor': 'Тумбочка',
  'raft perete': 'Настенная полка',
  'bibliotecă living': 'Книжный шкаф',
  'mobilier la comandă': 'Мебель на заказ',
  'mobilier personalizat': 'Мебель на заказ',
  'mobilier pe comandă': 'Мебель на заказ',
  'proiect individual': 'Индивидуальный проект',
  'țara de origine': 'Страна происхождения',
  'tara de origine': 'Страна происхождения',
  'formă bucătărie': 'Форма кухни',
  'forma bucatarie': 'Форма кухни',
  'material fațadă': 'Материал фасада',
  'material fasada': 'Материал фасада',
  'materiale fațadă': 'Материалы фасада',
  'material carcasă': 'Материал каркаса',
  'material carcasa': 'Материал каркаса',
  'sistem deschidere': 'Система открывания',
  'tip sertare': 'Тип ящиков',
  'tip sertare / glisiere': 'Тип ящиков / направляющие',
  'termen de fabricare': 'Срок изготовления',
  'termen fabricare': 'Срок изготовления',
  'calitate superioară': 'Высшее качество',
  'calitate înaltă': 'Высокое качество',
  'calitate premium': 'Премиальное качество',
  'produs în moldova': 'Произведено в Молдове',
  'fabricat în moldova': 'Произведено в Молдове',
  'la comandă': 'На заказ',

  'foarte mulțumit de calitate': 'Очень доволен качеством',
  'foarte multumit de calitate': 'Очень доволен качеством',
  'foarte mulțumită de calitate': 'Очень довольна качеством',
  'mobilier frumos': 'Красивая мебель',
  'mobilier de calitate': 'Качественная мебель',
  'mobilier frumos si de calitate': 'Красивая и качественная мебель',
  'mobilier frumos și de calitate': 'Красивая и качественная мебель',
  'foarte mulțumit': 'Очень доволен',
  'foarte multumit': 'Очень доволен',
  'foarte mulțumită': 'Очень довольна',
  'foarte mulțumiți': 'Очень довольны',
  'sunt mulțumit': 'Я доволен',
  'sunt mulțumită': 'Я довольна',
  'suntem mulțumiți': 'Мы довольны',
  'calitate excelentă': 'Отличное качество',
  'calitate bună': 'Хорошее качество',
  'de calitate': 'качественный',
  'recomand cu încredere': 'Рекомендую с уверенностью',
  'recomand cu incredere': 'Рекомендую с уверенностью',
  'le recomand': 'Рекомендую',
  'îi recomand': 'Рекомендую',
  'vă recomand': 'Рекомендую',
  'cu mare plăcere': 'С большим удовольствием',
  'foarte profesioniști': 'Очень профессиональны',
  'foarte profesionist': 'Очень профессионально',
  'echipă profesionistă': 'Профессиональная команда',
  'echipa profesionista': 'Профессиональная команда',
  'bună ziua': 'Добрый день',
  'buna ziua': 'Добрый день',
  'mulțumesc frumos': 'Большое спасибо',
  'multumesc frumos': 'Большое спасибо',
  'mulțumesc mult': 'Большое спасибо',
  'pe viitor': 'В будущем',
  'am comandat mobilier': 'Я заказал(а) мебель',
  'am comandat o bucătărie': 'Я заказал(а) кухню',
  'si sunt multumit': 'и я доволен',
  'și sunt mulțumit': 'и я доволен',
  'si sunt multumita': 'и я довольна',
  'și sunt mulțumită': 'и я довольна',
  'si suntem multumiti': 'и мы довольны',
  'și suntem mulțumiți': 'и мы довольны',
  'am comandat': 'Я заказал(а)',
  'am primit': 'Я получил(а)',
  'a fost livrat': 'Было доставлено',
  'a fost montat': 'Было установлено',
  'livrare rapidă': 'Быстрая доставка',
  'livrare rapida': 'Быстрая доставка',
  'montaj rapid': 'Быстрая установка',
  'montaj profesional': 'Профессиональная установка',
  'preț bun': 'Хорошая цена',
  'pret bun': 'Хорошая цена',
  'preț corect': 'Справедливая цена',
  'pret corect': 'Справедливая цена',
  'raport calitate preț': 'Соотношение цена-качество',
  'raport calitate-preț': 'Соотношение цена-качество',
  'totul a fost': 'Всё было',
  'mobilier de calitate': 'Качественная мебель',
  'arată foarte bine': 'Выглядит отлично',
  'arata foarte bine': 'Выглядит отлично',
  'arată excelent': 'Выглядит превосходно',
  'ne place foarte mult': 'Нам очень нравится',
  'îmi place foarte mult': 'Мне очень нравится',
  'nu am nicio problemă': 'Никаких проблем',
  'fără probleme': 'Без проблем',
  'în termen': 'В срок',
  'la timp': 'Вовремя',
  'conform așteptărilor': 'Как и ожидалось',
  'a depășit așteptările': 'Превзошло ожидания',
  'peste așteptări': 'Сверх ожиданий',
};

// Cuvinte individuale RO → EN
const WORDS_RO_EN = {
  'mobilier': 'Furniture', 'mobila': 'Furniture', 'mobilă': 'Furniture',
  'bucătărie': 'Kitchen', 'bucatarie': 'Kitchen',
  'dormitor': 'Bedroom', 'living': 'Living room',
  'birou': 'Office', 'baie': 'Bathroom',
  'hol': 'Hallway', 'copii': "Children's", 'grădină': 'Garden', 'gradina': 'Garden',
  'cameră': 'Room', 'camera': 'Room',
  'dulap': 'Wardrobe', 'comodă': 'Dresser', 'comoda': 'Dresser',
  'noptieră': 'Nightstand', 'noptiera': 'Nightstand',
  'masă': 'Table', 'masa': 'Table',
  'scaun': 'Chair', 'pat': 'Bed', 'raft': 'Shelf',
  'bibliotecă': 'Bookcase', 'biblioteca': 'Bookcase',
  'canapea': 'Sofa', 'fotoliu': 'Armchair',
  'oglindă': 'Mirror', 'oglinda': 'Mirror',
  'cuier': 'Coat rack', 'etajeră': 'Shelf unit', 'etajera': 'Shelf unit',
  'vitrină': 'Display cabinet', 'vitrina': 'Display cabinet',
  'modern': 'Modern', 'modernă': 'Modern', 'moderna': 'Modern',
  'clasic': 'Classic', 'clasică': 'Classic', 'clasica': 'Classic',
  'elegant': 'Elegant', 'elegantă': 'Elegant', 'eleganta': 'Elegant',
  'premium': 'Premium', 'lux': 'Luxury', 'luxos': 'Luxurious',
  'lemn': 'Wood', 'stejar': 'Oak', 'nuc': 'Walnut', 'frasin': 'Ash',
  'fag': 'Beech', 'mesteacăn': 'Birch', 'pin': 'Pine', 'cireș': 'Cherry',
  'mdf': 'MDF', 'pal': 'Particle board', 'placaj': 'Plywood',
  'sticlă': 'Glass', 'sticla': 'Glass', 'metal': 'Metal', 'oțel': 'Steel',
  'alb': 'White', 'negru': 'Black', 'gri': 'Grey', 'bej': 'Beige',
  'maro': 'Brown', 'roșu': 'Red', 'albastru': 'Blue', 'verde': 'Green',
  'crem': 'Cream', 'wenge': 'Wenge', 'antracit': 'Anthracite',
  'material': 'Material', 'culoare': 'Color', 'dimensiuni': 'Dimensions',
  'producător': 'Manufacturer', 'producator': 'Manufacturer',
  'produs': 'Product', 'proiect': 'Project',
  'tip': 'Type', 'formă': 'Shape', 'forma': 'Shape',
  'balamale': 'Hinges', 'mânere': 'Handles', 'manere': 'Handles',
  'blat': 'Countertop', 'glisiere': 'Slides', 'sertare': 'Drawers',
  'cornisă': 'Cornice', 'cornisa': 'Cornice',
  'calitate': 'Quality', 'excelent': 'Excellent', 'excelentă': 'Excellent',
  'bun': 'Good', 'bună': 'Good', 'bune': 'Good', 'buni': 'Good',
  'frumos': 'Beautiful', 'frumoasă': 'Beautiful', 'frumoasa': 'Beautiful',
  'mare': 'Large', 'mic': 'Small', 'nou': 'New', 'nouă': 'New',
  'mulțumit': 'Satisfied', 'multumit': 'Satisfied',
  'mulțumită': 'Satisfied', 'mulțumiți': 'Satisfied',
  'recomand': 'I recommend', 'recomandat': 'Recommended',
  'perfect': 'Perfect', 'impecabil': 'Impeccable',
  'livrare': 'Delivery', 'montaj': 'Installation', 'montare': 'Installation',
  'rapid': 'Fast', 'rapidă': 'Fast', 'rapida': 'Fast',
  'profesional': 'Professional', 'profesioniști': 'Professionals',
  'mulțumesc': 'Thank you', 'multumesc': 'Thank you',
  'moldova': 'Moldova', 'chișinău': 'Chișinău', 'chisinau': 'Chișinău',
  'foarte': 'Very', 'și': 'And', 'si': 'And',
  'cu': 'With', 'de': 'Of', 'în': 'In', 'la': 'At',
  'un': 'a', 'o': 'a', 'este': 'is', 'sunt': 'I am',
  'am': 'I have', 'a': 'has', 'fost': 'was', 'super': 'Super',
  'totul': 'Everything', 'nimic': 'Nothing', 'tot': 'All',
  'da': 'Yes', 'nu': 'No', 'test': 'Test',
  'regitratura': 'Reception desk', 'registratură': 'Reception desk',
  'registratura': 'Reception desk',
  'descriere': 'Description',
};

// Cuvinte individuale RO → RU
const WORDS_RO_RU = {
  'mobilier': 'Мебель', 'mobila': 'Мебель', 'mobilă': 'Мебель',
  'bucătărie': 'Кухня', 'bucatarie': 'Кухня',
  'dormitor': 'Спальня', 'living': 'Гостиная',
  'birou': 'Офис', 'baie': 'Ванная',
  'hol': 'Прихожая', 'copii': 'Детская', 'grădină': 'Сад', 'gradina': 'Сад',
  'cameră': 'Комната', 'camera': 'Комната',
  'dulap': 'Шкаф', 'comodă': 'Комод', 'comoda': 'Комод',
  'noptieră': 'Тумбочка', 'noptiera': 'Тумбочка',
  'masă': 'Стол', 'masa': 'Стол',
  'scaun': 'Стул', 'pat': 'Кровать', 'raft': 'Полка',
  'bibliotecă': 'Книжный шкаф', 'biblioteca': 'Книжный шкаф',
  'canapea': 'Диван', 'fotoliu': 'Кресло',
  'oglindă': 'Зеркало', 'oglinda': 'Зеркало',
  'cuier': 'Вешалка', 'etajeră': 'Стеллаж', 'etajera': 'Стеллаж',
  'vitrină': 'Витрина', 'vitrina': 'Витрина',
  'modern': 'Современный', 'modernă': 'Современная', 'moderna': 'Современная',
  'clasic': 'Классический', 'clasică': 'Классическая', 'clasica': 'Классическая',
  'elegant': 'Элегантный', 'elegantă': 'Элегантная', 'eleganta': 'Элегантная',
  'premium': 'Премиум', 'lux': 'Люкс', 'luxos': 'Роскошный',
  'lemn': 'Дерево', 'stejar': 'Дуб', 'nuc': 'Орех', 'frasin': 'Ясень',
  'fag': 'Бук', 'mesteacăn': 'Берёза', 'pin': 'Сосна', 'cireș': 'Вишня',
  'mdf': 'МДФ', 'pal': 'ДСП', 'placaj': 'Фанера',
  'sticlă': 'Стекло', 'sticla': 'Стекло', 'metal': 'Металл', 'oțel': 'Сталь',
  'alb': 'Белый', 'negru': 'Чёрный', 'gri': 'Серый', 'bej': 'Бежевый',
  'maro': 'Коричневый', 'roșu': 'Красный', 'albastru': 'Синий', 'verde': 'Зелёный',
  'crem': 'Кремовый', 'wenge': 'Венге', 'antracit': 'Антрацит',
  'material': 'Материал', 'culoare': 'Цвет', 'dimensiuni': 'Размеры',
  'producător': 'Производитель', 'producator': 'Производитель',
  'produs': 'Продукт', 'proiect': 'Проект',
  'tip': 'Тип', 'formă': 'Форма', 'forma': 'Форма',
  'balamale': 'Петли', 'mânere': 'Ручки', 'manere': 'Ручки',
  'blat': 'Столешница', 'glisiere': 'Направляющие', 'sertare': 'Ящики',
  'cornisă': 'Карниз', 'cornisa': 'Карниз',
  'calitate': 'Качество', 'excelent': 'Отлично', 'excelentă': 'Отличное',
  'bun': 'Хороший', 'bună': 'Хорошая', 'bune': 'Хорошие', 'buni': 'Хорошие',
  'frumos': 'Красиво', 'frumoasă': 'Красивая', 'frumoasa': 'Красивая',
  'mare': 'Большой', 'mic': 'Маленький', 'nou': 'Новый', 'nouă': 'Новая',
  'mulțumit': 'Довольный', 'multumit': 'Довольный',
  'mulțumită': 'Довольная', 'mulțumiți': 'Довольные',
  'recomand': 'Рекомендую', 'recomandat': 'Рекомендовано',
  'perfect': 'Идеально', 'impecabil': 'Безупречно',
  'livrare': 'Доставка', 'montaj': 'Монтаж', 'montare': 'Установка',
  'rapid': 'Быстро', 'rapidă': 'Быстрая', 'rapida': 'Быстрая',
  'profesional': 'Профессионально', 'profesioniști': 'Профессионалы',
  'mulțumesc': 'Спасибо', 'multumesc': 'Спасибо',
  'moldova': 'Молдова', 'chișinău': 'Кишинёв', 'chisinau': 'Кишинёв',
  'foarte': 'Очень', 'și': 'и', 'si': 'и',
  'cu': 'с', 'de': 'из', 'în': 'в', 'la': 'в',
  'un': '', 'o': '', 'este': 'это', 'sunt': 'я',
  'am': 'я', 'a': '', 'fost': 'был(а)', 'super': 'Супер',
  'totul': 'Всё', 'nimic': 'Ничего', 'tot': 'Всё',
  'da': 'Да', 'nu': 'Нет', 'test': 'Тест',
  'regitratura': 'Ресепшн', 'registratură': 'Ресепшн',
  'registratura': 'Ресепшн',
  'descriere': 'Описание',
};

// ─── Funcții de traducere ────────────────────────────────────────────────────

function normalizeRo(text) {
  return text
    .replace(/ă/g, 'a').replace(/Ă/g, 'A')
    .replace(/â/g, 'a').replace(/Â/g, 'A')
    .replace(/î/g, 'i').replace(/Î/g, 'I')
    .replace(/ș/g, 's').replace(/Ș/g, 'S')
    .replace(/ț/g, 't').replace(/Ț/g, 'T');
}

/**
 * Traduce un text din RO în limba țintă (en sau ru).
 * Prioritate: fraze lungi > fraze scurte > cuvinte > original
 */
function translateText(text, targetLang) {
  if (!text || typeof text !== 'string' || !text.trim()) return text || '';
  const trimmed = text.trim();

  const phrases = targetLang === 'en' ? PHRASES_RO_EN : PHRASES_RO_RU;
  const words = targetLang === 'en' ? WORDS_RO_EN : WORDS_RO_RU;

  // 1) Potrivire exactă (case-insensitive) pe tot textul
  const lower = trimmed.toLowerCase();
  if (phrases[lower]) return phrases[lower];

  const normalized = normalizeRo(lower);
  for (const [key, val] of Object.entries(phrases)) {
    if (normalizeRo(key) === normalized) return val;
  }

  // Dacă e un cuvânt singur
  if (!trimmed.includes(' ') && trimmed.length < 30) {
    if (words[lower]) return words[lower];
    const normWord = normalizeRo(lower);
    for (const [key, val] of Object.entries(words)) {
      if (normalizeRo(key) === normWord) return val;
    }
    return trimmed;
  }

  // 2) Înlocuiește frazele cu placeholder-e, apoi traduce cuvintele rămase
  let result = trimmed;
  const placeholders = [];
  const sortedPhrases = Object.entries(phrases).sort((a, b) => b[0].length - a[0].length);

  for (const [ro, translated] of sortedPhrases) {
    const regex = new RegExp(escapeRegex(ro), 'gi');
    result = result.replace(regex, () => {
      const idx = placeholders.length;
      placeholders.push(translated);
      return `\x00${idx}\x00`;
    });
  }

  // Cuvinte funcționale – nu se capitalizează în mijloc de propoziție
  const smallWords = targetLang === 'en'
    ? new Set(['of', 'and', 'in', 'at', 'with', 'a', 'the', 'is', 'are', 'was', 'has'])
    : new Set(['из', 'и', 'в', 'с', 'это', '']);

  const parts = result.split(/(\x00\d+\x00|\s+|[.,!?;:])/);
  let isFirst = true;
  result = parts.map((seg) => {
    if (!seg || /^\s+$/.test(seg) || /^[.,!?;:]$/.test(seg)) return seg;
    // Restaurează placeholder-e
    const phMatch = seg.match(/^\x00(\d+)\x00$/);
    if (phMatch) {
      const txt = placeholders[parseInt(phMatch[1], 10)];
      if (isFirst && txt) { isFirst = false; return txt.charAt(0).toUpperCase() + txt.slice(1); }
      isFirst = false;
      return txt;
    }

    const segLower = seg.toLowerCase();
    let w = words[segLower] ?? null;
    if (!w) {
      const norm = normalizeRo(segLower);
      for (const [key, val] of Object.entries(words)) {
        if (normalizeRo(key) === norm) { w = val; break; }
      }
    }
    if (w !== null) {
      if (isFirst) { isFirst = false; return w.charAt(0).toUpperCase() + w.slice(1); }
      isFirst = false;
      if (smallWords.has(w.toLowerCase())) return w.toLowerCase();
      if (seg[0] === seg[0].toUpperCase() && seg[0] !== seg[0].toLowerCase()) return w.charAt(0).toUpperCase() + w.slice(1);
      return w.toLowerCase();
    }
    isFirst = false;
    return seg;
  }).join('');

  return result.trim();
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Traduce un text RO → { ro, en, ru }
 */
export function translateToAll(text) {
  const trimmed = (text || '').trim();
  return {
    ro: trimmed,
    en: translateText(trimmed, 'en'),
    ru: translateText(trimmed, 'ru'),
  };
}

// ─── Dicționare inverse (construite automat) ────────────────────────────────

function buildReverse(dict) {
  const rev = {};
  for (const [k, v] of Object.entries(dict)) {
    const vLower = typeof v === 'string' ? v.toLowerCase() : '';
    if (vLower && !rev[vLower]) rev[vLower] = k;
  }
  return rev;
}

const PHRASES_EN_RO = buildReverse(PHRASES_RO_EN);
const PHRASES_RU_RO = buildReverse(PHRASES_RO_RU);
const WORDS_EN_RO = buildReverse(WORDS_RO_EN);
const WORDS_RU_RO = buildReverse(WORDS_RO_RU);

function reverseTranslate(text, fromLang) {
  if (!text || typeof text !== 'string' || !text.trim()) return text || '';
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();

  const phrases = fromLang === 'en' ? PHRASES_EN_RO : PHRASES_RU_RO;
  const words = fromLang === 'en' ? WORDS_EN_RO : WORDS_RU_RO;

  if (phrases[lower]) return phrases[lower];

  if (!trimmed.includes(' ') && trimmed.length < 30) {
    if (words[lower]) return words[lower];
    return trimmed;
  }

  let result = trimmed;
  const placeholders = [];
  const sortedPhrases = Object.entries(phrases).sort((a, b) => b[0].length - a[0].length);

  for (const [foreign, ro] of sortedPhrases) {
    const regex = new RegExp(escapeRegex(foreign), 'gi');
    result = result.replace(regex, () => {
      const idx = placeholders.length;
      placeholders.push(ro);
      return `\x00${idx}\x00`;
    });
  }

  const parts = result.split(/(\x00\d+\x00|\s+|[.,!?;:])/);
  result = parts.map((seg) => {
    if (!seg || /^\s+$/.test(seg) || /^[.,!?;:]$/.test(seg)) return seg;
    const phMatch = seg.match(/^\x00(\d+)\x00$/);
    if (phMatch) return placeholders[parseInt(phMatch[1], 10)];
    const segLower = seg.toLowerCase();
    if (words[segLower]) return words[segLower];
    return seg;
  }).join('');

  return result.trim();
}

/**
 * Detectează limba unui text pe baza caracterelor
 */
function detectLanguage(text) {
  if (!text) return 'ro';
  const cyrillic = (text.match(/[\u0400-\u04FF]/g) || []).length;
  const latin = (text.match(/[a-zA-Z]/g) || []).length;
  const romanian = (text.match(/[ăâîșțĂÂÎȘȚ]/g) || []).length;
  if (cyrillic > latin) return 'ru';
  if (romanian > 0) return 'ro';
  if (latin > 0) return 'en';
  return 'ro';
}

/**
 * Traduce text din orice limbă (ro/en/ru) în toate cele 3 limbi.
 * @param {string} text - textul original
 * @param {string} [sourceLang] - limba sursei ('ro', 'en', 'ru'). Dacă lipsește, se auto-detectează.
 */
export function translateFromAny(text, sourceLang) {
  const trimmed = (text || '').trim();
  if (!trimmed) return { ro: '', en: '', ru: '' };

  const lang = sourceLang || detectLanguage(trimmed);

  if (lang === 'ro') {
    return {
      ro: trimmed,
      en: translateText(trimmed, 'en'),
      ru: translateText(trimmed, 'ru'),
    };
  }

  if (lang === 'en') {
    const roText = reverseTranslate(trimmed, 'en');
    return {
      ro: roText,
      en: trimmed,
      ru: translateText(roText, 'ru'),
    };
  }

  if (lang === 'ru') {
    const roText = reverseTranslate(trimmed, 'ru');
    return {
      ro: roText,
      en: translateText(roText, 'en'),
      ru: trimmed,
    };
  }

  return { ro: trimmed, en: trimmed, ru: trimmed };
}

export { translateText, detectLanguage };

export default { translateToAll, translateText, translateFromAny, detectLanguage };
