---
title: 'Thinking in TimeTables: WePeiyang Schedule Screen Design & Implementation'
date: 2019-08-29 15:56:25
tags: Tech
math: true
---

In my recently developing project, [WePeiyang 4.0 React-Native](https://github.com/Cyphexl/WePeiYang-RN), the Schedule module is a well-deserved, most knotty one for its elusive special cases and complicated layout implementation.

To me, however, the hardest part is "how to advance a further step." WePeiyang itself has a 10 years history of development, signifying the weight of its accumulated relevant experiences. The previous major version of WePeiyang, 3.0, has also been through the test of time. It is fully functional and, most importantly, robust, not requiring an immediate upgrade itself. Since I have decided to break this status quo and initiate a new version, there must be a good reason.

<figure>
    {% asset_img wpy3.png %}
    <figcaption>Fig. Schedule Module of WePeiyang 3.0</figcaption>
</figure>

No more story-telling here. In the following pages, I will briefly describe the problems encountered in the requirement, design and development stages, and give an idea about how I managed to solve them.



## Visual Identity Design

Although the development process didn't start until June 2019, the origin of WePeiyang 4.0 can be traced back to a year ago. In 2018, Owlling worked on a conceptual design draft of the new generation of WePeiyang. This draft laid a base of what the application should look like in general. However, it didn't implement the modules that involve relatively complex layout, e.g., GPA and Schedule.

<figure>
    {% asset_img design-all.png %}
    <figcaption>Fig. The conceptual design proposal from Owlling. Only a portion of all layouts required was implemented.</figcaption>
</figure>

The "daily schedule" component in the home screen is essentially a horizontal `ScrollView`. Inside the view, all courses arranged today are shown linearly. Each course has an identity color, and each `CourseBlock` is essentially a rounded rectangle showing course information with a background of that color.

To ensure consistency across the daily schedule component in the home screen and the Schedule module, the identity color and the rounded rectangle shapes were adopted. In addition to this, the palette tone, heading style, TopBar component, and the modal that pops up after clicking on a `CourseBlock` are re-designed to keep consistency across this module and other modules.



## Dotmap

Dotmap is a component that tells users how their time is occupied. It is introduced since WePeiyang 3.0. I'm not the one who designed it, but I like it very much.

<figure>
    {% asset_img dotmap2.png %}
    <figcaption>Fig. The Dotmap abstracts the full schedule into a... well, dot map.</figcaption>
</figure>

In WePeiyang 3.0, the Dotmap is a fixed 5×5 matrix, which means they can have hard-coded dot margin and component size. In WePeiyang 4.0, however, one notable feature is the variability and flexibility of course tables. Users are given choices on determining how many days they want to show each week. While most students have courses arranged between workdays, some of them need to take classes on weekends. If they choose to display from Monday to Sunday, inclusive, then the Dotmap should be of 7×5 size.

We need a more flexible component - for a flexible solution.

To implement such a Dotmap, the ideal layout model is CSS Grid Layout. Sadly, React-Native doesn't ship with those fancy stuff. What should we do? It turns out that we can still achieve that using two nesting Flexbox Layouts. The core idea is to set the inner columns and dots flexboxes to `justify-content: space-between`.

If you catch this core idea, the actual implementation of Dotmap can be very concise and elegant.

```jsx
export function Dotmap(props: DotmapProps) {
  let { dotColor, dotInactiveColor, matrix, dotSize, width, height, style } = props
  matrix = matrix || []

  // ...
  // (Several flexbox style definitions)

  let columns = matrix.map((column, i) => (
    <View style={columnStyle} key={i}>
      {column.map((dot, j) => (
        <View style={dot === 0 ? dotInactive : dotActive} key={j} />
      ))}
    </View>
  ))

  return <View style={[viewStyle, style]}>{columns}</View>
}

```

Runtime screenshots:

<figure>
    {% asset_img dotmap.png %}
    <figcaption>Fig. The Dotmap that can handle even 15 days a week at ease.</figcaption>
</figure>



## Layout

课程表沿用了微北洋 3.0 的经典栅格式布局。我们曾经考虑过，是否修改为单日横向排列，同时复用主页的「当日课程」模块以降低开发难度。但考虑到用户群体大都从小学开始便习惯了单日纵向的课程表，因此决定还是按照纵向栅格式开发。

由于内模块信息量显著增大，布局紧张，因此替换并舍去了课程时间等不再必要的信息，并在手机竖屏下尽可能压缩了横向宽度。此外，我们还添加了各种尺寸屏幕下的响应式布局支持，包括常规手机屏幕的横屏下显示。

### Determining Canvas Size

为实现此响应式布局，首先需要决定课程表的渲染高度。宽度是确定的，大抵就是屏幕减去边距。而高度是可变的，为了让合适的高度能够同时达成以下五个目标：

- 在手机竖屏时，保证渲染高度，以容下课程方块内部的文字；
- 在手机横屏时，尽可能缩小渲染高度，使得屏幕能够一次显示整个课程表（或课程表的大半部分）；
- 在平板电脑类设备尺寸下，整体增加课程方块的大小；
- 当周末同样有课时，每屏显示 7 天课程安排将导致课程方块更加狭窄，此时有必要增加渲染高度，以保证课程方块可容下文字的数量；
- 为应对那些渲染高度仍表现不理想的特殊情况，为用户提供在设置中自定义调节高度的可能。

设计以下高度计算公式：
$$
h_{r}=(h_{m}+\dfrac {h_{s}p}{18-n})N
$$
其中，$h_{r}$ 代表课表的总渲染的高度，$h_{s}$ 为通过 `Dimensions.get()` 得到的当前窗口高度，$p$ 代表用户偏好设置中的高度缩放系数，$h_{m}$ 为 margin 高度，$n$ 为每周渲染天数。$N$ 为每天课时数量，恒等于 12。

这部分的代码核心逻辑如下：

```jsx
// For height, you need to specify height of a single component,
// and the total renderHeight would span.

// Note that the value of pref.scheduleHeight is stored in percentage form (e.g. 67 means 67%). Default to 100.
let timeSlotHeight = (this.state.screenHeight * (pref.scheduleHeight || 100)) / ((18 - daysEachWeek) * 100)

let dateIndicatorHeight = 30
let nTimeSlots = 12
let timeSlotMargin = 12 - daysEachWeek
let renderHeight = (timeSlotHeight + timeSlotMargin) * nTimeSlots + dateIndicatorHeight
let scheduleRenderHeight = renderHeight - timeSlotMargin - dateIndicatorHeight

// For width, you need to specify total renderWidth, which in most cases, is the screen width.
let renderWidth = this.state.windowWidth - 2 * layoutParam.paddingHorizontal
```

实现中还包含了一些细节调整，如对于每周显示天数较多的布局，则天与天之间横向的 margin 也会略有缩小。

<figure>
    {% asset_img 5or7.png %}
    <figcaption>Fig. 每周显示 5 天或 7 天时的布局（运行于 OnePlus 5T）</figcaption>
</figure>

### Placing Course Blocks

放置课程方块。很简单，对每天的视图绘制纵向绝对布局，并根据公式计算 `top` 距离即可。

需要注意的是，`top` 距离可能会因为冲突而需要增加一定的偏移，这点我们稍后会讨论。

### Drawing Course Blocks

屏幕尺寸是千变万化的，课程方块本身的尺寸变数同样很大。有可能极度瘦长，有可能扁平，也有可能接近正方形。因此，有必要对每一种情况考虑周全的优化，如有必要，或对内部布局安排做出调整。

显示于课程表屏幕上的课程方块组件名为 `CourseBlockInner`。一个足够 smart 的 `CourseBlockInner` 组件应该满足以下几点需求：

- 对于渲染出的宽式方块和窄式方块，应当分配各自适应的布局；
- 字号应该随方块本身的宽高动态调整，避免文字溢出，或是在平板设备上文字过小的问题；
- 同样地，为应对那些渲染字号仍表现不理想的特殊情况，为用户提供在设置中自定义调节的可能。

实现时设计以下逻辑：

- 根据宽高的最小值来确定字号基础尺寸；
- 为所有字号尺寸保留一个用户可调节的系数；
- 当组件本身宽度有限时，采用窄式布局；否则采用宽式布局，课名独占一行，教师名和上课地点共占一行。

这部分的代码大多数是条件样式，此处不再赘述。

总之，最终实际运行时，在不同设备上都保持了较好的布局效果和用户体验：

<figure>
    {% asset_img resp.png %}
    <figcaption>Fig. 响应式布局的实现效果（运行于 iOS Simulator）</figcaption>
</figure>


## Resolving Scheduling Conflicts

### What conflicts?

和其它的时间表一样，同一时间的重叠时间安排会造成冲突。

<figure>
    {% asset_img conf-types.png %}
    <figcaption>Fig. 几种常见的冲突 case</figcaption>
</figure>

常见的冲突可归类为以下三种：

- 完全重叠的冲突。如两节都安排在 8:30 - 10:05 的课程；
- 具有包含关系的冲突。如安排在同一天 8:30 - 9:15 和 8:30 - 10:05 的课程；
- 交叠的冲突。如安排在同一天 8:30 - 10:55 和 10:05 - 12:00 的课程。

此外，还需要考虑一种情况：

- 三门及以上课程同时发生冲突。

对天津大学教务系统给出的课程安排，冲突本身是较为罕见的情况；而由于大多课程都是固定时段的 2 节为一单位，大多数冲突都属于第一种 (完全重叠的冲突)。

在微北洋 3.0 及以前的版本，实现的冲突处理思路大致是这样的：**通过查找冲突课程的算法，筛选出有任何一种时间重叠关系的冲突课程，形成冲突组；对于每组冲突课程，只渲染其中一节，但右上角会显示冲突标签，并可在点击后弹出多节课程的详情。**

显然，这一冲突处理逻辑也只能解决以上第一种情形，而对交叠或包含关系的冲突课程无能为力。

**目前，尽管这类特殊的冲突情形还很难触发，但当课程表引入自定义事件等扩展模块之后，此架构的表现不会很乐观。**

### How to render conflicts?

<figure>
    {% asset_img conf1.png %}
    <figcaption>Fig. 一些渲染冲突的思路</figcaption>
</figure>

微北洋 3.0 选择了舍弃涉及冲突的课程，只保留渲染其中一节的思路。这种思路已经不再适用于扩展架构。假设某天有一节 1-3 节和一节 2-4 节的冲突课程，而只渲染其中一节，那么会导致**本来有课的时间段再课程表上表现为空闲**。这违反了课程表的一条交互设计准则：「哪怕不去实现，也不要去误导用户」。

部分软件，如 Android 平台上目前功能最为完备的日程可视化 App TimeTable++，选择了通过将冲突时段再分成多列，并在每列上并行渲染的方法。对于通用的日程可视化来说，这是值得考虑的稳妥方案之一，但严重牺牲了 UI 美观作为代价。此外，具体到微北洋的课程表显示，分成多列后过于狭窄的课程方块会变得几乎无法容纳课程名称。

最终，微北洋 4.0 选用了使用叠加渲染的思路。它的显著好处之一是不会破坏视觉的整齐和一致感。具体到开发中，此思路下需要解决的问题有两个：

- 保证每个方块的课程名都可见
- 保证任何一个冲突课程不会被完全叠住，导致无法被点击。

<figure>
    {% asset_img conf3.png %}
    <figcaption>Fig. 本思路下对于不同冲突类型的渲染方案</figcaption>
</figure>

对于第一个问题，我们可以通过赋予课程方块一定的透明度来解决。

在微北洋的整体视觉方案中，每一个课程有根据其学分 hash 出的固定颜色，在这里，我们指定学分越低的课程映射到更高透明度的颜色上，并保证所有颜色至少拥有 10% 不透明度：

```ts
const defaultPalette = {
  // other palettes
  schedule: [
    rgba(x, y, z, 0.9),
    rgba(x, y, z, 0.8),
    rgba(x, y, z, 0.7),
    rgba(x, y, z, 0.6),
    rgba(x, y, z, 0.45),
  ].map(c =>
    Color(c)
      .fade(0.1)
      .toString(),
  )
}
```

这一设计巧妙地利用了透明度与学分关联的特性。对于用户来说，学分越高的课程通常越重要，也意味着更高的优先级**。这保证了当多个课程发生冲突时，更重要的课程更醒目，更容易被清楚地看见。**

而对于第二个问题，可以通过「对开始时间相同的一组冲突课程做**逐个位置偏移**」+「保证开始时间更晚的课程**总是渲染在上一层**」两个条件组合来达成。

要满足第二个条件，只需保证计算每日课程的函数中，返回的数据根据课程开始时间排好序即可。

要满足第一个条件 - 逐个位置偏移，逻辑实现如下。`crashIndex` 记录目前已经积累的开始时间相同的课程个数，对于第 $n$ 个这样的课程，渲染位置向下偏移 $20n$ 像素。凡是检测到下一个课程开始时间不再一样，则 `crashIndex` 清零。

```jsx
let crashIndex = 0
day.courses
  .filter(c => c.thisWeek)
  .map((c, j, arr) => {
    let start = Number(c.activeArrange.start) - 1
    let end = Number(c.activeArrange.end)

    // If detected 2 courses with the same start time, translate the late rendered one
    let verticalPosition = start * (timeSlotHeight + timeSlotMargin)
    if (j > 0) {
      if (arr[j].activeArrange.start === arr[j - 1].activeArrange.start) {
        crashIndex += 1
        verticalPosition += crashIndex * 20
      } else {
        crashIndex = 0
      }
    }
    return <CourseBlockInner
      style={{
        position: "absolute",
        top: verticalPosition,
      }}/>
  })
```

至此，我们可以保证对于一开始提到的**四类课程冲突模式**，都可以实现正常渲染，且每一门冲突课程**可点击、课程名可视**，同时也实现了冲突发生时更重要的课程显示更醒目。

<figure>
    {% asset_img conf4.png %}
    <figcaption>Fig. 测试实现效果</figcaption>
</figure>


## Dealing with Not-This-Week Courses

非本周课程指那些在其它周有安排，而本周尚未开课的课程。

微北洋显示非本周课程由来已久。它们被设计为浅灰色的课程方块，并附加了非本周的标签提示。显示这些课程看起来似乎不是太艰巨的任务，但在尝试设计实现其逻辑时， 我们遇到了一些困难。具体来说：**假设每周五第一节在 2-8 周有课程 A，在 9-16 周有课程 B，那么在第一周时，那里应该渲染非本周课程 A 还是课程 B？**

微北洋 3.0 的代码逻辑似乎没有太在意这一点，具体测试时，它表现为选择靠后的其中一节显示。这似乎不太优雅。

更棘手的问题在后面：**假设课程 A 和课程 B 有交叠或包含关系，应该如何渲染？如果某个时间段拥有三节或者更多节课程包括了交叠、包含和重叠等多种关系，又应该如何渲染？**

<figure>
    {% asset_img not-this-week.png %}
    <figcaption>Fig. 渲染非本周课程的难题</figcaption>
</figure>
*非本周课程也可能会互相产生冲突。*此时，仅显示其中靠后的一节已经行不通了 —— 这不再只是不优雅的问题，而是 misleading。

同样地，虽然目前的微北洋拥有这个问题，但毕竟属于不常见情况，也许还未引起用户的注意，但当自定义事件引入后，这一问题也将同样变得不可忽视。

在解决冲突之前，我们对此问题提出的唯一可行解决方案是这样的：

> 计算出那些在*每一周*都无安排的时间段 $L$，取其补集，得到*可能有*非本周课程的所有时间段 $\overline{L}$。在渲染正常课程时，同时渲染 $\overline{L}$ 所包含的时间段在下一层，标记为「非本周可能有课」。至于具体哪个时间段在非本周可能有那些课，则完全无法判定，因为**引入自定义事件后每周的交叠空闲时间段是不定形的**。

这一解决方案将带来庞大的代码量，和更加难以让后人维护的渲染逻辑。我们几乎将要放弃渲染非本周课程，但在设计完正常课程的冲突渲染方案后，我们意识到重叠渲染也可以应用到非本周课程上。不同的是，非本周课程无需再根据冲突处理位置偏移，因为它们本来便是不可点击的。

这样一来，似乎还算优雅地处理掉了面临的问题：不会再出现 misleading 的空闲时间，同时保证了在大多数固定课时的情况下非本周课名的正常显示。

<figure>
    {% asset_img not-this-week-2.png %}
    <figcaption>Fig. 解决方案：无需再处理冲突的重叠渲染</figcaption>
</figure>

当然，由于「非本周」课程的显示本身就是课程表的 anti-pattern，我们也为用户们提供了不显示非本周课程的选项。如果此项被勾选，那么在课程表的空闲日，会从 Google Material Icons 中随机挑选一个 Icon 作为建议的课余活动，渲染到当天的日程中。



## Caching

由一个课程安排生成每学期的详细课表的函数 `getFullSchedule()`，需要对学期的每一天调用 `getCoursesByDay()`。这两个函数都是整个微北洋 App 中相当复杂的函数：

```jsx
export const getFullSchedule = (data, daysEachWeek) => {
  let weeks = []
  for (let week = 1; week <= WEEK_LIMIT; week++) {
    let occupiedIndex = 0
    let days = []
    let matrix = []
    for (let day = 1; day < daysEachWeek + 1; day++) {
      let termStart = Number(data.term_start) * 1000
      let thisDay = termStart + ((week - 1) * 7 + (day - 1)) * 86400000
      let courses = getCoursesByDay(thisDay, data)
      days.push({
        day: day,
        timestamp: thisDay,
        courses: courses,
      })
      let column = [0, 0, 0, 0, 0]
      courses.forEach(course => {
        if (course.thisWeek) {
          let start = Number(course.activeArrange.start)
          let end = Number(course.activeArrange.end)
          for (let timeSlot = start; timeSlot <= end; timeSlot++) {
            occupiedIndex += 1
            column[mapTimeSlotToFlatIndex(timeSlot)] += 1
          }
        }
      })
      matrix.push(column)
    }
    weeks.push({
      week,
      days,
      matrix,
      occupiedIndex,
    })
  }
  console.log("Full schedd", weeks)
  return weeks
}

export const getCoursesByDay = (timestamp, data) => {
  let now = new Date(timestamp)
  let semesterStart = data.term_start * 1000
  let currentWeek = getWeek(timestamp, semesterStart)
  let res = []
  data.courses.forEach(course => {
    course.arrange.forEach(arrangement => {
      let dayOfWeek = now.getDay()
      if (arrangement.day === "7") arrangement.day = "0"
      if (Number(arrangement.day) === dayOfWeek) {
        // 星期几符合
        if (course.week.start <= currentWeek && currentWeek <= course.week.end) {
          // 在开始结束周数之内
          if (
            !(
              (arrangement.week === "单周" && currentWeek % 2 === 0) ||
              (arrangement.week === "双周" && currentWeek % 2 === 1)
            )
          ) {
            // 没有被卡单双周
            // Arranged this week!
            res.push({
              ...course,
              activeArrange: arrangement,
              thisWeek: true,
            })
          }
        } else {
          // 符合显示非本周课程定义
          res.push({
            ...course,
            activeArrange: arrangement,
            thisWeek: false,
          })
        }
      }
    })
  })
  // 额外一步检查：是否选定的"非本周"课程中，有无和本周课程当天时间安排完全一样的？
  // 如果有，应当去除，因为它会完全和本周课程重叠绘制，从而无需绘制
  res = res.filter(course => {
    if (!course.thisWeek) {
      for (let i = 0; i < res.length; i++) {
        let anotherCourse = res[i]
        if (
          anotherCourse.thisWeek &&
          anotherCourse.activeArrange.start === course.activeArrange.start &&
          anotherCourse.activeArrange.end === course.activeArrange.end
        ) {
          return false
        }
      }
    }
    return true
  })
  // 排序结果，保证开始时间靠后的课程总是后渲染，避免重叠或冲突课程时，先渲染的课程被完全覆盖而无法触发点按
  res.sort((a, b) => {
    return a.activeArrange.start - b.activeArrange.start
  })
  return res
}
```

`getFullSchedule()` 是一个昂贵的操作，它具有以学期天数、学期总课程数和每个课程的时间安排数为底的三次多项式复杂度（我们显然可以设计更高效的算法，但遍历每日的安排，保证了自定义事件模块的可拓展性）。如果每次进入课程表界面都需重新计算一遍详细课表，用户在进入课表时会感受到明显的卡顿。

因此，缓存是必要的。

```jsx
if (course.generated && course.generated[0].days.length === daysEachWeek) {
  // Cached branch
  weeks = course.generated
} else {
  // Costly branch
  weeks = getFullSchedule(course.data, daysEachWeek)
  this.props.setGeneratedSchedule(weeks)
}
```

像这样。详细课表将在首次生成后被存储在 Redux Store 中，并使用 `redux-persist` 实现持久化。

同时，`getFullSchedule()` 的逻辑被写进了通过网络请求获取课表的逻辑，意味着如果用户通过下拉刷新的方式尝试获取新课表，那么这一耗费性能的操作将会重新运行一遍，以保证数据的一致性 —— 这看起来还好，因为网络请求显然比计算课表更加昂贵，因此刚好可以忽略不计。



## Afterwords

在开发（广义的）前端界面时，一些对人类行为习惯和认知的理解，一些对生活的观察，和解决实际问题的算法，很可能比一个优化到极致的高效算法更加重要。

我们不会只需要精通 C++、熟背各种数据结构，日常同指针、队列和链表打交道的工程师。这个世界上还有很多问题需要解决。我相信每个问题都有它的位置。