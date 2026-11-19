# Income3D

**EN** · [RU](#русский)

Interactive 3D "Actual vs Forecast" bar chart. **Vanilla JS + Canvas 2D, zero dependencies, works offline.** One file, ~44 KB (~15 KB gzipped), no build step. Designed for websites and Telegram Mini Apps.

- Drag to orbit, right-drag / Shift-drag to pan, wheel or pinch to zoom, tap a bar to select it, double-click to reset the view
- 3 themes: `navy`, `dark`, `light` · 4 colour presets: `amethyst`, `coral`, `emerald`, `classic` (or your own HEX colours)
- Frames are rendered only while something moves; the render loop sleeps when idle or when the chart is off-screen

## Install

```html
<script src="income3d.js"></script>
```

Or with a bundler / CommonJS: `const Income3D = require('./income3d.js');` (UMD, also exposes the global `Income3D`).

## Quick start

```html
<div id="chart" style="height:420px;border-radius:20px"></div>
<script src="income3d.js"></script>
<script>
  const chart = new Income3D('#chart', {
    data: [
      { period: 'Q1 2026', fact: 80,  forecast: 95 },
      { period: 'Q2 2026', fact: 110, forecast: 120 },
      { period: 'Q3 2026', fact: 150, forecast: 140 }
    ],
    theme: 'navy',        // navy | dark | light
    palette: 'amethyst',  // amethyst | coral | emerald | classic
    currency: 'USD'
  });
</script>
```

The container needs a height (CSS). If it has none, the chart uses a minimum of 240 px. The chart fills the container and follows its size.

## Data format

An array of rows. Each row is an object or an array:

```js
{ period: 'Q1 2026', fact: 80, forecast: 95, factor: 1 }
['Q1 2026', 80, 95, 1]          // [period, fact, forecast, factor]
```

| Field | Description |
|---|---|
| `period` | X-axis label (first 10 characters are shown) |
| `fact` | Actual value (number or numeric string) |
| `forecast` | Forecast value. May be `null` — the bar is empty and variance shows "—" |
| `factor` | Optional depth factor (Z axis), `0.3 … 3`, default `1` |

Values are in **thousands** of the data currency by default (set `thousands: false` for raw units).

## Options

| Option | Default | Description |
|---|---|---|
| `data` | `[]` | Rows, see above |
| `theme` | `'navy'` | `'navy'`, `'dark'`, `'light'` |
| `palette` | `'amethyst'` | `'amethyst'`, `'coral'`, `'emerald'`, `'classic'` or `{ fact:'#hex', forecast:'#hex' }` |
| `currency` | `'RUB'` | Display currency: `RUB`, `USD`, `EUR`, `TMT`, `PCT` (percent), or any code (shown as-is) |
| `dataCurrency` | = `currency` | Currency your numbers are in. If it differs from `currency`, values are converted |
| `rates` | built-in | Units of currency per 1 USD, e.g. `{ KZT: 480 }`. Merged with `{USD:1, RUB:90, EUR:0.92, TMT:19.5}` |
| `thousands` | `true` | Values are in thousands (adds "k" / "тыс." suffix) |
| `locale` | `'en'` | `'en'`, `'ru'`, `'tk'` (labels + number format); any other BCP-47 code formats numbers only |
| `labels` | – | Override texts: `{ fact, forecast, variance, k }` |
| `format` | – | `function(value, {currency, symbol, locale})` → string, custom value formatter |
| `mode` | `'all'` | `'all'`, `'bars'`, `'line'` |
| `pair` | `true` | `true` — bars side by side, `false` — overlay |
| `autoRotate` | `true` | Slow idle rotation |
| `hideFar` | `true` | Fade labels of distant bars |
| `legend` | `true` | Draw the Actual / Forecast legend (also included in PNG) |
| `tooltip` | `true` | Hover tooltip (mouse only) |
| `interactive` | `true` | Enable orbit / zoom / select. `false` = static picture, page scrolling is not blocked |
| `zoomOnWheel` | `true` | Mouse wheel zoom (set `false` to keep page scrolling over the chart) |
| `animate` | `true` | Bars grow on start |
| `background` | `true` | Theme background gradient (`false` = transparent canvas) |
| `maxValue` | auto | Fix the scale maximum (e.g. to compare charts) |
| `maxDPR` | `1.5` | Pixel-ratio cap (performance) |
| `font` | system-ui | Canvas font family |
| `ariaLabel` | `'3D chart'` | Accessible label |
| `onSelect` | – | `function(info, index)`; `info = { index, period, fact, forecast, variancePct }` or `null` when deselected |

## Methods

All setters return the chart, so calls can be chained.

| Method | Description |
|---|---|
| `updateData(data, { animate })` | Replace the data. Bars animate to the new values; `{animate:false}` jumps immediately |
| `playPresentation()` | Bars regrow one by one while the camera sweeps. Returns a `Promise` resolved at the end |
| `stopPresentation()` | Stop the presentation |
| `exportPNG({ download, filename, scale })` | Returns `Promise<Blob>`. `download: true` also saves the file |
| `toDataURL(scale)` | Synchronous PNG data URL |
| `setCameraView(view)` | `'front'`, `'back'`, `'right'`, `'left'`, `'top'`, `'bottom'` (orthographic), `'perspective'`, `'ortho'`, `'reset'` or `{ theta, phi, zoom, ortho }` (radians) |
| `setTheme(name)` | `'navy'`, `'dark'`, `'light'` |
| `setPalette(p)` | Preset name or `{ fact, forecast }` HEX colours |
| `setCurrency(code)` | Switch the display currency (converts if rates are known) |
| `setLocale(code)` | Switch language / number format |
| `setMode(mode)` | `'all'`, `'bars'`, `'line'` |
| `setPair(bool)` | Side by side / overlay |
| `setAutoRotate(bool)`, `setHideFar(bool)`, `setLegend(bool)` | Toggles |
| `select(index)` | Select a bar (`-1` / `null` clears) |
| `resize()` | Re-measure the container (done automatically via `ResizeObserver`) |
| `destroy()` | Remove the chart and its observers |

Static: `Income3D.themes`, `Income3D.palettes`, `Income3D.version`.

## Telegram Mini Apps & mobile

Downloads via `<a download>` are often blocked inside in-app browsers. Show the image instead and let the user long-press to save:

```js
document.querySelector('#shot').src = chart.toDataURL();   // <img id="shot">
```

Tips: use `interactive:false` if the chart must not capture touch scrolling; call `chart.resize()` after showing a hidden container.

## Browser support

Any modern browser with Canvas 2D and Pointer Events (Chrome / Edge 90+, Safari 14+, Firefox 90+, Telegram WebViews).

## License

MIT

---

# Русский

**[EN](#income3d)** · RU

Интерактивный 3D-график «Факт / Прогноз». **Чистый JS + Canvas 2D, без зависимостей, работает оффлайн.** Один файл (~44 КБ, ~15 КБ в gzip), сборка не нужна. Подходит для сайтов и Telegram Mini Apps.

- Вращение — перетаскиванием, сдвиг — правой кнопкой / Shift, масштаб — колесом или щипком, тап по столбцу — выбор, двойной клик — сброс вида
- 3 темы: `navy`, `dark`, `light` · 4 цветовых пресета: `amethyst`, `coral`, `emerald`, `classic` (или свои HEX-цвета)
- Кадры рисуются только при движении; в простое и за пределами экрана цикл отрисовки «спит»

## Установка

```html
<script src="income3d.js"></script>
```

Или через сборщик / CommonJS: `const Income3D = require('./income3d.js');` (UMD, также создаёт глобальный `Income3D`).

## Быстрый старт

```html
<div id="chart" style="height:420px;border-radius:20px"></div>
<script src="income3d.js"></script>
<script>
  const chart = new Income3D('#chart', {
    data: [
      { period: 'Q1 2026', fact: 80,  forecast: 95 },
      { period: 'Q2 2026', fact: 110, forecast: 120 },
      { period: 'Q3 2026', fact: 150, forecast: 140 }
    ],
    theme: 'navy',        // navy | dark | light
    palette: 'amethyst',  // amethyst | coral | emerald | classic
    currency: 'RUB',
    locale: 'ru'
  });
</script>
```

У контейнера должна быть высота (CSS). Если её нет, график займёт минимум 240 px. График заполняет контейнер и следит за его размером.

## Формат данных

Массив строк. Строка — объект или массив:

```js
{ period: 'Q1 2026', fact: 80, forecast: 95, factor: 1 }
['Q1 2026', 80, 95, 1]          // [период, факт, прогноз, фактор]
```

| Поле | Описание |
|---|---|
| `period` | Подпись по оси X (показываются первые 10 символов) |
| `fact` | Фактическое значение (число или числовая строка) |
| `forecast` | Прогноз. Может быть `null` — столбец пустой, отклонение «—» |
| `factor` | Необязательный фактор глубины (ось Z), `0.3 … 3`, по умолчанию `1` |

По умолчанию значения заданы в **тысячах** валюты данных (`thousands: false` — в обычных единицах).

## Параметры

| Параметр | По умолчанию | Описание |
|---|---|---|
| `data` | `[]` | Строки данных |
| `theme` | `'navy'` | `'navy'`, `'dark'`, `'light'` |
| `palette` | `'amethyst'` | `'amethyst'`, `'coral'`, `'emerald'`, `'classic'` или `{ fact:'#hex', forecast:'#hex' }` |
| `currency` | `'RUB'` | Валюта отображения: `RUB`, `USD`, `EUR`, `TMT`, `PCT` (проценты) или любой код (выводится как есть) |
| `dataCurrency` | = `currency` | Валюта ваших чисел. Если отличается от `currency` — значения пересчитываются |
| `rates` | встроенные | Единиц валюты за 1 $, например `{ KZT: 480 }`. Дополняют `{USD:1, RUB:90, EUR:0.92, TMT:19.5}` |
| `thousands` | `true` | Значения в тысячах (добавляется «тыс.» / «k») |
| `locale` | `'en'` | `'en'`, `'ru'`, `'tk'` (подписи + формат чисел); другой BCP-47 код меняет только формат чисел |
| `labels` | – | Свои тексты: `{ fact, forecast, variance, k }` |
| `format` | – | `function(value, {currency, symbol, locale})` → строка, свой формат значений |
| `mode` | `'all'` | `'all'`, `'bars'`, `'line'` |
| `pair` | `true` | `true` — столбцы рядом, `false` — наложение |
| `autoRotate` | `true` | Медленное вращение в покое |
| `hideFar` | `true` | Скрывать подписи дальних столбцов |
| `legend` | `true` | Легенда «Факт / Прогноз» (попадает и в PNG) |
| `tooltip` | `true` | Подсказка при наведении (только мышь) |
| `interactive` | `true` | Вращение / масштаб / выбор. `false` — статичная картинка, прокрутка страницы не блокируется |
| `zoomOnWheel` | `true` | Масштаб колесом (`false` — колесо прокручивает страницу) |
| `animate` | `true` | Рост столбцов при запуске |
| `background` | `true` | Фоновый градиент темы (`false` — прозрачный холст) |
| `maxValue` | авто | Зафиксировать максимум шкалы (например, для сравнения графиков) |
| `maxDPR` | `1.5` | Ограничение плотности пикселей (производительность) |
| `font` | system-ui | Шрифт на холсте |
| `ariaLabel` | `'3D chart'` | Подпись для скринридеров |
| `onSelect` | – | `function(info, index)`; `info = { index, period, fact, forecast, variancePct }` или `null` при снятии выбора |

## Методы

Все «сеттеры» возвращают график — вызовы можно цеплять цепочкой.

| Метод | Описание |
|---|---|
| `updateData(data, { animate })` | Заменить данные. Столбцы плавно меняют высоту; `{animate:false}` — мгновенно |
| `playPresentation()` | Столбцы вырастают по очереди, камера облетает сцену. Возвращает `Promise`, который завершается в конце |
| `stopPresentation()` | Остановить презентацию |
| `exportPNG({ download, filename, scale })` | Возвращает `Promise<Blob>`. `download: true` дополнительно скачивает файл |
| `toDataURL(scale)` | PNG в виде data URL (синхронно) |
| `setCameraView(view)` | `'front'`, `'back'`, `'right'`, `'left'`, `'top'`, `'bottom'` (ортогональные), `'perspective'`, `'ortho'`, `'reset'` или `{ theta, phi, zoom, ortho }` (радианы) |
| `setTheme(name)` | `'navy'`, `'dark'`, `'light'` |
| `setPalette(p)` | Имя пресета или HEX-цвета `{ fact, forecast }` |
| `setCurrency(code)` | Сменить валюту отображения (с пересчётом, если известны курсы) |
| `setLocale(code)` | Сменить язык / формат чисел |
| `setMode(mode)` | `'all'`, `'bars'`, `'line'` |
| `setPair(bool)` | Рядом / наложение |
| `setAutoRotate(bool)`, `setHideFar(bool)`, `setLegend(bool)` | Переключатели |
| `select(index)` | Выбрать столбец (`-1` / `null` — снять выбор) |
| `resize()` | Пересчитать размер (обычно автоматически через `ResizeObserver`) |
| `destroy()` | Удалить график и наблюдатели |

Статические свойства: `Income3D.themes`, `Income3D.palettes`, `Income3D.version`.

## Telegram Mini Apps и мобильные браузеры

Скачивание через `<a download>` во встроенных браузерах часто заблокировано. Покажите картинку — пользователь сохранит её долгим нажатием:

```js
document.querySelector('#shot').src = chart.toDataURL();   // <img id="shot">
```

Советы: `interactive:false`, если график не должен перехватывать прокрутку пальцем; вызывайте `chart.resize()` после показа скрытого контейнера.

## Поддержка браузеров

Любой современный браузер с Canvas 2D и Pointer Events (Chrome / Edge 90+, Safari 14+, Firefox 90+, WebView Telegram).

## Лицензия

MIT
