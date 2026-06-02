/* =========================================================
   Cocktail Flavor Atlas — Interactive Recipe Grimoire
   Plain JS + D3 v7.
   ========================================================= */

(function () {
    'use strict';

    /* ----------------------- Constants ----------------------- */

    const DATA_URL = 'boston_cocktails.csv';

    // Each base-spirit "bucket" maps to one or more word-boundary regexes.
    // \b prevents false positives like "Ginger" matching "gin".
    const SPIRIT_CATEGORIES = {
        gin:     { label: 'Gin',     patterns: [/\bgin\b/i] },
        vodka:   { label: 'Vodka',   patterns: [/\bvodka\b/i] },
        rum:     { label: 'Rum',     patterns: [/\brum\b/i, /\brhum\b/i, /\bcacha[cç]a\b/i] },
        tequila: { label: 'Tequila', patterns: [/\btequila\b/i] },
        whiskey: { label: 'Whiskey', patterns: [/\bwhiske?y\b/i, /\bbourbon\b/i, /\brye\b/i, /\bscotch\b/i] },
        brandy:  { label: 'Brandy',  patterns: [/\bbrandy\b/i, /\bcognac\b/i, /\bapplejack\b/i, /\bcalvados\b/i, /\bpisco\b/i, /\barmagnac\b/i] },
        others:  { label: 'Liqueurs & Wine',  patterns: [] }
    };

    // Maps raw ingredient names (lowercased) to a canonical lowercased form.
    // Keeps the picker list short and deduplicated.
    const INGREDIENT_ALIASES = new Map([
        // === Rum family ===
        ['light rum', 'rum'], ['dark rum', 'rum'], ['white rum', 'rum'],
        ['gold rum', 'rum'], ['spiced rum', 'rum'], ['coconut rum', 'rum'],
        ['coconut-flavored rum', 'rum'], ['african rum', 'rum'],
        ['jamaica rum', 'rum'], ['bacardi rum', 'rum'], ['151-proof rum', 'rum'],
        ['mr. boston rum', 'rum'], ['old mr. boston rum', 'rum'],
        ['old mr. boston imported rum', 'rum'], ['light or dark rum', 'rum'],
        ['17-year-old j. wray and nephew ltd. rum', 'rum'],
        ['aged rhum agricole', 'rum'], ['cachaca', 'rum'],
        ['cachaca (brazilian rum)', 'rum'], ['batavia arrack or light rum', 'rum'],
        // === Gin family ===
        ['dry gin', 'gin'], ['old tom gin', 'gin'], ['mint-flavored gin', 'gin'],
        ['orange flavored gin', 'gin'], ['tanqueray gin', 'gin'],
        ['mr. boston gin', 'gin'], ['old mr. boston dry gin', 'gin'],
        ['old mr. boston orange flavored gin', 'gin'],
        ['sloe gin', 'gin'], ['old mr. boston sloe gin', 'gin'],
        // === Vodka family ===
        ['100-proof vodka', 'vodka'], ['mr. boston vodka', 'vodka'],
        ['old mr. boston vodka', 'vodka'], ['old mr. boston 100 proof vodka', 'vodka'],
        ['acai berry flavored vodka', 'vodka'], ['bison grass vodka (zubrowka)', 'vodka'],
        ['black cherry-flavored vodka', 'vodka'], ['cherry vodka', 'vodka'],
        ['citrus-flavored vodka', 'vodka'], ['grapefruit-flavored vodka', 'vodka'],
        ['lemon-flavored vodka', 'vodka'], ['lime vodka', 'vodka'],
        ['mango-flavored vodka', 'vodka'], ['old mr. boston grape vodka', 'vodka'],
        ['orange-flavored vodka', 'vodka'], ['peach-flavored vodka', 'vodka'],
        ['pear-flavored vodka', 'vodka'], ['raspberry-flavored vodka', 'vodka'],
        ['vanilla-flavored vodka', 'vodka'],
        // === Tequila / Mezcal family ===
        ['anejo tequila', 'tequila'], ['blanco tequila', 'tequila'],
        ['gold tequila', 'tequila'], ['jalapeno-infused tequila', 'tequila'],
        ['old mr. boston tequila', 'tequila'], ['reposado blanco tequila', 'tequila'],
        ['reposado tequila', 'tequila'], ['mezcal', 'tequila'],
        // === Whiskey family (including Scotch) ===
        ['blended whiskey', 'whiskey'], ['bourbon', 'whiskey'],
        ['bourbon or rye whiskey', 'whiskey'], ['bourbon whiskey', 'whiskey'],
        ['canadian whisky', 'whiskey'], ['georgia moon corn whiskey', 'whiskey'],
        ['irish whiskey', 'whiskey'], ['old mr. boston blended whiskey', 'whiskey'],
        ['old kentucky tavern bourbon whiskey', 'whiskey'],
        ['old thompson blended whiskey', 'whiskey'],
        ['rye or bourbon whiskey', 'whiskey'], ['rye whiskey', 'whiskey'],
        ['straight rye whiskey', 'whiskey'], ['straight rye whisky', 'whiskey'],
        ['tennessee whiskey', 'whiskey'], ['vanilla-infused bourbon', 'whiskey'],
        ['white whiskey', 'whiskey'], ['scotch', 'whiskey'],
        ['blended scotch whiskey', 'whiskey'], ['desmond & duff scotch whisky', 'whiskey'],
        ['scotch whiskey', 'whiskey'], ['single-malt scotch whisky', 'whiskey'],
        ['smoky scotch', 'whiskey'], ['smoky scotch whisky', 'whiskey'],
        ['rock and rye', 'whiskey'], ['old mr. boston rock and rye', 'whiskey'],
        // === Brandy family ===
        ['apple brandy', 'brandy'], ['apple flavored brandy', 'brandy'],
        ['applejack', 'brandy'], ['apricot flavored brandy', 'brandy'],
        ['apricot-flavored brandy', 'brandy'], ['armagnac', 'brandy'],
        ['blackberry-flavored brandy', 'brandy'], ['calvados', 'brandy'],
        ['cherry-flavored brandy', 'brandy'], ['coffee-flavored brandy', 'brandy'],
        ['cognac', 'brandy'], ['hennessy v.s cognac', 'brandy'],
        ['mr. boston apricot flavored brandy', 'brandy'],
        ['mr. boston five star brandy', 'brandy'],
        ['old mr. boston apricot flavored brandy', 'brandy'],
        ['old mr. boston five star brandy', 'brandy'],
        ['old mr. boston wild cherry flavored brandy', 'brandy'],
        ['peach-flavored brandy', 'brandy'], ['pear brandy', 'brandy'],
        ['pisco', 'brandy'], ['vs cognac', 'brandy'],
        // === Juices ===
        ['fresh lemon juice', 'lemon juice'], ['juice of a lemon', 'lemon juice'],
        ['fresh lime juice', 'lime juice'], ['juice of a lime', 'lime juice'],
        ["rose's lime juice", 'lime juice'], ['roses lime juice', 'lime juice'],
        ['fresh orange juice', 'orange juice'], ['juice of orange', 'orange juice'],
        ['fresh grapefruit juice', 'grapefruit juice'],
        ['fresh ruby red grapefruit juice', 'grapefruit juice'],
        ['fresh white or ruby red grapefruit juice', 'grapefruit juice'],
        // === Orange liqueur / Triple Sec ===
        ['cointreau or triple sec', 'triple sec'], ['cointreau triple sec', 'triple sec'],
        ['mr. boston triple sec', 'triple sec'], ['old mr. boston triple sec', 'triple sec'],
        ['splash triple sec', 'triple sec'], ['white curacao or triple sec', 'triple sec'],
        ['orange liqueur', 'triple sec'], ['orange curacao', 'triple sec'],
        ['white curacao', 'triple sec'], ['curacao', 'triple sec'],
        // === Crème de Cacao ===
        ['creme de cacao (brown)', 'creme de cacao'], ['creme de cacao (white)', 'creme de cacao'],
        ['dark creme de cacao', 'creme de cacao'], ['white creme de cacao', 'creme de cacao'],
        ['white or dark creme de cacao', 'creme de cacao'],
        ['old mr. boston creme de cacao', 'creme de cacao'],
        ['old mr. boston white creme de cacao', 'creme de cacao'],
        // === Crème de Menthe ===
        ['creme de menthe (white)', 'creme de menthe'], ['green creme de menthe', 'creme de menthe'],
        ['white creme de menthe', 'creme de menthe'],
        ['old mr. boston creme de menthe (white)', 'creme de menthe'],
        ['old mr. boston green creme de menthe', 'creme de menthe'],
        ['old mr. boston white creme de menthe', 'creme de menthe'],
        ['mr. boston creme de menthe', 'creme de menthe'],
        // === Soda water ===
        ['carbonated water', 'soda water'], ['club soda', 'soda water'],
        // === Simple syrup ===
        ['sugar syrup', 'simple syrup'], ['rock candy syrup or simple syrup', 'simple syrup'],
        // === Bitters ===
        ['bitters', 'angostura bitters'],
        // === Port ===
        ['ruby port', 'port'], ['tawny port', 'port'], ['white port wine', 'port'],
        // === Sherry ===
        ['amontillado sherry', 'sherry'], ['cream sherry', 'sherry'],
        ['dry sherry', 'sherry'], ['manzanilla sherry', 'sherry'],
        ['oloroso sherry', 'sherry'], ['palo cortado or oloroso sherry', 'sherry'],
        ['pedro ximenez sherry', 'sherry'], ['sweet sherry', 'sherry'],
        // === Champagne / Sparkling wine ===
        ['chilled champagne', 'champagne'],
        ['chilled sparkling wine or champagne', 'champagne'],
        ['chilled sparkling wine', 'sparkling wine'],
        // === Misc consolidations ===
        ['amaretto di saronno', 'amaretto'],
        ['light cream', 'cream'], ['heavy cream', 'cream'],
        ['maraschino liqueur', 'maraschino'],
        ['amaro nonino', 'amaro'], ['ramazzotti amaro', 'amaro'],
        ['peach liqueur', 'peach schnapps'],
        ['light vermouth', 'dry vermouth'],
        ['black raspberry liqueur', 'raspberry liqueur'],
        ['raspberry-flavored liqueur', 'raspberry liqueur'],
        ['dubonnet rouge', 'dubonnet'],
    ]);

    // Preferred display names for canonical ingredient keys.
    const CANONICAL_DISPLAY = {
        'rum': 'Rum', 'gin': 'Gin', 'vodka': 'Vodka',
        'tequila': 'Tequila', 'whiskey': 'Whiskey', 'brandy': 'Brandy',
        'lemon juice': 'Lemon Juice', 'lime juice': 'Lime Juice',
        'orange juice': 'Orange Juice', 'grapefruit juice': 'Grapefruit Juice',
        'triple sec': 'Triple Sec',
        'creme de cacao': 'Crème de Cacao', 'creme de menthe': 'Crème de Menthe',
        'soda water': 'Soda Water', 'simple syrup': 'Simple Syrup',
        'angostura bitters': 'Angostura Bitters',
        'port': 'Port', 'sherry': 'Sherry',
        'champagne': 'Champagne', 'sparkling wine': 'Sparkling Wine',
        'amaretto': 'Amaretto', 'cream': 'Cream',
        'maraschino': 'Maraschino', 'amaro': 'Amaro',
        'peach schnapps': 'Peach Schnapps',
        'dry vermouth': 'Dry Vermouth', 'sweet vermouth': 'Sweet Vermouth',
        'raspberry liqueur': 'Raspberry Liqueur', 'dubonnet': 'Dubonnet',
    };

    const RESULTS_SHOW_LIMIT = 30;
    const CHART_TOP_N = 14;

    /* ------------------------- State ------------------------- */

    const state = {
        cocktails: [],            // [{name, category, ingredients:[{name,displayName,measure}], spirit:string}]
        displayNames: new Map(),  // lowercased -> first-seen original casing
        baseSpirit: null,         // key in SPIRIT_CATEGORIES
        selected: [],             // ingredient names (lowercased), order of addition
        matching: []              // current list after applying filters
    };

    /* ------------------------- Loading ----------------------- */

    // Returns canonical ingredient key, or null to skip the entry entirely.
    function normalizeIngredient(lower) {
        // Skip "each X, Y, Z" multi-ingredient fields
        if (/^each\b/.test(lower)) return null;

        // Strip trailing embedded measures: ", 1/2 oz", " 1 oz", "1 oz" at end
        let s = lower
            .replace(/,?\s*\d[\d\s/]*\s*(oz|tsp|tbsp|dash(?:es)?|drop(?:s)?|cup(?:s)?|ml|cl)\b.*/i, '')
            .trim();

        // Strip orphaned trailing "and" left after measure removal ("vanilla liqueur and 3 oz" → "vanilla liqueur and")
        s = s.replace(/\s+and\s*$/, '').trim();

        // Skip remaining multi-ingredient fields (still contain a comma)
        if (!s || s.includes(',')) return null;

        return INGREDIENT_ALIASES.get(s) || s;
    }

    async function loadData() {
        const rows = await d3.csv(DATA_URL);

        const groups = new Map();
        for (const row of rows) {
            const ingRaw = (row.ingredient || '').trim();
            if (!ingRaw) continue;
            const lower = normalizeIngredient(ingRaw.toLowerCase());
            if (!lower) continue;
            if (!state.displayNames.has(lower)) {
                state.displayNames.set(lower, CANONICAL_DISPLAY[lower] || ingRaw);
            }
            if (!groups.has(row.name)) {
                groups.set(row.name, {
                    name: row.name,
                    category: row.category,
                    ingredients: []
                });
            }
            groups.get(row.name).ingredients.push({
                name: lower,
                displayName: state.displayNames.get(lower),
                measure: (row.measure || '').trim()
            });
        }

        state.cocktails = Array.from(groups.values())
            .filter(c => c.ingredients.length > 0);

        for (const c of state.cocktails) {
            c.spirit = detectPrimarySpirit(c.ingredients);
        }
    }

    // Returns the single primary spirit key by summing oz for each matched
    // spirit across all ingredients. Ties are broken by first appearance in
    // recipe order. Falls back to first-listed when no oz are parseable.
    function detectPrimarySpirit(ingredients) {
        const volumes  = {};  // spirit key -> total oz
        const firstSeen = {}; // spirit key -> ingredient index of first match

        for (let i = 0; i < ingredients.length; i++) {
            const ing = ingredients[i];
            for (const [key, def] of Object.entries(SPIRIT_CATEGORIES)) {
                if (key === 'others') continue;
                if (def.patterns.some(p => p.test(ing.name))) {
                    volumes[key]  = (volumes[key] || 0) + parseMeasureOz(ing.measure);
                    if (!(key in firstSeen)) firstSeen[key] = i;
                    break;
                }
            }
        }

        const keys = Object.keys(volumes);
        if (keys.length === 0) return 'others';

        const maxVol = Math.max(...keys.map(k => volumes[k]));
        return keys
            .filter(k => volumes[k] === maxVol)
            .sort((a, b) => firstSeen[a] - firstSeen[b])[0];
    }

    function parseMeasureOz(measure) {
        if (!measure) return 0;
        const s = measure.toLowerCase();
        if (!s.includes('oz')) return 0;
        const num = s.replace(/oz.*$/, '').trim();
        const mixed = num.match(/^(\d+)\s+(\d+)\/(\d+)$/);
        if (mixed) return +mixed[1] + +mixed[2] / +mixed[3];
        const frac = num.match(/^(\d+)\/(\d+)$/);
        if (frac) return +frac[1] / +frac[2];
        const whole = num.match(/^(\d+(?:\.\d+)?)$/);
        if (whole) return +whole[1];
        return 0;
    }

    /* ------------------- Filtering / availability ------------- */

    function applyFilters() {
        let pool = state.cocktails;
        if (state.baseSpirit) {
            pool = pool.filter(c => c.spirit === state.baseSpirit);
        }
        for (const ing of state.selected) {
            pool = pool.filter(c => c.ingredients.some(i => i.name === ing));
        }
        state.matching = pool;
    }

    // Stable ingredient universe = every ingredient seen in any cocktail of
    // the chosen base spirit. The list does not shrink as the user filters
    // further — instead, individual items flip to a disabled state.
    function buildIngredientUniverse() {
        if (!state.baseSpirit) return [];
        const spiritPool = state.cocktails.filter(c => c.spirit === state.baseSpirit);
        const counts = new Map();
        for (const c of spiritPool) {
            for (const i of c.ingredients) {
                counts.set(i.name, (counts.get(i.name) || 0) + 1);
            }
        }
        return Array.from(counts.entries())
            .map(([name, count]) => ({
                name,
                displayName: state.displayNames.get(name) || name,
                spiritCount: count
            }));
    }

    function ingredientStatus(universe) {
        const selectedSet = new Set(state.selected);
        return universe.map(item => {
            if (selectedSet.has(item.name)) {
                return { ...item, alreadySelected: true, wouldRemain: 0, clickable: false };
            }
            let remain = 0;
            for (const c of state.matching) {
                if (c.ingredients.some(i => i.name === item.name)) remain++;
            }
            return {
                ...item,
                alreadySelected: false,
                wouldRemain: remain,
                clickable: remain > 0
            };
        });
    }

    /* ------------------------- Renderers ---------------------- */

    function renderSpiritPicker() {
        const root = document.getElementById('spirit-picker');
        root.innerHTML = '';

        const counts = new Map();
        for (const c of state.cocktails) {
            counts.set(c.spirit, (counts.get(c.spirit) || 0) + 1);
        }

        for (const [key, def] of Object.entries(SPIRIT_CATEGORIES)) {
            const count = counts.get(key) || 0;
            if (count === 0) continue;

            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'spirit-btn';
            btn.dataset.spirit = key;
            btn.innerHTML = `${def.label}<span class="spirit-count">${count} drinks</span>`;
            if (state.baseSpirit === key) btn.classList.add('active');
            btn.addEventListener('click', () => {
                if (state.baseSpirit === key) return;
                state.baseSpirit = key;
                state.selected = [];
                update();
            });
            root.appendChild(btn);
        }
    }

    function renderTags() {
        const root = document.getElementById('tags');
        root.innerHTML = '';

        if (!state.baseSpirit && state.selected.length === 0) {
            root.innerHTML = '<span class="tags-empty">nothing yet</span>';
            return;
        }

        if (state.baseSpirit) {
            const tag = document.createElement('span');
            tag.className = 'tag spirit-tag';
            const label = escapeHTML(SPIRIT_CATEGORIES[state.baseSpirit].label);
            tag.innerHTML = `${label} <span class="x" title="remove base spirit">×</span>`;
            tag.querySelector('.x').addEventListener('click', () => {
                state.baseSpirit = null;
                state.selected = [];
                update();
            });
            root.appendChild(tag);
        }

        for (const ing of state.selected) {
            const tag = document.createElement('span');
            tag.className = 'tag';
            const display = state.displayNames.get(ing) || ing;
            tag.innerHTML = `${escapeHTML(display)} <span class="x" title="remove">×</span>`;
            tag.querySelector('.x').addEventListener('click', () => {
                state.selected = state.selected.filter(s => s !== ing);
                update();
            });
            root.appendChild(tag);
        }
    }

    function isBaseSpirit(ingredientName) {
        return Object.entries(SPIRIT_CATEGORIES)
            .filter(([key]) => key !== 'others')
            .some(([, def]) => def.patterns.some(p => p.test(ingredientName)));
    }

    function renderIngredientPicker() {
        const root = document.getElementById('ingredient-picker');
        const hint = document.getElementById('picker-hint');
        root.innerHTML = '';

        if (!state.baseSpirit) {
            hint.textContent = '';
            return;
        }

        const universe = buildIngredientUniverse();
        const statusList = ingredientStatus(universe);
        const visible = statusList.filter(item => !item.alreadySelected);

        const sortGroup = arr => arr.sort((a, b) => {
            if (a.clickable !== b.clickable) return a.clickable ? -1 : 1;
            return b.spiritCount - a.spiritCount
                || a.displayName.localeCompare(b.displayName);
        });

        const selectedPatterns = SPIRIT_CATEGORIES[state.baseSpirit]?.patterns || [];
        const isSelectedSpirit = name => selectedPatterns.some(p => p.test(name));

        const spirits = sortGroup(visible.filter(item =>
            isBaseSpirit(item.name) && !isSelectedSpirit(item.name)));
        const others  = sortGroup(visible.filter(item => !isBaseSpirit(item.name)));

        // Popularity is judged separately for co-spirits and modifiers so each
        // group has a fair shot at stars. Combined cap stays ≤ 6.
        const spiritPoolSize = state.cocktails.filter(c => c.spirit === state.baseSpirit).length;
        const freq = item => item.spiritCount / (spiritPoolSize || 1);

        const topOf = (items, threshold, cap) => new Set(
            items
                .map(item => ({ name: item.name, freq: freq(item) }))
                .filter(item => item.freq >= threshold)
                .sort((a, b) => b.freq - a.freq)
                .slice(0, cap)
                .map(item => item.name)
        );

        // Co-spirits: lower threshold (20%) since there are few of them and
        // even a minority co-occurrence (e.g. brandy in gin drinks) is notable.
        const popularSpirits = topOf(
            universe.filter(item => isBaseSpirit(item.name) && !isSelectedSpirit(item.name)),
            0.20, 3
        );
        // Modifiers: higher threshold (25%) since the pool is large and only
        // truly dominant ingredients (lemon juice, simple syrup, etc.) deserve stars.
        const popularModifiers = topOf(
            universe.filter(item => !isBaseSpirit(item.name)),
            0.25, 3
        );
        const popularSet = new Set([...popularSpirits, ...popularModifiers]);

        let clickableCount = 0;
        let idx = 0;

        const appendGroup = (label, items) => {
            if (items.length === 0) return;

            const header = document.createElement('div');
            header.className = 'ing-group-label';
            header.textContent = label;
            root.appendChild(header);

            for (const item of items) {
                const popular = item.clickable && popularSet.has(item.name);
                const starHTML = popular
                    ? `<span class="popular-star" aria-hidden="true">✦</span>` : '';
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'ing-btn' + (item.clickable ? '' : ' disabled') + (popular ? ' popular' : '');
                btn.disabled = !item.clickable;
                btn.style.setProperty('--i', Math.min(idx++, 40));
                btn.innerHTML = `${escapeHTML(item.displayName)}<span class="ing-count">${item.wouldRemain}</span>${starHTML}`;

                if (item.clickable) {
                    clickableCount++;
                    btn.title = `Adds this ingredient — ${item.wouldRemain} matching cocktail${item.wouldRemain === 1 ? '' : 's'} would remain.`;
                    btn.addEventListener('click', () => {
                        state.selected.push(item.name);
                        update();
                    });
                } else {
                    btn.title = 'No cocktail in your current selection contains this ingredient.';
                }
                root.appendChild(btn);
            }
        };

        appendGroup('Base Spirits', spirits);
        appendGroup('Modifiers & Accents', others);

        hint.textContent = `${clickableCount} of ${visible.length} ingredients can still join your current hand.`;
    }

    function renderStatusBar() {
        const bar = document.getElementById('status-bar');
        const num = document.getElementById('match-count');
        const lbl = document.getElementById('match-label');
        const fill = document.getElementById('recipe-space-fill');
        const note = document.getElementById('recipe-space-note');

        if (!state.baseSpirit && state.selected.length === 0) {
            bar.hidden = true;
            return;
        }
        bar.hidden = false;

        const n = state.matching.length;
        const totalUniverse = state.baseSpirit
            ? state.cocktails.filter(c => c.spirit === state.baseSpirit).length
            : state.cocktails.length;

        const pct = totalUniverse > 0
            ? (100 * n / totalUniverse)
            : 0;

        if (fill) {
            fill.style.setProperty('--progress', `${pct}%`);
        }

        if (note) {
            if (n === 0) {
                note.textContent =
                    'No recipes remain. Remove an ingredient to reopen the book.';
            } else if (n === 1) {
                note.textContent =
                    'Only one recipe remains.';
            } else {
                note.textContent =
                    `${pct.toFixed(1)}% of the recipe space remains.`;
            }
        }

        const current = Number(num.textContent) || 0;
        d3.select(num)
            .transition()
            .duration(450)
            .tween('text', function () {
                const interp = d3.interpolateNumber(current, n);
                return function (t) {
                    this.textContent = Math.round(interp(t));
                };
            });
        num.classList.toggle('zero', n === 0);
        if (n === 0) {
            lbl.textContent = 'cocktails fit — try lifting an ingredient.';
        } else if (n === 1) {
            lbl.textContent = 'cocktail fits this combination.';
        } else {
            lbl.textContent = 'cocktails fit this combination.';
        }
    }

    function renderResults() {
        const root = document.getElementById('results');
        root.innerHTML = '';

        if (!state.baseSpirit && state.selected.length === 0) {
            root.innerHTML = '<div class="results-empty">Choose a base spirit above to begin opening recipes.</div>';
            return;
        }

        if (state.matching.length === 0) {
            root.innerHTML = '<div class="results-empty">No recipe in the book contains all of these ingredients. Try lifting one.</div>';
            return;
        }

        const selectedSet = new Set(state.selected);
        const toShow = state.matching
            .slice()
            .sort((a, b) => a.name.localeCompare(b.name))
            .slice(0, RESULTS_SHOW_LIMIT);

        let cardIdx = 0;
        for (const c of toShow) {
            const card = document.createElement('article');
            card.className = 'cocktail-card';
            card.style.setProperty('--i', Math.min(cardIdx++, 12));

            const ingList = c.ingredients.map(i => {
                const matched = selectedSet.has(i.name);
                return `<li>
                    <span class="ing-name ${matched ? 'matched' : ''}">${escapeHTML(i.displayName)}</span>
                    <span class="measure">${escapeHTML(i.measure || '')}</span>
                </li>`;
            }).join('');

            card.innerHTML = `
                <h3 class="name">${escapeHTML(c.name)}</h3>
                <p class="category">${escapeHTML(c.category || '')}</p>
                <ul class="ingredients">${ingList}</ul>
            `;
            root.appendChild(card);
        }

        if (state.matching.length > RESULTS_SHOW_LIMIT) {
            const note = document.createElement('div');
            note.className = 'results-overflow-note';
            note.textContent =
                `…and ${state.matching.length - RESULTS_SHOW_LIMIT} more. Add another ingredient to narrow further.`;
            root.appendChild(note);
        }
    }

    /* ---------------------- D3 chart ---------------------- */

    function renderChart() {
        const svg = d3.select('#chart');
        svg.selectAll('*').remove();

        if (state.matching.length === 0) {
            const w = 540, h = 80;
            svg.attr('viewBox', `0 0 ${w} ${h}`);
            svg.append('text')
                .attr('x', w / 2).attr('y', h / 2)
                .attr('text-anchor', 'middle')
                .attr('class', 'bar-label')
                .text('No matching cocktails to chart.');
            return;
        }

        const selectedSet = new Set(state.selected);
        const basePatterns = state.baseSpirit
            ? (SPIRIT_CATEGORIES[state.baseSpirit]?.patterns || []) : [];
        const isSelectedSpirit = name => basePatterns.some(p => p.test(name));

        const counts = new Map();
        for (const c of state.matching) {
            // Set per cocktail so we don't double-count repeated ingredients.
            const uniq = new Set(c.ingredients.map(i => i.name));
            for (const n of uniq) {
                if (selectedSet.has(n)) continue;
                if (isSelectedSpirit(n)) continue;
                counts.set(n, (counts.get(n) || 0) + 1);
            }
        }

        const data = Array.from(counts.entries())
            .map(([name, count]) => ({
                name,
                displayName: state.displayNames.get(name) || name,
                count
            }))
            .sort((a, b) => b.count - a.count || a.displayName.localeCompare(b.displayName))
            .slice(0, CHART_TOP_N);

        if (data.length === 0) {
            const w = 540, h = 80;
            svg.attr('viewBox', `0 0 ${w} ${h}`);
            svg.append('text')
                .attr('x', w / 2).attr('y', h / 2)
                .attr('text-anchor', 'middle')
                .attr('class', 'bar-label')
                .text('Only your selected ingredients remain.');
            return;
        }

        const margin = { top: 12, right: 50, bottom: 18, left: 230 };
        const barHeight = 22;
        const barGap = 8;
        const totalW = 600;
        const innerW = totalW - margin.left - margin.right;
        const innerH = data.length * (barHeight + barGap);
        const totalH = innerH + margin.top + margin.bottom;

        svg.attr('viewBox', `0 0 ${totalW} ${totalH}`);

        const g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        const x = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.count)])
            .range([0, innerW])
            .nice();

        const rows = g.selectAll('g.bar-row')
            .data(data)
            .enter()
            .append('g')
            .attr('class', 'bar-row')
            .attr('transform', (_, i) => `translate(0, ${i * (barHeight + barGap)})`)
            .on('click', (_, d) => {
                if (!state.selected.includes(d.name)) {
                    state.selected.push(d.name);
                    update();
                }
            });

        rows.append('rect')
            .attr('class', 'bar-bg')
            .attr('x', 0).attr('y', 0)
            .attr('width', innerW).attr('height', barHeight)
            .attr('rx', 1);

        rows.append('rect')
            .attr('class', 'bar')
            .attr('x', 0).attr('y', 0)
            .attr('width', 0)
            .attr('height', barHeight)
            .attr('rx', 1)
          .transition()
            .duration(650)
            .delay((_, i) => i * 35)
            .ease(d3.easeCubicOut)
            .attr('width', d => x(d.count));

        const truncate = (s, n) => s.length > n ? s.slice(0, n - 1) + '…' : s;

        rows.append('text')
            .attr('class', 'bar-label')
            .attr('x', -10)
            .attr('y', barHeight / 2)
            .text(d => truncate(d.displayName, 30));

        rows.append('text')
            .attr('class', 'bar-value')
            .attr('x', 0)
            .attr('y', barHeight / 2)
            .attr('opacity', 0)
            .text(d => d.count)
          .transition()
            .duration(650)
            .delay((_, i) => i * 35 + 200)
            .ease(d3.easeCubicOut)
            .attr('x', d => x(d.count) + 6)
            .attr('opacity', 1);

        rows.append('title')
            .text(d => `${d.displayName}: appears in ${d.count} of the ${state.matching.length} matching cocktails. Click to add.`);
    }
	function render_stats() {
    	const svg = d3.select('#stats-chart');
    	svg.selectAll('*').remove();

    	if (!state.baseSpirit) return;

    	const baseCocktails = state.cocktails.filter(
        	c => c.spirit === state.baseSpirit
    	);

    	const total = baseCocktails.length;
    	if (total === 0) return;

    	const basePatterns = SPIRIT_CATEGORIES[state.baseSpirit]?.patterns || [];
    	const isCurrentBase = name => basePatterns.some(p => p.test(name));

    	const counts = new Map();

    	for (const c of baseCocktails) {
        	const uniq = new Set(c.ingredients.map(i => i.name));

        	for (const ing of uniq) {
            	if (isCurrentBase(ing)) continue;
	            counts.set(ing, (counts.get(ing) || 0) + 1);
    	    }
    	}

    	const data = Array.from(counts.entries())
        	.map(([name, count]) => ({
            	name,
            	displayName: state.displayNames.get(name) || name,
            	count,
            	percentage: 100 * count / total
        	}))
        	.sort((a, b) => b.percentage - a.percentage)
        	.slice(0, 10);

    	const top3Avg = d3.mean(data.slice(0, 3), d => d.percentage);
    	const nextAvg = d3.mean(data.slice(3, 10), d => d.percentage);
    	const gapRatio = nextAvg ? top3Avg / nextAvg : 0;

    	const width = 620;
    	const margin = { top: 78, right: 90, bottom: 30, left: 190 };
    	const barHeight = 23;
    	const gap = 9;
    	const height = margin.top + margin.bottom + data.length * (barHeight + gap);

    	svg.attr('viewBox', `0 0 ${width} ${height}`);

    	svg.append('text')
        	.attr('x', 24)
        	.attr('y', 28)
        	.attr('class', 'bar-title')
        	.text(`${SPIRIT_CATEGORIES[state.baseSpirit].label}: companion ingredients`);

    	svg.append('text')
        	.attr('x', 24)
        	.attr('y', 54)
        	.attr('class', 'bar-subtitle')
        	.text(
            	`${data[0].displayName} appears in ${data[0].percentage.toFixed(1)}% of all ${SPIRIT_CATEGORIES[state.baseSpirit].label.toLowerCase()} cocktails.`
        	);

    	const x = d3.scaleLinear()
        	.domain([0, d3.max(data, d => d.percentage)])
        	.range([0, width - margin.left - margin.right])
        	.nice();

    	const g = svg.append('g')
        	.attr('transform', `translate(${margin.left},${margin.top})`);

    	const rows = g.selectAll('g.stat-row')
        	.data(data)
        	.enter()
        	.append('g')
        	.attr('class', 'stat-row')
        	.attr('transform', (_, i) => `translate(0, ${i * (barHeight + gap)})`);

    	rows.append('text')
        	.attr('class', 'bar-label')
        	.attr('x', -10)
        	.attr('y', barHeight / 2)
        	.attr('text-anchor', 'end')
        	.attr('dominant-baseline', 'middle')
        	.text(d =>
            	d.displayName.length > 24
                	? d.displayName.slice(0, 23) + '…'
                	: d.displayName
        	);

    	rows.append('rect')
        	.attr('class', (_, i) => i < 3 ? 'bar top-bar' : 'bar')
        	.attr('x', 0)
        	.attr('y', 0)
        	.attr('height', barHeight)
        	.attr('width', 0)
        	.transition()
        	.duration(600)
        	.delay((_, i) => i * 40)
        	.attr('width', d => x(d.percentage));

    	rows.append('text')
        	.attr('class', 'bar-value')
        	.attr('x', d => x(d.percentage) + 8)
        	.attr('y', barHeight / 2)
        	.attr('dominant-baseline', 'middle')
        	.text(d => `${d.percentage.toFixed(1)}%`);

    	rows.append('title')
        	.text(d =>
            	`${d.displayName}: appears in ${d.count} of ${total} ${SPIRIT_CATEGORIES[state.baseSpirit].label} cocktails.`
        	);
	}

    /* --------------------- Search filter --------------------- */

    function applySearchFilter(term) {
        const q = term.toLowerCase().trim();
        document.querySelectorAll('#ingredient-picker .ing-btn').forEach(btn => {
            btn.classList.toggle('search-hidden',
                q.length > 0 && !btn.textContent.toLowerCase().includes(q));
        });
    }

    /* --------------------- Update orchestrator ---------------- */

    function update() {
        applyFilters();
        renderSpiritPicker();
        renderTags();
        renderIngredientPicker();
        renderStatusBar();
        renderResults();
        renderChart();
	render_stats();

        const searchEl = document.getElementById('ingredient-search');
        if (searchEl) searchEl.value = '';

        document.getElementById('step-2').hidden = !state.baseSpirit;
        document.getElementById('visualization-grid').hidden =
            (!state.baseSpirit && state.selected.length === 0);
    }

    /* ------------------------ Utilities ----------------------- */

    function escapeHTML(s) {
        if (s == null) return '';
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    /* -------------------------- Init -------------------------- */

    async function init() {
        document.getElementById('ingredient-search').addEventListener('input', function () {
            applySearchFilter(this.value);
        });

        document.getElementById('reset-btn').addEventListener('click', () => {
            const book = document.querySelector('.grimoire');
            if (book) {
                book.classList.add('resetting');
                setTimeout(() => book.classList.remove('resetting'), 650);
            }
            state.baseSpirit = null;
            state.selected = [];
            update();
        });

        try {
            await loadData();
            update();
        } catch (err) {
            console.error('Failed to load cocktail data', err);
            const picker = document.getElementById('spirit-picker');
            picker.innerHTML =
                '<div class="loading">Could not open the recipe book.<br/>' +
                'If you opened this file directly, browsers block local <code>fetch()</code>. ' +
                'Run <code>python3 -m http.server</code> in this folder, then visit ' +
                '<code>http://localhost:8000</code>.</div>';
        }
    }

    document.addEventListener('DOMContentLoaded', init);
})();
