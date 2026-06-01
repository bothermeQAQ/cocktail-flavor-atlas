// ingredient_stats_image.js

async function drawIngredientStatsImage() {
    const rows = await d3.csv('boston_cocktails.csv');

    const ingredientToCocktails = new Map();
    const cocktailSet = new Set();

    for (const row of rows) {
        const cocktail = row.name?.trim();
        const ingredient = row.ingredient?.trim();
        if (!cocktail || !ingredient) continue;

        cocktailSet.add(cocktail);

        if (!ingredientToCocktails.has(ingredient)) {
            ingredientToCocktails.set(ingredient, new Set());
        }
        ingredientToCocktails.get(ingredient).add(cocktail);
    }

    const totalCocktails = cocktailSet.size;

    const data = Array.from(ingredientToCocktails.entries())
        .map(([ingredient, drinks]) => ({
            ingredient,
            count: drinks.size,
            percentage: 100 * drinks.size / totalCocktails
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20);

    const width = 900;
    const height = 650;
    const margin = { top: 50, right: 80, bottom: 40, left: 220 };

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = 'black';
    ctx.font = 'bold 24px Arial';
    ctx.fillText('Top Ingredients by Cocktail Share', 40, 35);

    const innerWidth = width - margin.left - margin.right;
    const barHeight = 22;
    const gap = 8;

    const maxPercent = Math.max(...data.map(d => d.percentage));

    ctx.font = '14px Arial';

    data.forEach((d, i) => {
        const y = margin.top + i * (barHeight + gap);
        const barWidth = innerWidth * d.percentage / maxPercent;

        ctx.fillStyle = 'black';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(d.ingredient, margin.left - 10, y + barHeight / 2);

        ctx.fillStyle = '#6b8afd';
        ctx.fillRect(margin.left, y, barWidth, barHeight);

        ctx.fillStyle = 'black';
        ctx.textAlign = 'left';
        ctx.fillText(
            `${d.count} drinks (${d.percentage.toFixed(1)}%)`,
            margin.left + barWidth + 8,
            y + barHeight / 2
        );
    });

    const link = document.createElement('a');
    link.download = 'ingredient_stats.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
}

drawIngredientStatsImage();