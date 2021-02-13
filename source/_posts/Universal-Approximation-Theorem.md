---
title: Universal Approximation Theorem
date: 2018-03-11 23:15:02
tags: Math
---

在人工神经网络领域的数学观点中，「**通用近似定理** (Universal approximation theorem，一译万能逼近定理)」指的是：如果一个前馈神经网络具有线性输出层和至少一层隐藏层，只要给予网络足够数量的神经元，便可以实现以足够高精度来逼近任意一个在 {% katex %}\mathbb{R}^n{% endkatex %} 的紧子集 (Compact subset) 上的连续函数。

这一定理表明，只要给予了适当的参数，我们便可以通过简单的神经网络架构去拟合一些现实中非常有趣、复杂的函数。这一拟合能力也是神经网络架构能够完成现实世界中复杂任务的原因。尽管如此，此定理并没有涉及到这些参数的算法可学性 (Algorithmic learnablity)。

通用近似定理用数学语言描述如下：

令 {% katex %}\varphi{% endkatex %} 为一单调递增、有界的非常数连续函数。记 {% katex %}m{% endkatex %} 维单元超立方体 (Unit hypercube) {% katex %}[0,1]^m{% endkatex %} 为 {% katex %}I_m{% endkatex %}，并记在 {% katex %}I_m{% endkatex %} 上的连续函数的值域为 {% katex %}C(I_m){% endkatex %}。则对任意实数 {% katex %}\epsilon > 0{% endkatex %} 与函数 {% katex %}f \in C(I_m){% endkatex %}，存在整数 {% katex %}N{% endkatex %}、常数 {% katex %}v_i, b_i \in \mathbb{R}{% endkatex %} 与向量 {% katex %}w_i \in \mathbb{R}^m (i = 1, ... ,n){% endkatex %}，使得我们可以定义：
{% katex %}
\displaystyle F(x) = \sum_{i=1}^{N} v_i\varphi(w_i^T x + b_i)
{% endkatex %}
为 {% katex %}f{% endkatex %} 的目标拟合实现。在这里， {% katex %}f{% endkatex %} 与 {% katex %}\varphi{% endkatex %} 无关，亦即对任意 {% katex %}x \in I_m{% endkatex %}，有：
{% katex %}
\displaystyle |F(x) - f(x)| < \epsilon
{% endkatex %}
因此，形为 {% katex %}F(x){% endkatex %} 这样的函数在 {% katex %}C(I_m){% endkatex %} 里是**稠密**的。替换上述 {% katex %}I_m{% endkatex %} 为 {% katex %}\mathbb{R}^m{% endkatex %} 的任意紧子集，结论依然成立。

在 1989 年，George Cybenko 最早提出并证明了这一定理在激活函数为 Sigmoid 函数时的特殊情况。那时，这一定理被看作是 Sigmoid 函数的特殊性质。但两年之后，Kurt Hornik 研究发现，造就「通用拟合」这一特性的根源并非 Sigmoid 函数，而是**多层前馈神经网络这一架构本身**。当然，所用的激活函数仍然必须满足一定的弱条件假设，常数函数便是显然无法实现的。

 