---
title: When We Visualize City Names
date: 2019-06-16 13:12:19
tags: Tech
math: trued
---

<div class="article-note">
Note: this article is an excerpt from the final report of [Project Placename Insights](https://github.com/Cyphexl/placename-insights), a cooperative coursework study on typonymy. Below is a conclusive analysis of the visualization section.
</div>


## General Observations

Place names around the world have a subtle and close relationship with their location. This is usually because different regions have different languages and writing systems, hence the different spelling patterns.

Characteristics of place names differ due to geographic location changes. To a certain extent, the changes are both continuous and discrete. They are continuous because place names are similar in neighboring regions. For instance, throughout the Europe continent, the proportion of consonants in their spelling rises from the Mediterranean to the north. Another example, inside China, the unified country, the place names in the northwest are more "Arabic" than those in the east.

<figure>
    {% asset_img 9-0.jpg %}
    <figcaption>
    Figure 9-0. Continuous. The proportion of consonants throughout the Europe continent.
    </figcaption>
</figure>

The discrete character of place names, on the other hand, is usually caused by geographical barriers, political boundaries, and cultural divisions. For example, in Spain and Argentina, two countries that locate vastly different, have similar place names because of historical colonial activities. Like the border between China and Vietnam, they share similar cultures. However, the official language on one side is In Chinese, while Vietnamese is used on the other side - the two writing systems, therefore, have different Latin transcription standards, resulting in the latter's place names usually being split into many relatively short words. This "discrete" character is caused by political reasons.

<figure>
    {% asset_img 9-1.jpg %}
    <figcaption>
    Figure 9-1. Discrete. The difference in place names caused by different transliteration systems.
    </figcaption>
</figure>

Some geographical regions have a quite distinct place name patterns. For instance, in East Europe, especially Russia, place names are usually constructed by a single long word, which makes them relatively easier to be recognized. Some Slavic suffixes like "-sk" are commonly seen here. Some geographical areas, such as sub-Saharan Africa and Oceania island countries, the culture and languages are so diverse there, causing the place names are much more challenging to identify.

## Visualizing Place Names in the World

### Population

<figure>
    {% asset_img 9-2.jpg %}
    <figcaption>
    Figure 9-2. All cities with a population of greater than 500.
    </figcaption>
</figure>

The figure above shows all cities with a population more than 500 (total ~180,000 cities) scattered onto a dark background, with each point represents a city. This figure gives a sense of where geographic information is densely aggregated or recorded and where there are not. It seems that the western European area holds the most densely distributed populated cities. Other populated area includes the USA, Central America, and Southeast China.

### Cities with Longer Words

<figure>
    {% asset_img 9-3.jpg %}
    <figcaption>
    Figure 9-3. Cities with longer words.
    </figcaption>
</figure>

Cities are represented with different colors on this map, and to avoid interfering mixed colors, color [blend mode](https://en.wikipedia.org/wiki/Blend_modes) was set to Normal, i.e., no blending. In this figure, blue dot means a city that has short words in its name (e.g., Ho Chi Minh City), and yellow dot indicates long words (e.g., Vladivostok).

To design a proper `words_length -> color` projection function, we firstly investigated the distribution of word lengths. The median word length is around six letters, with a minimum of 1 letter and a maximum of over 20 letters. This character is like a normal distribution with *skewed* (or imbalanced) two sides. *Log-normal distribution*, in this case, fits the model.

<figure>
    {% asset_img 9-4.png %}
    <figcaption>
    Figure 9-4. The PDF of the distribution model used in mapping word length to colors.
    </figcaption>
</figure>

Above is its PDF (Probability Density Function) plotted. To transform the distribution into a color projection function, we need its CDF (Cumulative Distribution Function) expressions:

$$
CDF(x, \mu, \sigma) = \frac12 + \frac12\operatorname{erf}\Big[\frac{\ln x-\mu}{\sqrt{2}\sigma}\Big]
$$

The corresponding part of the code is implemented as below:

```js
     function erf(x) {
         let m = 1.00;
         let s = 1.00;
         let sum = x * 1.0;
         for (let i = 1; i < 50; i++) {
             m *= i;
             s *= -1;
             sum += (s * Math.pow(x, 2.0 * i + 1.0)) / (m * (2.0 * i + 1.0));
        }
         return 2 * sum / Math.sqrt(PI);
    }
 
     function logNormalCDF(x, mu, sigma) {
         let par = (Math.log(x) - mu) / (Math.sqrt(2) * sigma)
         return 0.5 + 0.5 * erf(par)
    }
 
     const projectColor = (x) => Math.round(logNormalCDF(x/5, 0, 1)*255)
```

The result color is concatenated from strings:

```js
context.fillStyle = `rgb(${projectColor(wordLength)}, ${projectColor(wordLength)}, ${255 - projectColor(wordLength)})`
```

### Cities with More Words

<figure>
    {% asset_img 9-5.jpg %}
    <figcaption>
    Figure 9-5. Cities with more words.
    </figcaption>
</figure>

The idea behind this image is similar to the previous plot, whereas a red dot indicates a city name that consists of many words, and a green dot indicates the contrary.

### Cities with a Higher Vowel-Consonant Ratio

<figure>
    {% asset_img 9-6.jpg %}
    <figcaption>
    Figure 9-6. An experiment with vowel-consonant ratio.
    </figcaption>
</figure>

We experimented with the vowel-consonant ratio on this map. Vowels only include five Latin letters, and all other letters are consonants. So more vowels in a word are likely to make the pronunciation softer, e.g., "Ieyouia." A word with a lower vowel-consonant ratio, which means more consonants in their spelling, e.g., "Pszykt," usually sounds hard. We can observe the general pattern that a place having a higher latitude usually have a hard-sounding name. Certain countries, such as Japan and Nigeria, have a particularly high vowel-consonant ratio.

## Experimenting with Placenames in China

<figure>
    {% asset_img 9-7.jpg %}
    <figcaption>
    Figure 9-7. Filtering certain patterns in Chinese place names.
    </figcaption>
</figure>

In addition to the regular steps in machine learning and statistics, we tried to find out whether specific "patterns" in place names exist. We limited the area of research to Mainland China for the Chinese language we're both familiar with. We used regular expressions to filter the points in the scatter plot and found out for some specific words or characters, the place names containing them tend to aggregate within a particular area, or show interesting distribution patterns.

### Zhongyuan Markets

"Dian(店)" means "market" in Mandarin Chinese. This is a word that appears only in the Zhongyuan Mandarin dialect; therefore, the place names containing "Dian" gather in the Zhongyuan region, the central east of Mainland China.

### Mountains and Plains

"Shan(山)" means "mountain" in Chinese. The place names containing "Shan," as the visualization suggests, appear more frequently in those mountainous terrains. The western part of China is also considered mountainous, but insufficient in geographic information in general. Still, we can observe that for most populated areas, "Shan" s gather in hills rather than plains. Notice the dense distribution of the hilly regions of Shandong, and the strip of dark areas of the North China Plain surrounding the mountains on the scatter plot.

### Lakes in the South

"Hu(湖)" stands for "lake" in Mandarin Chinese. Lakes are more densely distributed in Southern China than the north; therefore, in the visualization, the southern part of China is more densely lit.

### Tibetan and Minnan Dialect

"Cuo(错)" stands for "lake," too, but in Tibetan instead of Mandarin Chinese. That explains why this time, the lakes in Tibet are highlighted. There is a strange, unintentional aggregation of points on the southeast coastline of China, however. After investigation, we discovered that there is another Chinese word "Cuo(厝)" that spells identical to "Cuo(错)," which means "House" in the Minnan dialect of the Chinese language. Minnan dialect is widely spoken by inhabitants in the southeast coastline of China, and that thoroughly explains the result.

## Summary of Clusters

The writing system in East Asia is usually ideographic, which generates clear syllable boundaries in its place names. Some common spelling patterns, including "-eng," "-ang" can be seen.

The features in Southeast Asia and South Asia place names is somewhat similar to that of East Asia. However, the average word length is dramatically shorter because each ideograph represents one word. The "Syllable boundary" in East Asia place name words becomes whitespaces here.

Place names in Sub-Saharan Africa are diverse in characteristics, making them harder to recognize. We can occasionally notice a European impact, especially the French ones, on their place names.

Place names in West Europe typically demonstrate a low vowel-consonant ratio, which means the pronunciation sounds "harder." Some common suffixes like "-burg / -bourg," "-eaux" can be observed.

Place names in East Europe are usually constructed by a single long word, which makes them relatively easier to be recognized. Some Slavic suffixes like "-sk" are commonly seen here. Place names from English-spoken countries (North America, Australia, New Zealand, and the UK) show features in the English language.

Place names in Latin Region, including Latin America, Spain, and Portugal, are made up of relatively short words. Some common prefixes like "de," "le," "san" can be observed.

Place names in the Arabic Cultural Region usually suggest some unique patterns, including "Al," "Ah," "-bad," and "-j."

Place names in Oceania are diverse in characteristics and meanwhile short in collected data. This diversity makes them nearly impossible to be classified.