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

    async function loadData() {
        const rows = await d3.csv(DATA_URL);

        const groups = new Map();
        for (const row of rows) {
            const ingRaw = (row.ingredient || '').trim();
            if (!ingRaw) continue;
            const lower = ingRaw.toLowerCase();
            if (!state.displayNames.has(lower)) {
                state.displayNames.set(lower, ingRaw);
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

        // Clickable first, then by initial frequency in the spirit pool.
        visible.sort((a, b) => {
            if (a.clickable !== b.clickable) return a.clickable ? -1 : 1;
            return b.spiritCount - a.spiritCount
                || a.displayName.localeCompare(b.displayName);
        });

        let clickableCount = 0;
        let idx = 0;

        for (const item of visible) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'ing-btn' + (item.clickable ? '' : ' disabled');
            btn.disabled = !item.clickable;
            btn.style.setProperty('--i', Math.min(idx++, 40));
            btn.innerHTML = `${escapeHTML(item.displayName)}<span class="ing-count">${item.wouldRemain}</span>`;

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

        hint.textContent = `${clickableCount} of ${visible.length} ingredients can still join your current hand.`;
    }

    function renderStatusBar() {
        const bar = document.getElementById('status-bar');
        const num = document.getElementById('match-count');
        const lbl = document.getElementById('match-label');

        if (!state.baseSpirit && state.selected.length === 0) {
            bar.hidden = true;
            return;
        }
        bar.hidden = false;

        const n = state.matching.length;
        num.textContent = n;
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
        const counts = new Map();
        for (const c of state.matching) {
            // Set per cocktail so we don't double-count repeated ingredients.
            const uniq = new Set(c.ingredients.map(i => i.name));
            for (const n of uniq) {
                if (selectedSet.has(n)) continue;
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

    /* --------------------- Update orchestrator ---------------- */

    function update() {
        applyFilters();
        renderSpiritPicker();
        renderTags();
        renderIngredientPicker();
        renderStatusBar();
        renderResults();
        renderChart();

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
