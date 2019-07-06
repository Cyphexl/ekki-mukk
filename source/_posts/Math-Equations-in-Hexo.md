---
title: 'Rendering Math Equations in Hexo'
date: 2019-06-21 12:14:43
tags: [Math, Tech]
math: true
---

在经历了庞大而笨重的 WordPress 框架一年半的折磨之后，我终于决定转向 Hexo。我希望新站点能够轻量一些，但同时满足一些技术文章写作的基本要求，其中之一就是数学公式渲染。

原生 Hexo 使用的 Markdown 渲染器并不支持在文档中直接使用 `$...$` 语法输入数学公式，因此，这又是一件需要自己动手的事情。如果你 Google 一下在 Hexo 中使用数学公式的解决方案，会发现推荐的工具之一是 hexo-math。

## 转义与兼容性

[Hexo-math](https://github.com/hexojs/hexo-math) 是目前使用最广泛的 Hexo 数学公式插件，它集成了对 MathJax 和 KaTeX 两个渲染引擎的支持。安装的过程很简单：

```
npm install hexo-math --save
```

配置完成后，文章中就可以直接输入 LaTeX 表达式。但是，对于 LaTeX 语法中的任何特殊字符，如极为常见的 `\`，都需要做额外转义以防止被 Markdown 先行解析。官方文档的解释如下：

> You can use inline math syntax directly. But always remember to escape any special characters by adding a `\` before it. LaTex equations usually contains tones of special characters like `\`, which makes it painful to escape them one by one. In such cases, you can use hexo-math's tags to make your life easier.

文档给出的一个解决方案是使用 Hexo-math 指定的 tag，如对于表达式 `\cos 2\theta`，为了防止特殊字符带来的转义麻烦，你需要使用 `{% raw %}{% math %} ... {% endmath %}{% endraw %}` 来包含它，而不是更加通用的 `$...$`。

这并不是一个很好的方案，因为 Hexo-math tags 的不通用性会影响文章在其它地方的发布，且在本地编辑时也极其痛苦。我们需要一个能够被标准 LaTeX 引擎识别和兼容的替代。

## Pandoc 总是对的

在我浏览的不少文章中，都曾发现过类似插件的转义与兼容问题。他们推荐的另一款插件是 [Hexo-renderer-pandoc](https://github.com/wzpan/hexo-renderer-pandoc)。Pandoc 作为社区中最为完善、成熟的标记语言转换库，对 Markdown 和 LaTeX 混排的支持实现更加优雅和到位：它会先照顾 LaTeX 表述，防止其中的特殊字符被 Markdown 先行处理。

卸载 Hexo 自带的默认 Markdown 渲染引擎，并用它取代之：

```
npm uninstall hexo-renderer-marked --save
npm install hexo-renderer-pandoc --save
```

问题在于，仅仅安装 Hexo-renderer-pandoc 只能将 Markdown 文档的数学公式部分识别出来，并渲染成带 math 类的 DOM 节点，并不会对 DOM 节点里的 LaTeX 文本渲染成可视的数学公式。

我阅读的那些使用了 Hexo-renderer-pandoc 的文章都是基于 NexT 主题的。[NexT](https://github.com/theme-next/hexo-theme-next) 是非常受欢迎的一套 Hexo 主题，包含了对于数学公式渲染的支持，因此自然解决了最后这一步。但它本身过于庞大，且视觉效果上并不能令人完全满意。而我需要一个尽可能的更轻量级的主题框架，完全掌控它，并在其上有能力做完全自主的拓展。

目前我所使用的主题是 [Cactus](https://probberechts.github.io/hexo-theme-cactus/)，我不得不在其源码上做改动，让它集成进对 MathJax 和 KaTeX 的支持。

## 自己动手，丰衣足食

在这之前，我对 Hexo 的主题制作和文件结构是完全陌生的。根据我的观察，Cactus 主题使用了 [ejs](https://ejs.co/) 语法来实现 HTML 文档的模板渲染和编写 —— 这也是我之前未曾听说过的语法。但由于主题本身很轻量，文件并不多，我很容易便定位到了负责渲染出页面的 layout.ejs 文件。其代码如下：

```ejs
<!DOCTYPE html>
<html<%= config.language ? " lang=" + config.language.substring(0, 2) : ""%>>
<%- partial('_partial/head') %>
<body class="max-width mx-auto px3 <%- theme.direction -%>">
    <% if (is_post()) { %>
      <%- partial('_partial/post/actions_desktop') %>
    <% } %>
    <div class="content index py4">
        <% if (!is_post()) { %>
          <%- partial('_partial/header') %>
        <% } %>
        <%- body %>
        <% if (is_post()) { %>
          <%- partial('_partial/post/actions_mobile') %>
        <% } %>
        <%- partial('_partial/footer') %>
    </div>
    <%- partial('_partial/styles') %>
    <%- partial('_partial/scripts') %>
</body>
</html>
```

为了实现数学公式渲染的模块，我们需要在 _partial 文件夹下新建 math.ejs，并且将引用包含进上面页面模板的 `</body>` closetag 之前：

```ejs
<%- partial('_partial/math') %>
```

至于如何实现 math.ejs 中的逻辑，最简单的方法是直接写入静态 HTML，在每个页面上都加载数学公式渲染引擎。但这显然会带来性能问题。我参考了 NexT 主题中的实现，大致思路是将每一个页面是否会用到数学公式渲染独立到它自己的 front-matter 中。

在全局的 config.yml 中设计并添加以下配置项：

```yml
# Math
mathEngine: 'katex' # 'katex' or 'mathjax'
math:
  enable: true
  all_pages: false
  mathjax:
    src: //cdn.bootcss.com/mathjax/2.7.1/latest.js?config=TeX-AMS-MML_HTMLorMML
  katex:
    src:
      css: https://cdn.jsdelivr.net/npm/katex@0.10.2/dist/katex.min.css
      js: https://cdn.jsdelivr.net/npm/katex@0.10.2/dist/katex.min.js
      autorender: https://cdn.jsdelivr.net/npm/katex@0.10.2/dist/contrib/auto-render.min.js
```

我们保留了一个全局开关 `math.enable`，和一个是否在所有页面上默认开启的参数 `math.all_pages`。

如果设置为独立决定每篇文章是否开启，在文章首部添加 Front-matter 信息如下：

```markdown
---
title: Universal Approximation Theorem
date: 2019-06-20 23:15:02
math: true
---

# Main Article
...
```

接下来，可以实现 `math.ejs` 中的逻辑，主要判断两方面：

- 是否需要加载数学公式渲染引擎
- 需要加载时，是使用 MathJax 还是 KaTex

```ejs
<% if (theme.math.enable) { %>
  <% if (page.math || theme.math.all_pages) { %>

    <% if (config.mathEngine == 'mathjax') { %>
      <script type="text/javascript" src="<%= config.math.mathjax.src %>"></script>
      <script type="text/x-mathjax-config">
        MathJax.Hub.Config({
          tex2jax: {
            inlineMath: [ ['$','$'], ["\\(","\\)"]  ],
            processEscapes: true,
            skipTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code']
          }
        });
      </script>
      <script type="text/x-mathjax-config">
        MathJax.Hub.Queue(function() {
          var all = MathJax.Hub.getAllJax(), i;
          for (i=0; i < all.length; i += 1) {
            all[i].SourceElement().parentNode.className += ' has-jax';
          }
        });
      </script>
    <% } %>

    <% if (config.mathEngine == 'katex') { %>
      <link rel="stylesheet" href="<%= config.math.katex.src.css %>" crossorigin="anonymous">
      <script defer src="<%= config.math.katex.src.js %>" crossorigin="anonymous"></script>
      <script
        defer
        src="<%= config.math.katex.src.autorender %>"
        crossorigin="anonymous"
        onload="renderMathInElement(document.body)">
      </script>
    <% } %>

  <% } %>
<% } %>
```

我选择了 KaTeX，因为我更相信年轻的事物。

现在，清理缓存，重新编译部署，会发现 $\LaTeX$ 公式已经可以按照自己想要的效果渲染。

$$
\displaystyle {1 +  \frac{q^2}{(1-q)}+\frac{q^6}{(1-q)(1-q^2)}+\cdots }= \prod_{j=0}^{\infty}\frac{1}{(1-q^{5j+2})(1-q^{5j+3})}, \quad\quad \text{for }\lvert q\rvert<1.
$$

就是这样。🖉


