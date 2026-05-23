# DSC 106 Final Project Proposal

## 1. Project Title

**Cocktail Flavor Atlas: An Interactive Recipe Grimoire**

## 2. Team Name

**The Tipsy Cartographers**

## 3. Team Members

- Yonghao Wang
- Haihan Wang
- Albert Zhang
- Mianzhi Hu

## 4. Dataset

Our main dataset is the **TidyTuesday Cocktails Dataset**, specifically `boston_cocktails.csv`.

- Dataset documentation: https://github.com/rfordatascience/tidytuesday/blob/main/data/2020/2020-05-26/readme.md
- Main raw CSV: https://raw.githubusercontent.com/rfordatascience/tidytuesday/main/data/2020/2020-05-26/boston_cocktails.csv
- Optional secondary CSV: https://raw.githubusercontent.com/rfordatascience/tidytuesday/main/data/2020/2020-05-26/cocktails.csv

The TidyTuesday documentation describes the Mr. Boston dataset as acquired from *Mr. Boston Bartender's Guide*. It also notes that the optional `cocktails.csv` file was web-scraped as part of a hackathon and is less analysis-ready. For that reason, our project will use `boston_cocktails.csv` as the primary dataset.

## 5. Why This Dataset Qualifies

This dataset is public, real, and not synthetic or simulated. The local `boston_cocktails.csv` file contains **3,643 rows** and **6 columns**, which satisfies the requirement of at least 100 rows and 5 columns. Its columns are:

`name`, `category`, `row_id`, `ingredient_number`, `ingredient`, `measure`

Each row represents one ingredient-measure entry for a real cocktail recipe. The data is suitable for analyzing ingredient frequency, spirit categories, recipe complexity, and relationships between ingredients.

## 6. Brief Project Writeup

We are building an explorable explanation about the hidden structure of classic cocktail recipes. The website will feel like an ancient cocktail grimoire: a mysterious parchment recipe book from an elegant hidden tavern. Users will not generate fake cocktails; instead, they will explore a real cocktail dataset by progressively filtering possible drinks. A user first chooses a base spirit, such as gin, rum, tequila, vodka, whiskey, brandy, or mezcal. The interface then keeps only cocktails that contain that spirit, and users can add more ingredients from the remaining recipe space. Ingredients that can still lead to real cocktails stay clickable, while impossible ingredients become disabled or greyed out. Our current prototype already uses `boston_cocktails.csv` and demonstrates this filtering concept.

## 7. Planned Static Visualizations

1. **Count of cocktails by base spirit**  
   A bar chart showing how many recipes contain each major spirit category.

2. **Most common ingredients across all cocktails**  
   A ranked bar chart of the ingredients that appear most often in the full dataset.

3. **Most common ingredients within each base spirit category**  
   Small multiples or grouped bars comparing common ingredients for gin, rum, whiskey, brandy, vodka, tequila, and mezcal drinks.

4. **Distribution of recipe complexity by number of ingredients**  
   A histogram showing how many ingredients typical recipes contain.

5. **Ingredient co-occurrence network or matrix**  
   A network or matrix showing which ingredients commonly appear together in the same recipes.

6. **Cocktail similarity map based on shared ingredients**  
   A map or clustered layout where cocktails are positioned by overlap in their ingredient lists.

## 8. Planned Interactive Features

- Base spirit filter
- Ingredient filter
- Disabled impossible ingredients
- Real-time remaining cocktail count
- Clickable D3 bar chart or ingredient chart
- Cocktail recipe cards
- Reset interaction

## 9. Design Direction

The visual style will support the story of discovery through an ancient cocktail recipe grimoire. We plan to use parchment paper textures, worn edges, old ink, brass or gold accents, dark wood, leather, and a hidden tavern atmosphere. Subtle magical interaction effects can make filtering feel like revealing recipes from an old book. This aesthetic should make the project memorable, but the core purpose remains data visualization: helping users understand the structure of real cocktail recipes through filtering, charts, and recipe evidence.

## 10. Expected Takeaway

Classic cocktails may look like endless random combinations, but the dataset suggests they follow a hidden grammar. A base spirit immediately narrows the possible ingredient space, and each additional ingredient reveals more structure in the recipe network. Through static charts and interactive filtering, users should see how cocktail traditions are shaped by recurring patterns of spirits, citrus, sweeteners, bitters, and modifiers.
