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

The schedule layout is inherited from the standard grid layout used in WePeiyang 3.0. We considered changing the design to a stacked linear structure so that the daily schedule component in the home screen can be reused to lower the development workload. However, while the stacked linear design is more commonly seen in apps designed in the west, students in China are more familiar with the grid layout since the elementary schools. 

We decided to go with the grid.

The problem with this option is that all information needs to be displayed on the whole screen at once. The amount of information increases, the space becomes extremely limited, so we needed to eliminate all the unnecessary fields and make the width of a single course block compact.

### Determining Canvas Size

To achieve a responsive layout, we need to make the layout parameters flexible or "computed." The width of the schedule grid can be fixed (to the screen width minus the padding), but the overall height is variable. This variable height, by design, needs to satisfy each of the five requirements below:

- When the phone is in portrait mode, we need to secure a more towering height to make all information fit into the course blocks;
- When the phone is in landscape mode, reduce the height so the screen can display most of the schedule at once;
- On tablets, the course blocks should have a larger size than on landscape phones;
- When more days are displayed in a single week view, the rendered height needs to increase so that course information can fit into an even more narrow course block;
- In cases that the size still can't be adequately auto-determined, allow users to specify a value to adjust it explicitly.

Design the following algorithm:
$$
h_{r}=(h_{m}+\dfrac {h_{s}p}{18-n})N
$$
Where $h_{r}$ represents the overall rendered height, $h_{s}$ is the current window height returned from `Dimensions.get()`, $p$ represents the scale coefficient designated by users, $h_{m}$ stands for the margin heights, and $n$ stands for the displayed days each week. $N$ is the number of course slots each day, which constant equals 12.

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

In the actual implementation, some other details were included as well. For example, when there are more days displayed each week, the margins between the columns would be decreased.

<figure>
    {% asset_img 5or7.png %}
    <figcaption>Figure. The layout in which the displayed days each week is set to 7 and 5, respectively.</figcaption>
</figure>


### Placing Course Blocks

It's easy. Define a vertical absolute layout, then calculate the `top` property according to the formula.

Note that sometimes, the `top` property may be adjusted to create offset to handle the conflicts. We'll further discuss it later.

### Drawing Course Blocks

There are infinite sizes of screens. This causes infinitely many possibilities of the calculated course blocks. A course block can be tall and skinny, squashed, or it can resemble a regular square. Therefore, we need to consider all possible circumstances and, if necessary, to adjust the inner layout in each course block individually.

The course block components displayed on the inner Schedule screen are called `CourseBlockInner`s. A smart enough `CourseBlockInner` should meet the following requirements:

- The layout should be separately designed for the "tall and skinny" blocks and the "short and squatty" ones;
- The font size should be automatically calculated to fit the block;
- Similarly, in cases that the font size still can't be adequately auto-determined, allow users to specify a value to scale it explicitly.

In the implementation, we designed the following logic:

- Calculate the font size according to the detected layout specs for the current course block;
- Preserve a coefficient field for font size adjustment;
- Set a threshold value for the detected width. Use the wide layout when the detected value is above the threshold, use another when below.

The code written here is mostly conditional styles; we'll leave the code and won't go any further into details. Anyway, the results were quite good when we did the actual testing - elegant layout and user experiences were preserved on a variety of screen sizes.

<figure>
    {% asset_img resp.png %}
    <figcaption>Figure. The layout behavior in actual testing for different devices. Screenshots are taken from iOS Simulators.</figcaption>
</figure>



## Resolving Scheduling Conflicts

### What conflicts?

Just like any other timetables, several arrangements in a single time slot can cause conflicts.

<figure>
    {% asset_img conf-types.png %}
    <figcaption>Figure. Common types of conflicts.</figcaption>
</figure>

We can classify the conflicts into the following three types/categories:

- Complete overlap. E.g., two courses both arranged at 8:30 - 10:05 on the same day;
- (Proper) Subset overlap. E.g., two courses arranged on the same day, one at 8:30 - 9:15 and another at 8:30 - 10:05;
- Mutual overlap. E.g., two courses arranged on the same day, one at 8:30 - 10:55 and another at 10:05 - 12:00.

Apart from these, we may also face the case in which:

- Three or more courses engage in one single conflict.

In the course arrangements provided by Tianjin University Academic Affairs Office, conflicts are rare. Most conflicts fall within the category I, which results in the strange conflict handling algorithm designed in WePeiyang 3.0.

In the versions prior to WePeiyang 3.0, the idea, in general, is this: First, design an algorithm to decide whether two given courses conflict or not. secondly, traverse all course arrangements and find all the possible "conflict course clusters." Then, for each cluster, render only one of them with a "conflict" label on it. When you tap such a labeled course block, all courses in this conflict course clusters appear in a popup modal.

**This model was able to get by most of the conflicts in the official course arrangement, but it does not allow us to scale.** Conceivably, as we introduce the "add your own events" feature in the near future, this algorithm would collapse.

### How to render conflicts?

<figure>
    {% asset_img conf1.png %}
    <figcaption>Figure. Some conflict handling designs.</figcaption>
</figure>

WePeiyang 3.0 decided to use Solution III, an algorithm only capable of solving one specific type of conflict and doesn't satisfy the 4.0 requirements anymore. Suppose there were two overlapping course arrangements, one from 8 to 10 and another from 9 to 11. Using solution III, only one of them would be rendered. Although you can see the conflict details via the popup modal, the time slot in the schedule view would **still appear to be vacant though there were actual events**. This behavior violates one basic rule in our UX design guidelines - "Not implementing is better than misleading."

Some other apps, for instance, TimeTable++ on Android, chose to split the track and parallel-render those conflicting events (Solution II). This might be the optimal solution for general scheduling apps, but for WePeiyang 4.0, it severely reduces the already limited space and meanwhile sacrifices the UI appearance.

At last, WePeiyang 4.0 adopted an overlay rendering solution (Solution I). One primary advantage of it is the good perseverance of the original visual elegance and consistency. Still, we need to solve two problems first. One is to ensure that all the course information is "exposed" (i.e., seeable). Also, we need to avoid overlapping one course with another completely in rendering and making it untappable.

<figure>
    {% asset_img conf3.png %}
    <figcaption>Figure. How different categories of conflicts should be rendered for Solution I.</figcaption>
</figure>

The first problem can be solved by giving the course blocks some translucency.

In the visual identity system designed for WePeiyang 4.0, each course has its hashed identity color. Here, we can assign a more transparent color to a course with more credits while ensuring the alpha value be no higher than 0.9.

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

This design utilized the nuanced connection between the importance of the course and the credits of it. For users, or at least from our students' experiences, we tend to care more about the courses with a higher number of credits, hence giving more priority. **By assigning the opacity this way, we can ensure that when several course arrangements conflict, the more important arrangement is more "salient," thus more noticeable in the schedule view.**

The second problem, on the other hand, is solved by a composition of "giving each of the courses in a conflict some **incremental offset/translation**" and "making sure the course **starts later** would be the course **rendered on the top**". The latter only requires the courses are sorted by start time. The former one can be tackled by the following code:

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

In the above code snippet, `crashIndex` keeps track of the current accumulated courses with the same start time. For the $n$th of such a course, the render position will be translated by $20n$ pixels. Once a new course with a different start time is detected, `crashIndex` is reset to zero.

At this point, we can appropriately render all four conflict types mentioned earlier. We ensured that all courses are visible, clickable, and the more critical courses appear more salient.

<figure>
    {% asset_img conf4.png %}
    <figcaption>Figure. Testing a course table replete with different types of conflicts.</figcaption>
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