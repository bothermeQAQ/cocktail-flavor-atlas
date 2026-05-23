# Cocktail Flavor Atlas

DSC 106 Final Project prototype by **The Tipsy Cartographers**.

Live prototype: https://bothermeqaq.github.io/cocktail-flavor-atlas/

## What Is Here

- `index.html` - prototype page
- `style.css` - visual styling
- `app.js` - D3 loading, filtering, chart, and interaction logic
- `boston_cocktails.csv` - main TidyTuesday/Mr. Boston cocktail dataset used by the prototype
- `final_project_proposal.md` - copy/paste proposal text
- `final_project_proposal.pdf` - polished proposal PDF

## Project Idea

Cocktail Flavor Atlas explores the hidden structure of classic cocktail recipes. Users choose a base spirit, add ingredients, and see which real cocktails remain possible from the dataset. Impossible ingredients become disabled, and recipe cards plus a D3 ingredient chart update with the current selection.

## Local Preview

Because the prototype loads a CSV file, run it from a local web server:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Dataset

Main dataset: `boston_cocktails.csv` from the TidyTuesday Cocktails dataset.

Dataset documentation: https://github.com/rfordatascience/tidytuesday/blob/main/data/2020/2020-05-26/readme.md
