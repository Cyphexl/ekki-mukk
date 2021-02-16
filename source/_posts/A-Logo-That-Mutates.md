---
title: A Logo that Mutates
date: 2021-02-13 21:04:12
tags: [Dev]
---

## 契机

在去年集中申请留学的时候，偶然逛到荷兰皇家艺术学院的官网。学校的 Logo 是一个由七个点连成的小皇冠，风格偏极简。这个 Logo 非常的独特之处在于：**每次刷新页面，点之间的线段都会随机变换一种连接方式。**

<figure>
    {% asset_img 1.png %}
    <figcaption>Figure 1 - 荷兰皇家艺术学院的官网（<a href="https://www.kabk.nl/">kabk.nl</a>）。每次打开，页面左上角的 Logo 都会换一副模样。</figcaption>
</figure>


从那时候起，我接触到了可变的 Logo 这一概念。不知道设计学界对此有没有专用的名词，但在新的品牌设计趋势中，似乎可以越来越多看到这类设计。它们通常被应用到一些非常新潮、年轻化，且对 UI/UX 实现质量要求相当高的项目中。

2020 年年底，我受邀参与由南开中学校友发起的「南开通鉴 nkhistory」项目开发。这个自发的项目没有甲方、没有设计稿，我被允许自由发挥。如此宝贵的机会，我决定自己尝试一下可变 Logo 这个想法。

## 起稿

有了简单灵感后，Logo 设计的过程并不复杂。我构思了一下几个可以联想到的视觉形象，定了一个「米」字形的稿。这一 Logo 结合了两个基本元素：南开中学校徽中的正八角星，以及 ✱ 这个符号。

<figure>
    {% asset_img 2.png %}
    <figcaption>Figure 2 - 摘取自南开通鉴 VI 设计稿的截图。</figcaption>
</figure>

如果你也是 Web 开发工程师，你一定很熟悉 ✱ 即是 CSS 中的通配符，但即便脱离了程序设计语言的语境，它也能体现出一种「任意」或「啥都行」的意味。这里就对应上了南开通鉴中的「通」字，以及它最开始的 Slogan —— 每个人都可以编写的南开史。

横平竖直的「米」字形 Logo 显然过于无聊，下一个步骤就是构思将 Logo 随机化了。**在这里，基本做法就是将 Logo 的四条笔画各自稍作倾斜、平移等变换，让其看起来具有一定的随意性和亲和力，仿佛是随便几笔瞎画出来的。**

<figure>
    {% asset_img 3.png %}
    <figcaption>Figure 3 - 在理想的结果下，上图的这些应该都是南开通鉴的 Logo，并且每次出现在页面上总是随机生成任意的一个。</figcaption>
</figure>

## 技术选型与开发

在网页上绘制这类图形，大体有三种实现思路，这里作简短的讨论：

### Div + CSS：简单、粗暴但有效

由于最终生成的 Logo 本质是由成群的矩形组成，最直观和简单的思路是绘制很多 div，并使用 CSS 提供的 `transform` 属性对其进行随机变换。事实上，在尝试为项目做第一张宣传海报的时候，我就采用了这种方案来快速生成 demo：

<figure>
    {% asset_img 4.jpg %}
    <figcaption>Figure 4 - 项目宣传海报：Writing Freewill</figcaption>
</figure>

这张海报中，有横向 13 个、纵向 17 个随机生成的 Logo 堆叠排布。其中第一个 Logo 为正八角星，越向后的 Logo 随机性越大。我们定义一个 Vue 组件 `box`，并为其设置一个 prop `randomi` 作为表现这一随机性的随机因子：

```js
Vue.component('box', {
    props: ['randomi'],
    template: `<div class="box">${bars}</div>`,
})
```

每个黑色的 box 中有四条 bars，它们都是普通的矩形稍作变换。但对于这些 bars，我们需要经过两层变换才能达到效果：
- 第一层变换为纯粹的旋转，令第 `i` 个 bar 旋转 `45i` 度，从而使得四个 bar 可以分别以 0, 45, 90 和 135 度倾角排列成正米字形；
- 第二层变换为随机性变换，这里包含了和随机因子 `randomi` 有关的随机平移和旋转。

由于 [CSS 对同一元素应用多层 transform 支持不佳](https://stackoverflow.com/questions/20902562/how-can-i-apply-multiple-transform-declarations-to-one-element)，为了避免手动计算变换矩阵，这里我们选择在每个 bar 内部套一层 `div` 的方式解决。以下代码只体现了第二层变换，因为首层变换在样式表中就可以定义。

```js
// Generate r by randomize factor
const r = randomi => (Math.random() - 0.5) * randomi
// User r in the randomize transforms (translateX + translateY + rotate) for each bar
let genStyleObj = randomi => {return {transform: `
    translateX(${r(randomi)}px) translateY(${r(randomi)}px) rotate(${r(randomi)}deg)
`}}

// Define the bars
let bars = ''
for (let i = 0; i < 4; i++) bars += `
    <div class="bar bar-${i}">
    <div :style="styles[${i}]"/> 
    </div>
`
```

在设置好页面容器后，我们直接循环 221 次，向容器中添加**随机因子递增的 box**。这里为了实现海报中后面的几十个 box 中的 bar 飞出边界的夸张效果，还需注意保证 box 的 `overflow: visible` 属性。

```js
let boxes = []
for (let i = 0; i < 221; i++) {
    boxes.push({randomi: i * 0.2}) // 第 i 个 box 随机化因子为 0.2i
}

let app = new Vue({
    el: '#app',
    data: { boxes }
})
```

### SVG：性能更优的解决方案

抛开以上用来 demo 的代码，这些可变 Logo 是要作为页面元素大量地出现在实际的 Web 界面中的，我们需要探寻一个能在生产环境中使用的方案。第一件事情就是确定一个严肃的技术选型。经验表明，对于这类大量简单几何图形重复出现的场合，相比大量 `<div>`，使用 SVG 显然是性能更优的解决方案。其次，通过观察产品设计中可能用到的需求，应当对 box 组件进行进一步的功能支持和 API 扩充，比如新的 box 组件显然需要 `size`，`colors` 等其它控制参数。

这一次，我们使用 `vue-cli` 所支持的单文件组件格式编写。这一 Logo 组件是项目中非常重要的组件。为了增强其命名辨识性，我们也给了它一个新名字：Wanderer。

在设计组件内部的布局结构时，我们遇到了一个问题。不同于 div 有 `overflow` 属性可控制，SVG 内部的几何元素是无法超出画布定义的边界的。因此，可以在组件外层标准尺寸的 div 中嵌套一个更大的、居中的 SVG 画布。这样一来，可以允许内部散乱的图形**超出标准尺寸的 div 容器，但仍位于 SVG 画布上**。

<figure>
    {% asset_img 5.png %}
    <figcaption>Figure 5 - 组件的布局结构设计及绘制 SVG 几何图形时需要计算的尺寸值。当随机化导致内容物可能超出容器本身时（见左图），要保证体现给外界尺寸的合理语义，则通常会用到这种「content 尺寸反而大于 container」的模式。</figcaption>
</figure>

在设计稿中，很多应用此 Logo 组件的场景并不只是一个单独的「米」字形，而是绘制在背景的 box 中的，就如 Figure 4 中的海报一样。这里，我们希望背景 box 也作为 Logo 组件的一部分；同时它并不一定是严格的正方形，也会根据随机因子进行变换。

绘制过程编写代码如下：

```js
    // Code inside mounted():
    
    let container = this.$el.querySelector(".wanderer");
    let draw = SVG()
      .addTo(container)
      .size(size * (bleedCoefficient + 1), size * (bleedCoefficient + 1));

    // 由于外包围的矩形也是被随机化的，这里我们使用 SVG polygon 替代 rect，
    // 并对其四个顶点坐标进行随机变换：
    draw
      .polygon(this.randomizeArray([0, 0, 0, size, size, size, size, 0]))
      .attr({ class: "w-polygon", fill: palette[1] })
      .transform({
        translateX: size * (bleedCoefficient / 2),
        translateY: size * (bleedCoefficient / 2),
        scale: polygonScale,
      });
```

其中，`randomizeArray` 是位于 `methods()` 中的方法。我们用它来对一个数组进行逐个数值的随机偏移：

```js
    randomizeArray: function (arr) {
      return arr.map((x) => x + this.r() * 0.3);
    },
```

画好 `polygon` 后，其内部四条 bar 的绘制方法和之前 Div+CSS 方案相仿：

```js
    let groups = new Array(4).fill(draw.group());

    // draw the 4 bars separately
    for (let i = 0; i < 4; i++) {
      let group = groups[i];
      group
        .rect(barThickness, size)
        .attr({
          class: "w-bar",
          x: offsetX,
          y: offsetY,
          fill: palette[0],
        })
        // Transform layer 1: rotate each bar to 0, 45, 90 and 135 degrees
        .transform({
          rotate: i * 45,
        });

      // Transfrom layer 2: randomize each bar
      group.transform({
        translateX: r(),
        translateY: r(),
        rotate: r() * 0.3,
      });
    }
```

在绘制全程，我们都会用到根据 Figure 5 计算出正确的元素尺寸和必要的 offset 值。以上代码中，我们也使用了 [SVG.js](https://svgjs.com/) 工具库中的函数对页面中的 SVG 进行更方便、简短的操控。

写到这一步后，我们可以顺手加一个开启动画效果的选项，让 Logo 可以动起来：

```js
    if (animate) {
      setInterval(() => {
        groups.forEach((group) =>
          group.animate(t).transform({
            translateX: r(),
            translateY: r(),
            rotate: r() * 0.3,
          })
        );
      }, t);
    }
```

### Canvas：缺乏交互性

在进行网页中的图形绘制时，Canvas 总是被拿来用来和 SVG 进行比较。单基于性能层面考虑的话，它供的功能更加原始，并有精确到像素点的渲染控制，理应具有更好的性能表现。但在本项目的应用场景下，Canvas 不能提供 SVG 所具备的丰富交互性，也没有和 SVG 一样同 HTML 文档无缝融合的能力。因此，**就 Logo 组件绘制这一点上来说，我们不考虑使用 Canvas。**

南开通鉴的第二期可能会引入「基于具体位置的校史撰写」，允许用户记录时在 3D 渲染的校园楼梯模型中选择该记忆发生在具体哪处，并在首页提供按照三维空间分布查看记忆条目的选项。到那时，Canvas 会在模型渲染中派上用场。

## 试试效果？

完成组件的大多数功能拓展后，目前暴露给外界的几个主要 props 列举如下：

- `size`：为符合语义的 Logo 自身尺寸；
- `randomness`：随机性，值越大则内部的 bars 应用的 transform 数值越大、图形视觉上越散乱；
- `barThicknessCoefficient`：内部四条 bar 的宽长比，默认为 0.125，即宽为长的 0.125 倍；
- `bleedCoefficient`：出血系数，默认为 0.5，即 SVG 画布尺寸比组件实际尺寸四周各多出 0.25 倍。对于随机性越大的 Logo，此项属性也应该调至较大值，防止绘制碰到边界；
- `palette`：调色板，接收一个长度为 2 的数组，分别为背景色和前景色值；
- `polygonScale`：设置 Logo 外围 box 的相对大小；
- `polygonRandomness`：设置 Logo 外围 box 的随机性；
- `animate`：动画周期，如设置为 0 则禁用动画。

我们尝试引入几个列表渲染的组件，并为它们分配不同的 props，看看可以表现出什么效果。

首先，我们简单地使用 `v-for` 渲染几十次组件，并且根据次数递增粗度 `barThicknessCoefficient`：

```js
    <Wanderer
      v-for="(record, i) in blocks"
      :randomness="0"
      :size="50"
      :barThicknessCoefficient="i / 400"
    />
```

<figure>
    {% asset_img t1.png %}
    <figcaption>Figure T1 - 逐渐变得奇怪的 bars</figcaption>
</figure>

看起来符合预期。接下来，我们尝试重绘一下 Figure 4 中的海报。要重绘这些 box，我们要重设黑底白字的调色板、显现背景多边形，并注入 `randomness` 递增的逻辑。不过这次笔者直接用了 `Math.pow()`，事实证明，指数递增，用力真的很猛。

```js
    <Wanderer
      v-for="(record, i) in blocks"
      :randomness="Math.pow(i, 1.3)"
      :size="50"
      :palette="['white', 'black']"
      :polygonScale="1.5"
    />
```

<figure>
    {% asset_img t2.png %}
    <figcaption>Figure T2 - 用力过猛版本的 Writing Freewill 海报</figcaption>
</figure>

我很好奇如果把尽可能多的属性都随机化会有什么效果。接下来，我向调色盘、Logo 大小、随机系数、bar 的粗度等多个 props 都插入了 `Math.random()`。

很可惜南开通鉴只是一个小项目，不是什么科技巨头，不然这一定是它宣传自己多元、包容价值观的好机会。

```js
    <Wanderer
      v-for="(record, i) in blocks"
      :key="i"
      :randomness="Math.random()*20"
      :polygonRandomness="11"
      :size="Math.random() * 50 + 20"
      :palette="[randomColor(), '#222']"
      :barThicknessCoefficient="Math.random() * 0.33"
    />
```

<figure>
    {% asset_img t3.png %}
    <figcaption>Figure T3 - 愣着干啥，一起 Celebrate Diversity 呀！</figcaption>
</figure>

如果你足够有想象力，甚至可以把这个组件 tweak 到完全看不出原来的米字形 Logo，造就一股误打误撞出的独特艺术气息：

```js
    <Wanderer
      v-for="(record, i) in blocks"
      :randomness="50"
      :polygonRandomness="50"
      :size="50"
      :palette="i % 2 === 0 ? ['white', '#222'] : ['#222', 'white']"
      :barThicknessCoefficient="0.01"
    />
```

<figure>
    {% asset_img t4.png %}
    <figcaption>Figure T4 - 毕加索本索</figcaption>
</figure>

好像还有 `animate` 属性没有用到。如何用呢？我们只需要给这个 prop 设置一个数字，就可以让它动起来。写几句 CSS，也可以直接给它一些可交互性。

<figure>
    {% asset_img t5.gif %}
    <figcaption>Figure T5 - 一句 Animation 让你动起来</figcaption>
</figure>

## 一些其它想法

实验到现在，这个 Logo 组件也不过积累了 200 行代码。实现的逻辑并不难，但感觉挺有趣的，所以写了这篇文章。

在开发过程中，我也不时会冒出一些新的改进产品的点子。比如，当发现随机化各项 props 可以输出如此多样的图形后，我思考到或许可以让用户提交一段校史（一个记忆）时，为它生成一个独一无二的 Logo 图形。这样，当用户通过时间轴（Browse-by-Time 页）或校园地图（Browse-by-Space 页）在成千上万个 Logo 图形中寻找自己的记忆时，就会更容易发现它。

用户也可以自定义自己的记忆 Logo「看起来应该是什么样的」。当然，这也意味着我们的组件本身也需要进一步重构，如 `randomness` 这一参数在渲染某个特定记忆时将不再适用，而是需要扩展出一个新组件，为每条数据存储并渲染颜色、四条 bar 的粗度、各自位置等很多单独的 props。

**最后，这篇文章可能是一篇并不实用的技术文章。**毕竟在普通的项目中，人们很难有这样的机会在这类问题中消耗过多的时间；而且，在计划缜密、分工明确的大工程下，哪怕是 UI/UX 设计师这一角色同软件工程师深度沟通的机会就不多，遑论距离更远的 Branding 部门。

退一步讲，如果不是因为这些阻碍，我想会有很希望看到更多设计新奇、吸引人驻足的 Web 项目出现在市面上。